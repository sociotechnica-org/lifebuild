import type { LiveStore } from '../types/livestore.js'
import { events } from '@lifebuild/shared/schema'
import {
  getBoardTasks$,
  getUsers$,
  getTaskById$,
  getOrphanedTasks$,
  getProjects$,
} from '@lifebuild/shared/queries'
import {
  validators,
  wrapToolFunction,
  wrapStringParamFunction,
  wrapNoParamFunction,
} from './base.js'
import { logger } from '../utils/logger.js'
import type {
  CreateTaskParams,
  CreateTaskResult,
  UpdateTaskParams,
  UpdateTaskResult,
  MoveTaskParams,
  MoveTaskResult,
  MoveTaskToProjectParams,
  MoveTaskToProjectResult,
  OrphanTaskParams,
  OrphanTaskResult,
  ArchiveTaskResult,
  UnarchiveTaskResult,
  GetTaskByIdResult,
  GetProjectTasksResult,
  GetOrphanedTasksResult,
} from './types.js'

/**
 * Creates a task using the provided parameters
 */
async function createTaskCore(
  store: LiveStore,
  params: CreateTaskParams
): Promise<CreateTaskResult> {
  const { title, description, projectId, assigneeIds } = params

  // Validate title
  if (!title || title.trim().length === 0) {
    throw new Error('Task title is required')
  }

  // Validate and normalize status
  const validStatuses = ['todo', 'doing', 'in_review', 'done'] as const
  type TaskStatus = (typeof validStatuses)[number]
  const status: TaskStatus = (params.status || 'todo') as TaskStatus
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`)
  }

  // Verify project exists
  const projects = await store.query(getProjects$)
  const targetProject = projects.find((p: any) => p.id === projectId)
  if (!targetProject) {
    throw new Error(`Project with ID ${projectId} not found`)
  }

  // Validate assignees if provided
  let assigneeNames: string[] = []
  if (assigneeIds && assigneeIds.length > 0) {
    const users = await store.query(getUsers$)
    validators.validateAssignees(assigneeIds, users)
    assigneeNames = assigneeIds.map(id => {
      const user = users.find((u: any) => u.id === id)
      return user?.name || id
    })
  }

  // Get existing tasks with the same status to calculate position
  const existingTasks = await store.query(getBoardTasks$(targetProject.id))
  const tasksWithStatus = existingTasks.filter((t: any) => t.status === status)

  // Calculate next position, ensuring we handle non-numeric positions safely
  const validPositions = tasksWithStatus
    .map((t: any) => t.position)
    .filter((pos: any) => typeof pos === 'number' && !isNaN(pos))

  const nextPosition = validPositions.length > 0 ? Math.max(...validPositions) + 1 : 0

  // Create the task
  const taskId = crypto.randomUUID()

  logger.debug(
    {
      id: taskId,
      projectId: targetProject.id,
      projectName: targetProject.name,
      status,
      title: title.trim(),
      position: nextPosition,
      existingTasksWithStatus: tasksWithStatus.length,
    },
    'Creating task with data'
  )

  store.commit(
    events.taskCreatedV2({
      id: taskId,
      projectId: targetProject.id,
      title: title.trim(),
      description: description?.trim() || undefined,
      status,
      assigneeIds: assigneeIds,
      position: nextPosition,
      createdAt: new Date(),
    })
  )

  logger.info({ taskId }, 'Task creation event committed')

  return {
    success: true,
    taskId,
    taskTitle: title.trim(),
    projectName: targetProject.name,
    status,
    assigneeNames,
  }
}

/**
 * Updates a task with new information (core implementation)
 */
async function updateTaskCore(
  store: LiveStore,
  params: UpdateTaskParams
): Promise<UpdateTaskResult> {
  const { taskId, title, description, assigneeIds } = params

  // Verify task exists
  const tasks = (await store.query(getTaskById$(taskId))) as any[]
  validators.requireEntity(tasks, 'Task', taskId)

  // Validate assignees if provided
  if (assigneeIds && assigneeIds.length > 0) {
    const users = await store.query(getUsers$)
    validators.validateAssignees(assigneeIds, users)
  }

  // Create update event
  store.commit(
    events.taskUpdated({
      taskId: taskId,
      title: title?.trim(),
      description: description?.trim(),
      assigneeIds,
      updatedAt: new Date(),
    })
  )

  return {
    success: true,
    task: {
      id: taskId,
      title,
      description,
      assigneeIds,
    },
  }
}

/**
 * Moves a task to a different status (core implementation)
 */
async function moveTaskCore(store: LiveStore, params: MoveTaskParams): Promise<MoveTaskResult> {
  const { taskId, toStatus, position } = params

  // Validate status
  const validStatuses = ['todo', 'doing', 'in_review', 'done'] as const
  type TaskStatus = (typeof validStatuses)[number]
  if (!validStatuses.includes(toStatus as TaskStatus)) {
    throw new Error(`Invalid status: ${toStatus}. Must be one of: ${validStatuses.join(', ')}`)
  }

  // Verify task exists
  const tasks = (await store.query(getTaskById$(taskId))) as any[]
  const task = validators.requireEntity(tasks, 'Task', taskId)

  // Verify task has a project
  if (!task.projectId) {
    throw new Error('Cannot move orphaned task. Use orphan_task to move orphaned tasks.')
  }

  // Calculate position if not provided, using Large Integer Positioning strategy
  let movePosition = position
  if (movePosition === undefined) {
    const existingTasks = await store.query(getBoardTasks$(task.projectId))
    const tasksWithStatus = existingTasks.filter((t: any) => t.status === toStatus)
    const POSITION_GAP = 1000
    const validPositions = tasksWithStatus
      .map((t: any) => t.position)
      .filter((pos: any) => typeof pos === 'number' && !isNaN(pos))

    // If no existing tasks, start at 1000
    if (validPositions.length === 0) {
      movePosition = POSITION_GAP
    } else {
      // Add a large gap between the max position and the new task's position
      movePosition = Math.max(...validPositions) + POSITION_GAP
    }
  }

  // Create move event using v2 status change event
  store.commit(
    events.taskStatusChanged({
      taskId: taskId,
      toStatus: toStatus as TaskStatus,
      position: movePosition,
      updatedAt: new Date(),
    })
  )

  return {
    success: true,
    task: {
      id: taskId,
      status: toStatus,
      position: movePosition,
    },
  }
}

/**
 * Moves a task to a different project (core implementation)
 */
async function moveTaskToProjectCore(
  store: LiveStore,
  params: MoveTaskToProjectParams
): Promise<MoveTaskToProjectResult> {
  const { taskId, toProjectId, status, position } = params

  // Verify task exists
  const tasks = (await store.query(getTaskById$(taskId))) as any[]
  const task = validators.requireEntity(tasks, 'Task', taskId)

  // Verify target project exists
  const projects = await store.query(getProjects$)
  const targetProject = projects.find((p: any) => p.id === toProjectId)
  if (!targetProject) {
    throw new Error(`Project with ID ${toProjectId} not found`)
  }

  // Validate and normalize status
  const validStatuses = ['todo', 'doing', 'in_review', 'done'] as const
  type TaskStatus = (typeof validStatuses)[number]
  const targetStatus: TaskStatus = (status || task.status || 'todo') as TaskStatus
  if (!validStatuses.includes(targetStatus)) {
    throw new Error(`Invalid status: ${targetStatus}. Must be one of: ${validStatuses.join(', ')}`)
  }

  // Calculate position if not provided, using Large Integer Positioning strategy
  let movePosition = position
  if (movePosition === undefined) {
    const existingTasks = await store.query(getBoardTasks$(toProjectId))
    const tasksWithStatus = existingTasks.filter((t: any) => t.status === targetStatus)
    const POSITION_GAP = 1000
    const validPositions = tasksWithStatus
      .map((t: any) => t.position)
      .filter((pos: any) => typeof pos === 'number' && !isNaN(pos))

    // If no existing tasks, start at 1000
    if (validPositions.length === 0) {
      movePosition = POSITION_GAP
    } else {
      // Add a large gap between the max position and the new task's position
      movePosition = Math.max(...validPositions) + POSITION_GAP
    }
  }

  // Create move to project event using v2
  store.commit(
    events.taskMovedToProjectV2({
      taskId: taskId,
      toProjectId: toProjectId.trim(),
      position: movePosition,
      updatedAt: new Date(),
    })
  )

  // If status was provided and different, also update status
  // Note: We use two separate events here intentionally for LiveLiveStore event sourcing.
  // This allows independent replay and better granularity. The events are committed
  // synchronously in sequence, so they will be processed atomically.
  if (status && status !== task.status) {
    store.commit(
      events.taskStatusChanged({
        taskId: taskId,
        toStatus: status as TaskStatus,
        position: movePosition,
        updatedAt: new Date(),
      })
    )
  }

  return {
    success: true,
    task: {
      id: taskId,
      projectId: toProjectId,
      status: targetStatus,
      position: movePosition,
    },
  }
}

/**
 * Orphans a task (removes it from its current project)
 */
async function orphanTaskCore(
  store: LiveStore,
  params: OrphanTaskParams
): Promise<OrphanTaskResult> {
  const { taskId, status, position } = params

  // Verify task exists
  const tasks = (await store.query(getTaskById$(taskId))) as any[]
  const task = validators.requireEntity(tasks, 'Task', taskId)

  // Validate and normalize status
  const validStatuses = ['todo', 'doing', 'in_review', 'done'] as const
  type TaskStatus = (typeof validStatuses)[number]
  const targetStatus: TaskStatus = (status || task.status || 'todo') as TaskStatus
  if (!validStatuses.includes(targetStatus)) {
    throw new Error(`Invalid status: ${targetStatus}. Must be one of: ${validStatuses.join(', ')}`)
  }

  // Calculate position if not provided (orphaned tasks start at 0)
  const movePosition = position ?? 0

  // Create move to project event (with undefined projectId for orphaning)
  store.commit(
    events.taskMovedToProjectV2({
      taskId: taskId,
      toProjectId: undefined,
      position: movePosition,
      updatedAt: new Date(),
    })
  )

  // If status was provided and different, also update status
  // Note: We use two separate events here intentionally for LiveLiveStore event sourcing.
  // This allows independent replay and better granularity. The events are committed
  // synchronously in sequence, so they will be processed atomically.
  if (status && status !== task.status) {
    store.commit(
      events.taskStatusChanged({
        taskId: taskId,
        toStatus: status as TaskStatus,
        position: movePosition,
        updatedAt: new Date(),
      })
    )
  }

  return {
    success: true,
    task: {
      id: taskId,
      status: targetStatus,
      position: movePosition,
    },
  }
}

/**
 * Archives a task (core implementation)
 */
async function archiveTaskCore(store: LiveStore, taskId: string): Promise<ArchiveTaskResult> {
  // Verify task exists
  const tasks = (await store.query(getTaskById$(taskId))) as any[]
  const task = validators.requireEntity(tasks, 'Task', taskId)
  if (task.archivedAt) {
    throw new Error('Task is already archived')
  }

  // Create archive event
  store.commit(
    events.taskArchived({
      taskId: taskId,
      archivedAt: new Date(),
    })
  )

  return {
    success: true,
    task: {
      id: taskId,
      archivedAt: new Date(),
    },
  }
}

/**
 * Unarchives a task (core implementation)
 */
async function unarchiveTaskCore(store: LiveStore, taskId: string): Promise<UnarchiveTaskResult> {
  // Verify task exists (need to query without archive filter)
  const tasks = (await store.query(getTaskById$(taskId))) as any[]
  const task = validators.requireEntity(tasks, 'Task', taskId)
  if (!task.archivedAt) {
    throw new Error('Task is not archived')
  }

  // Create unarchive event
  store.commit(
    events.taskUnarchived({
      taskId: taskId,
    })
  )

  return {
    success: true,
    task: {
      id: taskId,
      archivedAt: null,
    },
  }
}

/**
 * Get a specific task by ID (core implementation)
 */
async function getTaskByIdCore(store: LiveStore, taskId: string): Promise<GetTaskByIdResult> {
  // Query for the task
  const tasks = (await store.query(getTaskById$(taskId))) as any[]
  const task = validators.requireEntity(tasks, 'Task', taskId)

  return {
    success: true,
    task: {
      id: task.id,
      projectId: task.projectId,
      status: task.status,
      title: task.title,
      description: task.description,
      assigneeIds: task.assigneeIds,
      position: task.position,
      createdAt: task.createdAt,
      archivedAt: task.archivedAt,
    },
  }
}

/**
 * Get all tasks for a specific project (core implementation)
 */
async function getProjectTasksCore(
  store: LiveStore,
  projectId: string
): Promise<GetProjectTasksResult> {
  // Verify project exists
  const projects = await store.query(getProjects$)
  const project = projects.find((p: any) => p.id === projectId)
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`)
  }

  const tasks = (await store.query(getBoardTasks$(projectId))) as any[]
  return {
    success: true,
    projectName: project.name,
    tasks: tasks.map((t: any) => ({
      id: t.id,
      projectId: t.projectId,
      status: t.status,
      title: t.title,
      description: t.description,
      assigneeIds: t.assigneeIds,
      position: t.position,
      createdAt: t.createdAt,
    })),
  }
}

/**
 * Get all orphaned tasks (tasks without a project) (core implementation)
 */
async function getOrphanedTasksCore(store: LiveStore): Promise<GetOrphanedTasksResult> {
  const tasks = (await store.query(getOrphanedTasks$)) as any[]
  return {
    success: true,
    tasks: tasks.map((t: any) => ({
      id: t.id,
      projectId: t.projectId,
      status: t.status,
      title: t.title,
      description: t.description,
      assigneeIds: t.assigneeIds,
      position: t.position,
      createdAt: t.createdAt,
    })),
  }
}

// Export wrapped versions for external use
export const createTask = wrapToolFunction(createTaskCore)
export const updateTask = wrapToolFunction(updateTaskCore)
export const moveTaskWithinProject = wrapToolFunction(moveTaskCore)
export const moveTaskToProject = wrapToolFunction(moveTaskToProjectCore)
export const orphanTask = wrapToolFunction(orphanTaskCore)
export const archiveTask = wrapStringParamFunction(archiveTaskCore)
export const unarchiveTask = wrapStringParamFunction(unarchiveTaskCore)
export const getTaskById = wrapStringParamFunction(getTaskByIdCore)
export const getProjectTasks = wrapStringParamFunction(getProjectTasksCore)
export const getOrphanedTasks = wrapNoParamFunction(getOrphanedTasksCore)
