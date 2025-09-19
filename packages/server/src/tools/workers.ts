import type { Store } from '@livestore/livestore'
import {
  getWorkers$,
  getWorkerById$,
  getWorkerProjects$,
  getProjectWorkers$,
  getProjects$,
} from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import {
  validators,
  wrapStringParamFunction,
  wrapNoParamFunction,
  wrapToolFunction,
} from './base.js'
import { logger } from '../utils/logger.js'
import type {
  CreateWorkerParams,
  CreateWorkerResult,
  UpdateWorkerParams,
  UpdateWorkerResult,
  ListWorkersResult,
  GetWorkerParams,
  GetWorkerResult,
  DeactivateWorkerParams,
  DeactivateWorkerResult,
  AssignWorkerToProjectParams,
  AssignWorkerToProjectResult,
  UnassignWorkerFromProjectParams,
  UnassignWorkerFromProjectResult,
  GetProjectWorkersParams,
  GetProjectWorkersResult,
  GetWorkerProjectsParams,
  GetWorkerProjectsResult,
} from './types.js'

/**
 * Create a new worker (core implementation)
 */
function createWorkerCore(
  store: Store,
  params: CreateWorkerParams,
  actorId?: string
): CreateWorkerResult {
  try {
    const workerId = crypto.randomUUID()
    const now = new Date()

    // Validate inputs
    if (!params.name.trim()) {
      return { success: false, error: 'Worker name is required' }
    }

    if (!params.systemPrompt.trim()) {
      return { success: false, error: 'System prompt is required' }
    }

    if (!params.defaultModel.trim()) {
      return { success: false, error: 'Default model is required' }
    }

    // Basic validation to prevent prompt injection
    if (params.systemPrompt.toLowerCase().includes('ignore previous instructions')) {
      return { success: false, error: 'System prompt contains potentially unsafe content' }
    }

    // Emit worker creation event
    store.commit(
      events.workerCreated({
        id: workerId,
        name: params.name.trim(),
        roleDescription: params.roleDescription?.trim(),
        systemPrompt: params.systemPrompt.trim(),
        avatar: params.avatar?.trim(),
        defaultModel: params.defaultModel.trim(),
        createdAt: now,
        actorId,
      })
    )

    return {
      success: true,
      workerId,
      worker: {
        id: workerId,
        name: params.name.trim(),
        roleDescription: params.roleDescription?.trim() || undefined,
        systemPrompt: params.systemPrompt.trim(),
        avatar: params.avatar?.trim() || undefined,
        defaultModel: params.defaultModel.trim(),
        createdAt: now,
      },
    }
  } catch (error) {
    logger.error({ error }, 'Error creating worker')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating worker',
    }
  }
}

/**
 * Update an existing worker (core implementation)
 */
async function updateWorkerCore(
  store: Store,
  params: UpdateWorkerParams,
  actorId?: string
): Promise<UpdateWorkerResult> {
  try {
    // Check if worker exists
    const workers = await store.query(getWorkerById$(params.workerId))
    const worker = validators.requireEntity(workers, 'Worker', params.workerId)
    if (!worker.isActive) {
      return { success: false, error: 'Worker not found' }
    }

    // Validate updates
    const updates: any = {}
    if (params.name !== undefined) {
      if (!params.name.trim()) {
        return { success: false, error: 'Worker name cannot be empty' }
      }
      updates.name = params.name.trim()
    }

    if (params.roleDescription !== undefined) {
      updates.roleDescription = params.roleDescription?.trim() || null
    }

    if (params.systemPrompt !== undefined) {
      if (!params.systemPrompt.trim()) {
        return { success: false, error: 'System prompt cannot be empty' }
      }
      // Basic validation to prevent prompt injection
      if (params.systemPrompt.toLowerCase().includes('ignore previous instructions')) {
        return { success: false, error: 'System prompt contains potentially unsafe content' }
      }
      updates.systemPrompt = params.systemPrompt.trim()
    }

    if (params.avatar !== undefined) {
      updates.avatar = params.avatar?.trim() || null
    }

    if (params.defaultModel !== undefined) {
      if (!params.defaultModel.trim()) {
        return { success: false, error: 'Default model cannot be empty' }
      }
      updates.defaultModel = params.defaultModel.trim()
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, error: 'No updates provided' }
    }

    const now = new Date()

    // Emit worker update event
    store.commit(
      events.workerUpdated({
        id: params.workerId,
        updates,
        updatedAt: now,
        actorId,
      })
    )

    return {
      success: true,
      worker: {
        id: params.workerId,
        ...updates,
        updatedAt: now,
      },
    }
  } catch (error) {
    logger.error({ error }, 'Error updating worker')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating worker',
    }
  }
}

/**
 * Get all active workers (core implementation)
 */
async function listWorkersCore(store: Store): Promise<ListWorkersResult> {
  try {
    const workers = await store.query(getWorkers$)

    return {
      success: true,
      workers: workers.map(worker => ({
        id: worker.id,
        name: worker.name,
        roleDescription: worker.roleDescription || undefined,
        systemPrompt: worker.systemPrompt,
        avatar: worker.avatar || undefined,
        defaultModel: worker.defaultModel,
        isActive: worker.isActive,
        createdAt: worker.createdAt,
        updatedAt: worker.updatedAt || undefined,
      })),
    }
  } catch (error) {
    logger.error({ error }, 'Error listing workers')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error listing workers',
    }
  }
}

/**
 * Get a specific worker by ID (core implementation)
 */
async function getWorkerByIdCore(store: Store, workerId: string): Promise<GetWorkerResult> {
  try {
    const workers = await store.query(getWorkerById$(workerId))
    const worker = validators.requireEntity(workers, 'Worker', workerId)

    // Get worker projects
    const workerProjectRows = await store.query(getWorkerProjects$(workerId))
    const projectIds = workerProjectRows.map(wp => wp.projectId)

    let projects: Array<{ id: string; name: string; description?: string }> = []
    if (projectIds.length > 0) {
      const allProjects = await store.query(getProjects$)
      projects = allProjects
        .filter(p => projectIds.includes(p.id))
        .map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || undefined,
        }))
    }

    return {
      success: true,
      worker: {
        id: worker.id,
        name: worker.name,
        roleDescription: worker.roleDescription || undefined,
        systemPrompt: worker.systemPrompt,
        avatar: worker.avatar || undefined,
        defaultModel: worker.defaultModel,
        isActive: worker.isActive,
        createdAt: worker.createdAt,
        updatedAt: worker.updatedAt || undefined,
        projects,
      },
    }
  } catch (error) {
    logger.error({ error }, 'Error getting worker')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting worker',
    }
  }
}

/**
 * Deactivate a worker (core implementation)
 */
async function deactivateWorkerCore(
  store: Store,
  params: DeactivateWorkerParams,
  actorId?: string
): Promise<DeactivateWorkerResult> {
  try {
    // Check if worker exists
    const workers = await store.query(getWorkerById$(params.workerId))
    const worker = validators.requireEntity(workers, 'Worker', params.workerId)

    if (!worker.isActive) {
      return { success: false, error: 'Worker is already deactivated' }
    }

    const now = new Date()

    // Emit worker update event to deactivate
    store.commit(
      events.workerUpdated({
        id: params.workerId,
        updates: {
          isActive: false,
        },
        updatedAt: now,
        actorId,
      })
    )

    return {
      success: true,
      message: `Worker "${worker.name}" has been deactivated`,
    }
  } catch (error) {
    logger.error({ error }, 'Error deactivating worker')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deactivating worker',
    }
  }
}

/**
 * Assign a worker to a project (core implementation)
 */
async function assignWorkerToProjectCore(
  store: Store,
  params: AssignWorkerToProjectParams,
  actorId?: string
): Promise<AssignWorkerToProjectResult> {
  try {
    // Check if worker exists and is active
    const workers = await store.query(getWorkerById$(params.workerId))
    const worker = validators.requireEntity(workers, 'Worker', params.workerId)
    if (!worker.isActive) {
      return { success: false, error: 'Cannot assign inactive worker' }
    }

    // Check if project exists
    const allProjects = await store.query(getProjects$)
    const project = allProjects.find(p => p.id === params.projectId)
    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    // Check if already assigned
    const existingAssignments = await store.query(getWorkerProjects$(params.workerId))
    if (existingAssignments.some(wp => wp.projectId === params.projectId)) {
      return { success: false, error: 'Worker is already assigned to this project' }
    }

    const now = new Date()

    // Emit worker assignment event
    store.commit(
      events.workerAssignedToProject({
        workerId: params.workerId,
        projectId: params.projectId,
        assignedAt: now,
        actorId,
      })
    )

    return {
      success: true,
      message: `Worker "${worker.name}" has been assigned to project "${project.name}"`,
    }
  } catch (error) {
    logger.error({ error }, 'Error assigning worker to project')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error assigning worker to project',
    }
  }
}

/**
 * Unassign a worker from a project (core implementation)
 */
async function unassignWorkerFromProjectCore(
  store: Store,
  params: UnassignWorkerFromProjectParams,
  actorId?: string
): Promise<UnassignWorkerFromProjectResult> {
  try {
    // Check if worker exists
    const workers = await store.query(getWorkerById$(params.workerId))
    const worker = validators.requireEntity(workers, 'Worker', params.workerId)

    // Check if project exists
    const allProjects = await store.query(getProjects$)
    const project = allProjects.find(p => p.id === params.projectId)
    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    // Check if assigned
    const existingAssignments = await store.query(getWorkerProjects$(params.workerId))
    if (!existingAssignments.some(wp => wp.projectId === params.projectId)) {
      return { success: false, error: 'Worker is not assigned to this project' }
    }

    // Emit worker unassignment event
    store.commit(
      events.workerUnassignedFromProject({
        workerId: params.workerId,
        projectId: params.projectId,
      })
    )

    return {
      success: true,
      message: `Worker "${worker.name}" has been unassigned from project "${project.name}"`,
    }
  } catch (error) {
    logger.error({ error }, 'Error unassigning worker from project')
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error unassigning worker from project',
    }
  }
}

/**
 * Get all workers assigned to a project (core implementation)
 */
async function getProjectWorkersCore(
  store: Store,
  projectId: string
): Promise<GetProjectWorkersResult> {
  try {
    // Check if project exists
    const allProjects = await store.query(getProjects$)
    const project = allProjects.find(p => p.id === projectId)
    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    // Get worker assignments for this project
    const workerProjectRows = await store.query(getProjectWorkers$(projectId))
    const workerIds = workerProjectRows.map(wp => wp.workerId)

    let workers: Array<{
      id: string
      name: string
      roleDescription?: string
      systemPrompt: string
      avatar?: string
      defaultModel: string
      isActive: boolean
      createdAt: Date
      updatedAt?: Date
    }> = []

    if (workerIds.length > 0) {
      const allWorkers = await store.query(getWorkers$)
      workers = allWorkers
        .filter(w => workerIds.includes(w.id))
        .map(w => ({
          id: w.id,
          name: w.name,
          roleDescription: w.roleDescription || undefined,
          systemPrompt: w.systemPrompt,
          avatar: w.avatar || undefined,
          defaultModel: w.defaultModel,
          isActive: w.isActive,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt || undefined,
        }))
    }

    return {
      success: true,
      projectId: projectId,
      workers,
    }
  } catch (error) {
    logger.error({ error }, 'Error getting project workers')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting project workers',
    }
  }
}

/**
 * Get all projects a worker is assigned to (core implementation)
 */
async function getWorkerProjectsCore(
  store: Store,
  workerId: string
): Promise<GetWorkerProjectsResult> {
  try {
    // Check if worker exists
    const workers = await store.query(getWorkerById$(workerId))
    const worker = validators.requireEntity(workers, 'Worker', workerId)

    // Get project assignments for this worker
    const workerProjectRows = await store.query(getWorkerProjects$(workerId))
    const projectIds = workerProjectRows.map(wp => wp.projectId)

    let projects: Array<{
      id: string
      name: string
      description?: string
      createdAt: Date
      updatedAt?: Date
    }> = []

    if (projectIds.length > 0) {
      const allProjects = await store.query(getProjects$)
      projects = allProjects
        .filter(p => projectIds.includes(p.id))
        .map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || undefined,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt || undefined,
        }))
    }

    return {
      success: true,
      workerId: workerId,
      worker: {
        name: worker.name,
        roleDescription: worker.roleDescription || undefined,
      },
      projects,
    }
  } catch (error) {
    logger.error({ error }, 'Error getting worker projects')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting worker projects',
    }
  }
}

// Export wrapped versions for external use
export const createWorker = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) => createWorkerCore(store, params, actorId))(
    store,
    params
  )

export const updateWorker = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) => updateWorkerCore(store, params, actorId))(
    store,
    params
  )

export const listWorkers = wrapNoParamFunction(listWorkersCore)

export const getWorker = wrapStringParamFunction(getWorkerByIdCore)

export const deactivateWorker = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) => deactivateWorkerCore(store, params, actorId))(
    store,
    params
  )

export const assignWorkerToProject = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) =>
    assignWorkerToProjectCore(store, params, actorId)
  )(store, params)

export const unassignWorkerFromProject = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) =>
    unassignWorkerFromProjectCore(store, params, actorId)
  )(store, params)

export const getProjectWorkers = wrapStringParamFunction(getProjectWorkersCore)

export const getWorkerProjects = wrapStringParamFunction(getWorkerProjectsCore)
