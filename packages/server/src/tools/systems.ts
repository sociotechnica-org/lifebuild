import type { Store } from '@livestore/livestore'
import {
  getSystemById$,
  getSystems$,
  getSystemTaskTemplates$,
  getAllSystemTaskTemplates$,
} from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import { PROJECT_CATEGORIES, computeNextGenerateAt } from '@lifebuild/shared'
import {
  validators,
  wrapToolFunction,
  wrapNoParamFunction,
  wrapStringParamFunction,
} from './base.js'
import { logger } from '../utils/logger.js'
import type {
  CreateSystemParams,
  CreateSystemResult,
  UpdateSystemParams,
  UpdateSystemResult,
  GetSystemDetailsResult,
  ListSystemsResult,
  UpdateSystemLifecycleParams,
  UpdateSystemLifecycleResult,
  AddSystemTaskTemplateParams,
  AddSystemTaskTemplateResult,
  UpdateSystemTaskTemplateParams,
  UpdateSystemTaskTemplateResult,
  RemoveSystemTaskTemplateResult,
  GetSystemTaskTemplatesResult,
} from './types.js'

const VALID_CATEGORIES = PROJECT_CATEGORIES.map(c => c.value)
const VALID_CADENCES = ['daily', 'weekly', 'monthly', 'quarterly', 'annually'] as const

function createSystemCore(
  store: Store,
  params: CreateSystemParams,
  actorId?: string
): CreateSystemResult {
  try {
    if (params.category && !VALID_CATEGORIES.includes(params.category as any)) {
      return {
        success: false,
        error: `Invalid category: ${params.category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      }
    }

    const systemId = crypto.randomUUID()
    const now = new Date()

    store.commit(
      events.systemCreated({
        id: systemId,
        name: params.name,
        description: params.description,
        category: params.category as any,
        createdAt: now,
        actorId,
      })
    )

    return {
      success: true,
      system: {
        id: systemId,
        name: params.name,
        description: params.description,
        category: params.category,
        lifecycleState: 'planning',
        createdAt: now,
      },
    }
  } catch (error) {
    logger.error({ error }, 'Error creating system')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

function updateSystemCore(
  store: Store,
  params: UpdateSystemParams,
  actorId?: string
): UpdateSystemResult {
  try {
    const systems = store.query(getSystemById$(params.systemId)) as any[]
    validators.requireEntity(systems, 'System', params.systemId)

    if (params.category !== undefined && params.category !== null) {
      if (!VALID_CATEGORIES.includes(params.category as any)) {
        return {
          success: false,
          error: `Invalid category: ${params.category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        }
      }
    }

    const now = new Date()
    const updates: Record<string, unknown> = {}

    if (params.name !== undefined) updates.name = params.name
    if (params.description !== undefined) updates.description = params.description
    if (params.category !== undefined) updates.category = params.category
    if (params.purposeStatement !== undefined) updates.purposeStatement = params.purposeStatement

    if (Object.keys(updates).length > 0) {
      store.commit(
        events.systemUpdated({
          id: params.systemId,
          updates: updates as any,
          updatedAt: now,
          actorId,
        })
      )
    }

    return { success: true }
  } catch (error) {
    logger.error({ error }, 'Error updating system')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

function getSystemDetailsCore(store: Store, systemId: string): GetSystemDetailsResult {
  const systems = store.query(getSystemById$(systemId)) as any[]
  const system = validators.requireEntity(systems, 'System', systemId)

  const templates = store.query(getSystemTaskTemplates$(systemId)) as any[]

  return {
    success: true,
    system: {
      id: system.id,
      name: system.name,
      description: system.description,
      category: system.category,
      purposeStatement: system.purposeStatement,
      lifecycleState: system.lifecycleState,
      createdAt: system.createdAt,
      templateCount: templates.length,
    },
  }
}

function listSystemsCore(store: Store): ListSystemsResult {
  const systems = store.query(getSystems$) as any[]
  return {
    success: true,
    systems: systems
      .filter(s => s != null)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        lifecycleState: s.lifecycleState,
        createdAt: s.createdAt,
      })),
  }
}

function updateSystemLifecycleCore(
  store: Store,
  params: UpdateSystemLifecycleParams,
  actorId?: string
): UpdateSystemLifecycleResult {
  try {
    const systems = store.query(getSystemById$(params.systemId)) as any[]
    const system = validators.requireEntity(systems, 'System', params.systemId)

    const now = new Date()

    switch (params.action) {
      case 'plant': {
        if (system.lifecycleState !== 'planning') {
          return {
            success: false,
            error: `Cannot plant a system in "${system.lifecycleState}" state. Must be in "planning" state.`,
          }
        }

        const templates = store.query(getSystemTaskTemplates$(params.systemId)) as any[]
        if (templates.length === 0) {
          return {
            success: false,
            error: 'Cannot plant a system without at least one task template. Add templates first.',
          }
        }

        // Plant the system
        store.commit(
          events.systemPlanted({
            id: params.systemId,
            plantedAt: now,
            actorId,
          })
        )

        // Set initial nextGenerateAt on all templates via mid-cycle update
        store.commit(
          events.systemMidCycleUpdated({
            id: params.systemId,
            midCycleUpdatedAt: now,
            templateOverrides: templates.map((t: any) => ({
              templateId: t.id,
              lastGeneratedAt: now,
              nextGenerateAt: computeNextGenerateAt(t.cadence, now),
            })),
            actorId,
          })
        )

        return { success: true }
      }

      case 'hibernate': {
        if (system.lifecycleState !== 'planted') {
          return {
            success: false,
            error: `Cannot hibernate a system in "${system.lifecycleState}" state. Must be in "planted" state.`,
          }
        }

        store.commit(
          events.systemHibernated({
            id: params.systemId,
            hibernatedAt: now,
            actorId,
          })
        )
        return { success: true }
      }

      case 'resume': {
        if (system.lifecycleState !== 'hibernating') {
          return {
            success: false,
            error: `Cannot resume a system in "${system.lifecycleState}" state. Must be in "hibernating" state.`,
          }
        }

        store.commit(
          events.systemResumed({
            id: params.systemId,
            resumedAt: now,
            actorId,
          })
        )

        // Reset template schedules from now
        const templates = store.query(getSystemTaskTemplates$(params.systemId)) as any[]
        if (templates.length > 0) {
          store.commit(
            events.systemMidCycleUpdated({
              id: params.systemId,
              midCycleUpdatedAt: now,
              templateOverrides: templates.map((t: any) => ({
                templateId: t.id,
                lastGeneratedAt: now,
                nextGenerateAt: computeNextGenerateAt(t.cadence, now),
              })),
              actorId,
            })
          )
        }

        return { success: true }
      }

      case 'uproot': {
        if (system.lifecycleState === 'uprooted') {
          return { success: false, error: 'System is already uprooted.' }
        }

        store.commit(
          events.systemUprooted({
            id: params.systemId,
            uprootedAt: now,
            actorId,
          })
        )
        return { success: true }
      }

      default:
        return {
          success: false,
          error: `Invalid action: ${params.action}. Must be one of: plant, hibernate, resume, uproot.`,
        }
    }
  } catch (error) {
    logger.error({ error }, 'Error updating system lifecycle')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

function addSystemTaskTemplateCore(
  store: Store,
  params: AddSystemTaskTemplateParams,
  actorId?: string
): AddSystemTaskTemplateResult {
  try {
    const systems = store.query(getSystemById$(params.systemId)) as any[]
    validators.requireEntity(systems, 'System', params.systemId)

    if (!VALID_CADENCES.includes(params.cadence as any)) {
      return {
        success: false,
        error: `Invalid cadence: ${params.cadence}. Must be one of: ${VALID_CADENCES.join(', ')}`,
      }
    }

    // Calculate position from existing templates
    const existingTemplates = store.query(getSystemTaskTemplates$(params.systemId)) as any[]
    const position = existingTemplates.length

    const templateId = crypto.randomUUID()
    const now = new Date()

    store.commit(
      events.systemTaskTemplateAdded({
        id: templateId,
        systemId: params.systemId,
        title: params.title,
        description: params.description,
        cadence: params.cadence as any,
        position,
        createdAt: now,
        actorId,
      })
    )

    return {
      success: true,
      template: {
        id: templateId,
        systemId: params.systemId,
        title: params.title,
        description: params.description,
        cadence: params.cadence,
        position,
        createdAt: now,
      },
    }
  } catch (error) {
    logger.error({ error }, 'Error adding system task template')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

function updateSystemTaskTemplateCore(
  store: Store,
  params: UpdateSystemTaskTemplateParams,
  actorId?: string
): UpdateSystemTaskTemplateResult {
  try {
    // Find template by querying all and filtering
    const allTemplates = store.query(getAllSystemTaskTemplates$) as any[]
    const template = allTemplates.find((t: any) => t.id === params.templateId)
    if (!template) {
      throw new Error(`SystemTaskTemplate with ID ${params.templateId} not found`)
    }

    if (params.cadence !== undefined && !VALID_CADENCES.includes(params.cadence as any)) {
      return {
        success: false,
        error: `Invalid cadence: ${params.cadence}. Must be one of: ${VALID_CADENCES.join(', ')}`,
      }
    }

    const now = new Date()
    const updates: Record<string, unknown> = {}

    if (params.title !== undefined) updates.title = params.title
    if (params.description !== undefined) updates.description = params.description
    if (params.cadence !== undefined) updates.cadence = params.cadence

    if (Object.keys(updates).length > 0) {
      store.commit(
        events.systemTaskTemplateUpdated({
          id: params.templateId,
          updates: updates as any,
          updatedAt: now,
          actorId,
        })
      )
    }

    return { success: true }
  } catch (error) {
    logger.error({ error }, 'Error updating system task template')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

function removeSystemTaskTemplateCore(
  store: Store,
  templateId: string,
  actorId?: string
): RemoveSystemTaskTemplateResult {
  try {
    // Find template by querying all and filtering
    const allTemplates = store.query(getAllSystemTaskTemplates$) as any[]
    const template = allTemplates.find((t: any) => t.id === templateId)
    if (!template) {
      throw new Error(`SystemTaskTemplate with ID ${templateId} not found`)
    }

    store.commit(
      events.systemTaskTemplateRemoved({
        id: templateId,
        removedAt: new Date(),
        actorId,
      })
    )

    return { success: true }
  } catch (error) {
    logger.error({ error }, 'Error removing system task template')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

function getSystemTaskTemplatesCore(store: Store, systemId: string): GetSystemTaskTemplatesResult {
  const systems = store.query(getSystemById$(systemId)) as any[]
  validators.requireEntity(systems, 'System', systemId)

  const templates = store.query(getSystemTaskTemplates$(systemId)) as any[]

  return {
    success: true,
    templates: templates
      .filter(t => t != null)
      .map((t: any) => ({
        id: t.id,
        systemId: t.systemId,
        title: t.title,
        description: t.description,
        cadence: t.cadence,
        position: t.position,
        nextGenerateAt: t.nextGenerateAt ?? undefined,
        createdAt: t.createdAt,
      })),
  }
}

// Wrapped exports
export const createSystem = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((s: Store, p: any) => createSystemCore(s, p, actorId))(store, params)

export const updateSystem = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((s: Store, p: any) => updateSystemCore(s, p, actorId))(store, params)

export const getSystemDetails = wrapStringParamFunction(getSystemDetailsCore)

export const listSystems = wrapNoParamFunction(listSystemsCore)

export const updateSystemLifecycle = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((s: Store, p: any) => updateSystemLifecycleCore(s, p, actorId))(store, params)

export const addSystemTaskTemplate = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((s: Store, p: any) => addSystemTaskTemplateCore(s, p, actorId))(store, params)

export const updateSystemTaskTemplate = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((s: Store, p: any) => updateSystemTaskTemplateCore(s, p, actorId))(store, params)

export const removeSystemTaskTemplate = (store: Store, templateId: string, actorId?: string) => {
  try {
    return removeSystemTaskTemplateCore(store, templateId, actorId)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export const getSystemTaskTemplates = wrapStringParamFunction(getSystemTaskTemplatesCore)
