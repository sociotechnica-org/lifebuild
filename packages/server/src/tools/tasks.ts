import type { Store } from '@livestore/livestore'
import { events } from '@work-squared/shared/schema'
import {
  getBoardColumns$,
  getBoardTasks$,
  getUsers$,
  getTaskById$,
  getOrphanedTasks$,
  getProjects$,
  getOrphanedColumns$,
} from '@work-squared/shared/queries'
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
function createTaskCore(store: Store, params: CreateTaskParams): CreateTaskResult {
  const { title, description, projectId, columnId, assigneeIds } = params

  // Validate title
  if (!title || title.trim().length === 0) {
    throw new Error('Task title is required')
  }

  // Verify project exists
  const projects = store.query(getProjects$)
  const targetProject = projects.find((p: any) => p.id === projectId)
  if (!targetProject) {
    throw new Error(`Project with ID ${projectId} not found`)
  }

  // Get columns for the target board
  const columns = store.query(getBoardColumns$(projectId))
  if (columns.length === 0) {
    throw new Error(`Project "${targetProject.name}" has no columns. Please add columns first.`)
  }

  // Verify column exists and belongs to project
  const targetColumn = columns.find((c: any) => c.id === columnId)
  if (!targetColumn) {
    throw new Error(`Column with ID ${columnId} not found in project ${projectId}`)
  }

  // Validate assignees if provided
  let assigneeNames: string[] = []
  if (assigneeIds && assigneeIds.length > 0) {
    const users = store.query(getUsers$)
    validators.validateAssignees(assigneeIds, users)
    assigneeNames = assigneeIds.map(id => {
      const user = users.find((u: any) => u.id === id)
      return user?.name || id
    })
  }

  // Get existing tasks in the column to calculate position
  const existingTasks = store.query(getBoardTasks$(targetProject.id))
  const tasksInColumn = existingTasks.filter((t: any) => t.columnId === targetColumn.id)

  // Calculate next position, ensuring we handle non-numeric positions safely
  const validPositions = tasksInColumn
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
      columnId: targetColumn.id,
      columnName: targetColumn.name,
      title: title.trim(),
      position: nextPosition,
      existingTasksInColumn: tasksInColumn.length,
    },
    'Creating task with data'
  )

  store.commit(
    events.taskCreated({
      id: taskId,
      projectId: targetProject.id,
      columnId: targetColumn.id,
      title: title.trim(),
      description: description?.trim() || undefined,
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
    columnName: targetColumn.name,
    assigneeNames,
  }
}

/**
 * Updates a task with new information (core implementation)
 */
function updateTaskCore(store: Store, params: UpdateTaskParams): UpdateTaskResult {
  const { taskId, title, description, assigneeIds } = params

  // Verify task exists
  const tasks = store.query(getTaskById$(taskId))
  validators.requireEntity(tasks, 'Task', taskId)

  // Validate assignees if provided
  if (assigneeIds && assigneeIds.length > 0) {
    const users = store.query(getUsers$)
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
 * Moves a task to a different column (core implementation)
 */
function moveTaskCore(store: Store, params: MoveTaskParams): MoveTaskResult {
  const { taskId, toColumnId, position } = params

  // Verify task exists
  const tasks = store.query(getTaskById$(taskId))
  const task = validators.requireEntity(tasks, 'Task', taskId)

  // Get project to verify column exists
  if (!task.projectId) {
    throw new Error('Cannot move orphaned task')
  }

  const columns = store.query(getBoardColumns$(task.projectId))
  const targetColumn = columns.find((c: any) => c.id === toColumnId)
  if (!targetColumn) {
    throw new Error(`Column with ID ${toColumnId} not found`)
  }

  // Calculate position if not provided
  let movePosition = position
  if (movePosition === undefined) {
    const existingTasks = store.query(getBoardTasks$(task.projectId))
    const tasksInColumn = existingTasks.filter((t: any) => t.columnId === toColumnId)
    const validPositions = tasksInColumn
      .map((t: any) => t.position)
      .filter((pos: any) => typeof pos === 'number' && !isNaN(pos))
    movePosition = validPositions.length > 0 ? Math.max(...validPositions) + 1 : 0
  }

  // Create move event
  store.commit(
    events.taskMoved({
      taskId: taskId,
      toColumnId: toColumnId,
      position: movePosition,
      updatedAt: new Date(),
    })
  )

  return {
    success: true,
    task: {
      id: taskId,
      columnId: toColumnId,
      position: movePosition,
    },
  }
}

/**
 * Moves a task to a different project (core implementation)
 */
function moveTaskToProjectCore(
  store: Store,
  params: MoveTaskToProjectParams
): MoveTaskToProjectResult {
  const { taskId, toProjectId, toColumnId, position } = params

  // Verify task exists
  const tasks = store.query(getTaskById$(taskId))
  validators.requireEntity(tasks, 'Task', taskId)

  // Verify target project exists
  const projects = store.query(getProjects$)
  const targetProject = projects.find((p: any) => p.id === toProjectId)
  if (!targetProject) {
    throw new Error(`Project with ID ${toProjectId} not found`)
  }

  // Verify column belongs to target project
  const columns = store.query(getBoardColumns$(toProjectId))
  const targetColumn = columns.find((c: any) => c.id === toColumnId)
  if (!targetColumn) {
    throw new Error(`Column with ID ${toColumnId} not found in project ${toProjectId}`)
  }

  // Calculate position if not provided
  let movePosition = position
  if (movePosition === undefined) {
    const existingTasks = store.query(getBoardTasks$(toProjectId))
    const tasksInColumn = existingTasks.filter((t: any) => t.columnId === toColumnId)
    const validPositions = tasksInColumn
      .map((t: any) => t.position)
      .filter((pos: any) => typeof pos === 'number' && !isNaN(pos))
    movePosition = validPositions.length > 0 ? Math.max(...validPositions) + 1 : 0
  }

  // Create move to project event
  store.commit(
    events.taskMovedToProject({
      taskId: taskId,
      toProjectId: toProjectId.trim(),
      toColumnId: toColumnId,
      position: movePosition,
      updatedAt: new Date(),
    })
  )

  return {
    success: true,
    task: {
      id: taskId,
      projectId: toProjectId,
      columnId: toColumnId,
      position: movePosition,
    },
  }
}

/**
 * Orphans a task (removes it from its current project)
 */
function orphanTaskCore(store: Store, params: OrphanTaskParams): OrphanTaskResult {
  const { taskId, toColumnId, position } = params

  // Verify task exists
  const tasks = store.query(getTaskById$(taskId))
  validators.requireEntity(tasks, 'Task', taskId)

  // Verify column is orphaned
  const orphanedColumns = store.query(getOrphanedColumns$)
  const targetColumn = orphanedColumns.find((c: any) => c.id === toColumnId)
  if (!targetColumn) {
    throw new Error(`Orphaned column with ID ${toColumnId} not found`)
  }
  if (targetColumn.projectId) {
    throw new Error(
      `Column ${toColumnId} belongs to project ${targetColumn.projectId}, cannot use for orphaned task`
    )
  }

  // Calculate position if not provided
  const movePosition = position ?? 0

  // Create move to project event (with null projectId for orphaning)
  store.commit(
    events.taskMovedToProject({
      taskId: taskId,
      toProjectId: undefined,
      toColumnId: toColumnId,
      position: movePosition,
      updatedAt: new Date(),
    })
  )

  return {
    success: true,
    task: {
      id: taskId,
      columnId: toColumnId,
      position: movePosition,
    },
  }
}

/**
 * Archives a task (core implementation)
 */
function archiveTaskCore(store: Store, taskId: string): ArchiveTaskResult {
  // Verify task exists
  const tasks = store.query(getTaskById$(taskId))
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
function unarchiveTaskCore(store: Store, taskId: string): UnarchiveTaskResult {
  // Verify task exists (need to query without archive filter)
  const tasks = store.query(getTaskById$(taskId))
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
function getTaskByIdCore(store: Store, taskId: string): GetTaskByIdResult {
  // Query for the task
  const tasks = store.query(getTaskById$(taskId)) as any[]
  const task = validators.requireEntity(tasks, 'Task', taskId)

  return {
    success: true,
    task: {
      id: task.id,
      projectId: task.projectId,
      columnId: task.columnId,
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
function getProjectTasksCore(store: Store, projectId: string): GetProjectTasksResult {
  // Verify project exists
  const projects = store.query(getProjects$)
  const project = projects.find((p: any) => p.id === projectId)
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`)
  }

  // Get columns for mapping IDs to names
  const columns = store.query(getBoardColumns$(projectId))
  const columnMap = new Map(columns.map((c: any) => [c.id, c.name]))

  const tasks = store.query(getBoardTasks$(projectId)) as any[]
  return {
    success: true,
    projectName: project.name,
    tasks: tasks.map((t: any) => ({
      id: t.id,
      projectId: t.projectId,
      columnId: t.columnId,
      columnName: columnMap.get(t.columnId) || 'Unknown',
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
function getOrphanedTasksCore(store: Store): GetOrphanedTasksResult {
  const tasks = store.query(getOrphanedTasks$) as any[]
  return {
    success: true,
    tasks: tasks.map((t: any) => ({
      id: t.id,
      projectId: t.projectId,
      columnId: t.columnId,
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
