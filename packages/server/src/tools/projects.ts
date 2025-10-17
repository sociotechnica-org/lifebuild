import type { Store } from '@livestore/livestore'
import {
  getProjects$,
  getProjectDetails$,
  getBoardTasks$,
  getDocumentProjectsByProject$,
} from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import { PROJECT_CATEGORIES } from '@work-squared/shared'
import {
  validators,
  wrapStringParamFunction,
  wrapNoParamFunction,
  wrapToolFunction,
} from './base.js'
import { logger } from '../utils/logger.js'
import type {
  CreateProjectParams,
  CreateProjectResult,
  ListProjectsResult,
  GetProjectDetailsResult,
  UpdateProjectParams,
  UpdateProjectResult,
  ArchiveProjectParams,
  ArchiveProjectResult,
  UnarchiveProjectParams,
  UnarchiveProjectResult,
} from './types.js'

/**
 * Create a new project (core implementation)
 */
function createProjectCore(
  store: Store,
  params: CreateProjectParams,
  actorId?: string
): CreateProjectResult {
  try {
    // Validate category if provided
    if (params.category) {
      const validCategory = PROJECT_CATEGORIES.find(c => c.value === params.category)
      if (!validCategory) {
        return {
          success: false,
          error: `Invalid category: ${params.category}. Must be one of: ${PROJECT_CATEGORIES.map(c => c.value).join(', ')}`,
        }
      }
    }

    const projectId = crypto.randomUUID()
    const now = new Date()

    // PR4: Use v2.ProjectCreated event with category support
    store.commit(
      events.projectCreatedV2({
        id: projectId,
        name: params.name,
        description: params.description,
        category: params.category as any,
        attributes: undefined,
        createdAt: now,
        actorId,
      })
    )

    // PR4: Column creation REMOVED
    // Columns table no longer exists after PR3
    // Tasks use status field directly

    return {
      success: true,
      project: {
        id: projectId,
        name: params.name,
        description: params.description,
        createdAt: now,
      },
    }
  } catch (error) {
    logger.error({ error }, 'Error creating project')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * List all available projects (core implementation)
 */
function listProjectsCore(store: Store): ListProjectsResult {
  const projects = store.query(getProjects$) as any[]
  return {
    success: true,
    projects: projects
      .filter(p => p != null)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
      })),
  }
}

/**
 * Get detailed information about a project (core implementation)
 */
function getProjectDetailsCore(store: Store, projectId: string): GetProjectDetailsResult {
  const projects = store.query(getProjectDetails$(projectId)) as any[]
  const project = validators.requireEntity(projects, 'Project', projectId)

  // Get document and task counts using client-side filtering
  const documentProjects = store.query(getDocumentProjectsByProject$(projectId)) as any[]
  const tasks = store.query(getBoardTasks$(projectId)) as any[]

  return {
    success: true,
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      documentCount: documentProjects.length,
      taskCount: tasks.length,
    },
  }
}

/**
 * Update an existing project (PR5+6: core implementation)
 */
function updateProjectCore(
  store: Store,
  params: UpdateProjectParams,
  actorId?: string
): UpdateProjectResult {
  try {
    // Validate project exists
    const projects = store.query(getProjectDetails$(params.projectId)) as any[]
    validators.requireEntity(projects, 'Project', params.projectId)

    // Validate category if provided
    if (params.category !== undefined && params.category !== null) {
      const validCategory = PROJECT_CATEGORIES.find(c => c.value === params.category)
      if (!validCategory) {
        return {
          success: false,
          error: `Invalid category: ${params.category}. Must be one of: ${PROJECT_CATEGORIES.map(c => c.value).join(', ')}`,
        }
      }
    }

    const now = new Date()

    // Build updates object for basic fields
    const updates: {
      name?: string
      description?: string | null
      category?: string | null
    } = {}

    if (params.name !== undefined) updates.name = params.name
    if (params.description !== undefined) updates.description = params.description
    if (params.category !== undefined) updates.category = params.category as any

    // Commit basic field updates if any exist
    if (Object.keys(updates).length > 0) {
      store.commit(
        events.projectUpdated({
          id: params.projectId,
          updates: updates as any,
          updatedAt: now,
          actorId,
        })
      )
    }

    // Commit attributes update separately if provided
    if (params.attributes !== undefined) {
      store.commit(
        events.projectAttributesUpdated({
          id: params.projectId,
          attributes: params.attributes as any,
          updatedAt: now,
          actorId,
        })
      )
    }

    return { success: true }
  } catch (error) {
    logger.error({ error }, 'Error updating project')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Archive a project (PR5+6: core implementation)
 */
function archiveProjectCore(
  store: Store,
  params: ArchiveProjectParams,
  actorId?: string
): ArchiveProjectResult {
  try {
    // Validate project exists
    const projects = store.query(getProjectDetails$(params.projectId)) as any[]
    validators.requireEntity(projects, 'Project', params.projectId)

    const now = new Date()

    store.commit(
      events.projectArchived({
        id: params.projectId,
        archivedAt: now,
        actorId,
      })
    )

    return { success: true }
  } catch (error) {
    logger.error({ error }, 'Error archiving project')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Unarchive a project (PR5+6: core implementation)
 */
function unarchiveProjectCore(
  store: Store,
  params: UnarchiveProjectParams,
  actorId?: string
): UnarchiveProjectResult {
  try {
    const now = new Date()

    store.commit(
      events.projectUnarchived({
        id: params.projectId,
        unarchivedAt: now,
        actorId,
      })
    )

    return { success: true }
  } catch (error) {
    logger.error({ error }, 'Error unarchiving project')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// Export wrapped versions for external use
export const createProject = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) => createProjectCore(store, params, actorId))(
    store,
    params
  )
export const listProjects = wrapNoParamFunction(listProjectsCore)
export const getProjectDetails = wrapStringParamFunction(getProjectDetailsCore)

// PR5+6: Export new project tools
export const updateProject = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) => updateProjectCore(store, params, actorId))(
    store,
    params
  )
export const archiveProject = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) => archiveProjectCore(store, params, actorId))(
    store,
    params
  )
export const unarchiveProject = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) => unarchiveProjectCore(store, params, actorId))(
    store,
    params
  )
