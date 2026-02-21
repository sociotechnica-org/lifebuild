import type { Store as LiveStore } from '@livestore/livestore'
import { queryDb } from '@livestore/livestore'
import { events, tables } from '@lifebuild/shared/schema'
import type { Project } from '@lifebuild/shared/schema'
import { logger, createContextLogger } from '../utils/logger.js'
import type { StoreManager } from './store-manager.js'

interface ProjectImageConfig {
  promptTemplate: string
  nanoBananaApiUrl: string
  nanoBananaApiKey?: string
  nanoBananaModel: string
  workerUploadUrl: string
}

interface ImagePayload {
  buffer: Buffer
  contentType: string
}

const DEFAULT_PROMPT_TEMPLATE =
  'Create a polished, high-quality project icon for "{{projectName}}". ' +
  'Use the project description "{{projectDescription}}" and category "{{projectCategory}}" for inspiration. ' +
  'Style: minimal, modern, and brand-safe. Square composition, no text.'

const buildPrompt = (project: Project, template: string): string => {
  const safe = (value: string | null | undefined, fallback: string) =>
    value && value.trim() ? value.trim() : fallback
  return template
    .replace(/{{projectName}}/g, safe(project.name, 'Untitled project'))
    .replace(/{{projectDescription}}/g, safe(project.description, 'No description provided'))
    .replace(/{{projectCategory}}/g, safe(project.category ?? undefined, 'general'))
    .replace(/{{projectId}}/g, project.id)
}

const parseAttributes = (attributes: Project['attributes']): Record<string, unknown> => {
  if (!attributes) return {}
  if (typeof attributes === 'string') {
    try {
      return JSON.parse(attributes) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return attributes as Record<string, unknown>
}

const resolveCoverImage = (attributes: Record<string, unknown>): string | null => {
  const value = attributes.coverImage
  return typeof value === 'string' ? value : null
}

const resolveProjectRecord = (store: LiveStore, projectId: string): Project | null => {
  const results = store.query(
    queryDb(tables.projects.select().where('id', '=', projectId), {
      label: `project-image-service.project:${projectId}`,
    })
  ) as Project[]
  return results[0] ?? null
}

const extractImageFromResponse = async (response: Response): Promise<ImagePayload> => {
  const contentType = response.headers.get('content-type')
  if (contentType && !contentType.includes('application/json')) {
    const buffer = Buffer.from(await response.arrayBuffer())
    return { buffer, contentType }
  }

  const data = (await response.json()) as Record<string, any>
  const base64 =
    data.imageBase64 ||
    data.image_base64 ||
    data.base64 ||
    data.data?.[0]?.b64_json ||
    data.data?.[0]?.base64 ||
    null

  if (base64 && typeof base64 === 'string') {
    return { buffer: Buffer.from(base64, 'base64'), contentType: 'image/png' }
  }

  const url =
    data.imageUrl ||
    data.image_url ||
    data.url ||
    data.data?.[0]?.url ||
    data.data?.[0]?.imageUrl ||
    null

  if (url && typeof url === 'string') {
    const imageResponse = await fetch(url)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image asset: ${imageResponse.status}`)
    }
    const imageContentType = imageResponse.headers.get('content-type') || 'image/png'
    const buffer = Buffer.from(await imageResponse.arrayBuffer())
    return { buffer, contentType: imageContentType }
  }

  throw new Error('Nano Banana Pro response did not include image data')
}

const createConfig = (): ProjectImageConfig | null => {
  const nanoBananaApiUrl = process.env.NANO_BANANA_PRO_API_URL
  const workerUploadUrl =
    process.env.PROJECT_IMAGE_UPLOAD_URL ||
    process.env.LIVESTORE_SYNC_URL?.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:') ||
    ''

  if (!nanoBananaApiUrl || !workerUploadUrl) {
    return null
  }

  return {
    promptTemplate: process.env.PROJECT_IMAGE_PROMPT_TEMPLATE || DEFAULT_PROMPT_TEMPLATE,
    nanoBananaApiUrl,
    nanoBananaApiKey: process.env.NANO_BANANA_PRO_API_KEY,
    nanoBananaModel: process.env.NANO_BANANA_PRO_MODEL || 'nano-banana-pro',
    workerUploadUrl,
  }
}

export class ProjectImageService {
  private readonly config = createConfig()
  private readonly subscriptions = new Map<string, () => void>()
  private readonly knownProjects = new Map<string, Set<string>>()
  private readonly initializedStores = new Set<string>()
  private readonly inFlight = new Map<string, Set<string>>()

  constructor(private readonly storeManager: StoreManager) {
    if (!this.config) {
      logger.warn(
        'Project image service disabled: missing Nano Banana or upload endpoint configuration'
      )
    }
  }

  start(): void {
    if (!this.config) {
      return
    }

    for (const [storeId, store] of this.storeManager.getAllStores()) {
      this.registerStore(storeId, store)
    }

    this.storeManager.on('storeReconnected', ({ storeId, store }) => {
      this.registerStore(storeId, store)
    })

    this.storeManager.on('storeDisconnected', ({ storeId }) => {
      this.unregisterStore(storeId)
    })
  }

  async regenerateProjectImage(
    storeId: string,
    projectId: string,
    actorId?: string
  ): Promise<string> {
    return this.generateAndAttachImage(storeId, projectId, {
      actorId,
      force: true,
      reason: 'manual_regenerate',
    })
  }

  private registerStore(storeId: string, store: LiveStore): void {
    if (!this.config) {
      return
    }

    this.unregisterStore(storeId)

    const query = queryDb(tables.projects.select(), {
      label: `project-image-service.projects:${storeId}`,
    })

    const unsubscribe = store.subscribe(query as any, (records: Project[]) => {
      this.handleProjectUpdates(storeId, store, records)
    })

    this.subscriptions.set(storeId, unsubscribe)
  }

  private unregisterStore(storeId: string): void {
    const unsubscribe = this.subscriptions.get(storeId)
    if (unsubscribe) {
      unsubscribe()
      this.subscriptions.delete(storeId)
    }
    this.knownProjects.delete(storeId)
    this.initializedStores.delete(storeId)
    this.inFlight.delete(storeId)
  }

  private handleProjectUpdates(storeId: string, store: LiveStore, records: Project[]): void {
    if (!this.config) {
      return
    }

    const known = this.knownProjects.get(storeId) ?? new Set<string>()
    this.knownProjects.set(storeId, known)

    if (!this.initializedStores.has(storeId)) {
      records.forEach(project => {
        if (project?.id) {
          known.add(project.id)
        }
      })
      this.initializedStores.add(storeId)
      return
    }

    records.forEach(project => {
      if (!project?.id || known.has(project.id)) {
        return
      }
      known.add(project.id)
      const attributes = parseAttributes(project.attributes)
      if (resolveCoverImage(attributes)) {
        return
      }
      this.generateAndAttachImage(storeId, project.id, { reason: 'auto_create' }).catch(() => {})
    })
  }

  private async generateAndAttachImage(
    storeId: string,
    projectId: string,
    options: { actorId?: string; force?: boolean; reason: string }
  ): Promise<string> {
    if (!this.config) {
      throw new Error('Project image service is not configured')
    }

    const inFlight = this.inFlight.get(storeId) ?? new Set<string>()
    if (inFlight.has(projectId)) {
      throw new Error('Project image generation already in progress')
    }
    inFlight.add(projectId)
    this.inFlight.set(storeId, inFlight)

    const log = createContextLogger({
      storeId,
      operation: 'project_image_generate',
      projectId,
      reason: options.reason,
    })

    try {
      const store = this.storeManager.getStore(storeId)
      if (!store) {
        throw new Error(`Store ${storeId} is not available`)
      }

      const project = resolveProjectRecord(store, projectId)
      if (!project) {
        throw new Error(`Project ${projectId} not found`)
      }

      const attributes = parseAttributes(project.attributes)
      if (!options.force && resolveCoverImage(attributes)) {
        throw new Error('Project already has a cover image')
      }

      const prompt = buildPrompt(project, this.config.promptTemplate)
      log.info({ prompt }, 'Generating project image with Nano Banana Pro')

      const response = await fetch(this.config.nanoBananaApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.nanoBananaApiKey
            ? { Authorization: `Bearer ${this.config.nanoBananaApiKey}` }
            : {}),
        },
        body: JSON.stringify({
          prompt,
          model: this.config.nanoBananaModel,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`Nano Banana Pro failed: ${response.status} ${errorText}`)
      }

      const imagePayload = await extractImageFromResponse(response)
      const extension = imagePayload.contentType.split('/')[1] || 'png'
      const filename = `${projectId}-${crypto.randomUUID()}.${extension}`
      const formData = new FormData()
      const arrayBuffer = Uint8Array.from(imagePayload.buffer).buffer
      formData.append('file', new Blob([arrayBuffer], { type: imagePayload.contentType }), filename)

      const serverToken = process.env.SERVER_BYPASS_TOKEN
      if (!serverToken) {
        throw new Error('SERVER_BYPASS_TOKEN not configured for image upload')
      }

      const uploadResponse = await fetch(`${this.config.workerUploadUrl}/api/upload-image`, {
        method: 'POST',
        headers: {
          'X-Server-Token': serverToken,
        },
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text().catch(() => '')
        throw new Error(`Image upload failed: ${uploadResponse.status} ${errorText}`)
      }

      const uploadPayload = (await uploadResponse.json()) as { url?: string }
      if (!uploadPayload.url) {
        throw new Error('Image upload response missing url')
      }
      const publicUrl = uploadPayload.url

      // Re-read attributes right before commit to avoid overwriting concurrent changes
      const freshProject = resolveProjectRecord(store, projectId)
      const freshAttributes = parseAttributes(freshProject?.attributes ?? null)

      const updatedAttributes = {
        ...freshAttributes,
        coverImage: publicUrl,
        coverImageUpdatedAt: new Date().toISOString(),
      }

      store.commit(
        events.projectCoverImageSet({
          projectId,
          coverImageUrl: publicUrl,
          attributes: updatedAttributes,
          updatedAt: new Date(),
          actorId: options.actorId,
        })
      )

      log.info({ publicUrl }, 'Project image stored and linked to project')
      return publicUrl
    } catch (error) {
      log.error({ error }, 'Project image generation failed')
      throw error
    } finally {
      inFlight.delete(projectId)
    }
  }
}
