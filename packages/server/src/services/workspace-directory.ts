import { operationLogger } from '../utils/logger.js'

const logger = operationLogger('workspace_directory')

export interface WorkspaceDirectoryEntry {
  instanceId: string
  userId?: string
  name?: string
  createdAt?: string
  lastAccessedAt?: string
  isDefault?: boolean
}

export interface WorkspaceDirectory {
  listWorkspaces(): Promise<WorkspaceDirectoryEntry[]>
}

export interface AuthWorkerWorkspaceDirectoryOptions {
  baseUrl: string
  serverBypassToken: string
  fetcher?: typeof fetch
}

export class AuthWorkerWorkspaceDirectory implements WorkspaceDirectory {
  private readonly baseUrl: string
  private readonly serverBypassToken: string
  private readonly fetcher: typeof fetch

  constructor(options: AuthWorkerWorkspaceDirectoryOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '')
    this.serverBypassToken = options.serverBypassToken
    this.fetcher = options.fetcher ?? fetch
  }

  async listWorkspaces(): Promise<WorkspaceDirectoryEntry[]> {
    const url = new URL('/internal/workspaces', this.baseUrl).toString()

    let response: Response
    try {
      response = await this.fetcher(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.serverBypassToken}`,
        },
      })
    } catch (error) {
      logger.error({ error }, 'Failed to fetch workspaces from Auth Worker')
      throw new Error('Failed to contact Auth Worker for workspace list')
    }

    if (!response.ok) {
      const body = await safeReadBody(response)
      logger.error(
        { status: response.status, body },
        'Auth Worker returned error while listing workspaces'
      )
      throw new Error(`Auth Worker responded with status ${response.status}`)
    }

    const payload = await parseWorkspaceResponse(response)
    logger.debug(
      { workspaceCount: payload.workspaces.length },
      'Fetched workspaces from Auth Worker'
    )
    return payload.workspaces
  }
}

async function parseWorkspaceResponse(response: Response): Promise<{
  workspaces: WorkspaceDirectoryEntry[]
}> {
  let data: unknown
  try {
    data = await response.json()
  } catch (error) {
    logger.error({ error }, 'Failed to parse Auth Worker workspace response')
    throw new Error('Invalid JSON received from Auth Worker')
  }

  if (!data || typeof data !== 'object' || !Array.isArray((data as any).workspaces)) {
    logger.error({ data }, 'Auth Worker workspace response missing workspaces array')
    throw new Error('Auth Worker workspace response is malformed')
  }

  const workspaces: WorkspaceDirectoryEntry[] = []
  for (const entry of (data as any).workspaces) {
    if (!entry || typeof entry !== 'object' || typeof entry.instanceId !== 'string') {
      logger.warn({ entry }, 'Skipping invalid workspace entry from Auth Worker')
      continue
    }

    workspaces.push({
      instanceId: entry.instanceId,
      userId: typeof entry.userId === 'string' ? entry.userId : undefined,
      name: typeof entry.name === 'string' ? entry.name : undefined,
      createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : undefined,
      lastAccessedAt: typeof entry.lastAccessedAt === 'string' ? entry.lastAccessedAt : undefined,
      isDefault: typeof entry.isDefault === 'boolean' ? Boolean(entry.isDefault) : undefined,
    })
  }

  return { workspaces }
}

async function safeReadBody(response: Response): Promise<string | undefined> {
  try {
    const clone = response.clone()
    const text = await clone.text()
    return text.slice(0, 512)
  } catch {
    return undefined
  }
}
