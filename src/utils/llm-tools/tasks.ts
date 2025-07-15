import type { Store } from '@livestore/livestore'
import { events } from '../../livestore/schema.js'
import {
  getBoardColumns$,
  getBoardTasks$,
  getUsers$,
  getTaskById$,
  getOrphanedTasks$,
  getProjects$,
} from '../../livestore/queries.js'
import {
  validators,
  wrapToolFunction,
  wrapStringParamFunction,
  wrapNoParamFunction,
} from './base.js'

// ===== TYPE DEFINITIONS =====

export interface TaskCreationParams {
  title: string
  description?: string
  boardId?: string
  columnId?: string
  assigneeId?: string
}

export interface TaskCreationResult {
  success: boolean
  taskId?: string
  error?: string
  taskTitle?: string
  projectName?: string
  columnName?: string
  assigneeName?: string
}

export interface TaskUpdateParams {
  taskId: string
  title?: string
  description?: string
  assigneeIds?: string[]
}

export interface TaskMoveParams {
  taskId: string
  toColumnId: string
  position?: number
}

export interface TaskMoveToProjectParams {
  taskId: string
  toProjectId?: string
  toColumnId: string
  position?: number
}

/**
 * Creates a task using the provided parameters
 */
function createTaskCore(store: Store, params: TaskCreationParams): TaskCreationResult {
  const { title, description, boardId, columnId, assigneeId } = params

  // Validate required fields
  const validTitle = validators.requireId(title, 'Task title')

  // Get all projects to determine target project
  const projects = store.query(getProjects$)
  if (projects.length === 0) {
    throw new Error('No projects available. Please create a project first.')
  }

  // Use provided boardId or default to first project
  const targetProject = boardId ? projects.find((p: any) => p.id === boardId) : projects[0]
  if (!targetProject) {
    throw new Error(boardId ? `Project with ID ${boardId} not found` : 'No projects available')
  }

  // Get columns for the target board
  const columns = store.query(getBoardColumns$(targetProject.id))
  if (columns.length === 0) {
    throw new Error(`Board "${targetProject.name}" has no columns. Please add columns first.`)
  }

  // Use provided columnId or default to first column (typically "To Do")
  const targetColumn = columnId ? columns.find((c: any) => c.id === columnId) : columns[0]
  if (!targetColumn) {
    throw new Error(columnId ? `Column with ID ${columnId} not found` : 'No columns available')
  }

  // Validate assignee if provided
  let assigneeName: string | undefined
  if (assigneeId) {
    const users = store.query(getUsers$)
    validators.validateAssignees([assigneeId], users)
    const assignee = users.find((u: any) => u.id === assigneeId)
    assigneeName = assignee?.name
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

  console.log('🔧 Creating task with data:', {
    id: taskId,
    boardId: targetProject.id,
    projectName: targetProject.name,
    columnId: targetColumn.id,
    columnName: targetColumn.name,
    title: validTitle,
    position: nextPosition,
    existingTasksInColumn: tasksInColumn.length,
  })

  store.commit(
    events.taskCreated({
      id: taskId,
      projectId: targetProject.id,
      columnId: targetColumn.id,
      title: validTitle,
      description: description?.trim() || undefined,
      assigneeIds: assigneeId ? [assigneeId] : undefined,
      position: nextPosition,
      createdAt: new Date(),
    })
  )

  console.log('✅ Task creation event committed')

  return {
    success: true,
    taskId,
    taskTitle: validTitle,
    projectName: targetProject.name,
    columnName: targetColumn.name,
    assigneeName,
  }
}

/**
 * Updates a task with new information (core implementation)
 */
function updateTaskCore(
  store: Store,
  params: TaskUpdateParams
): { success: boolean; error?: string; task?: any } {
  try {
    const { taskId, title, description, assigneeIds } = params

    // Validate required fields
    const validTaskId = validators.requireId(taskId, 'Task ID')

    // Verify task exists
    const tasks = store.query(getTaskById$(validTaskId))
    validators.requireEntity(tasks, 'Task', validTaskId)

    // Validate assignees if provided
    if (assigneeIds && assigneeIds.length > 0) {
      const users = store.query(getUsers$)
      validators.validateAssignees(assigneeIds, users)
    }

    // Create update event
    store.commit(
      events.taskUpdated({
        taskId: validTaskId,
        title: title?.trim(),
        description: description?.trim(),
        assigneeIds,
        updatedAt: new Date(),
      })
    )

    return {
      success: true,
      task: {
        id: validTaskId,
        title,
        description,
        assigneeIds,
      },
    }
  } catch (error) {
    console.error('Error updating task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Moves a task to a different column (core implementation)
 */
function moveTaskCore(
  store: Store,
  params: TaskMoveParams
): { success: boolean; error?: string; task?: any } {
  try {
    const { taskId, toColumnId, position } = params

    // Validate required fields
    const validTaskId = validators.requireId(taskId, 'Task ID')
    const validColumnId = validators.requireId(toColumnId, 'Column ID')

    // Verify task exists
    const tasks = store.query(getTaskById$(validTaskId))
    const task = validators.requireEntity(tasks, 'Task', validTaskId)

    // Get project to verify column exists
    if (!task.projectId) {
      return { success: false, error: 'Cannot move orphaned task' }
    }

    const columns = store.query(getBoardColumns$(task.projectId))
    const targetColumn = columns.find((c: any) => c.id === validColumnId)
    if (!targetColumn) {
      return { success: false, error: `Column with ID ${validColumnId} not found` }
    }

    // Calculate position if not provided
    let movePosition = position
    if (movePosition === undefined) {
      const existingTasks = store.query(getBoardTasks$(task.projectId))
      const tasksInColumn = existingTasks.filter((t: any) => t.columnId === validColumnId)
      const validPositions = tasksInColumn
        .map((t: any) => t.position)
        .filter((pos: any) => typeof pos === 'number' && !isNaN(pos))
      movePosition = validPositions.length > 0 ? Math.max(...validPositions) + 1 : 0
    }

    // Create move event
    store.commit(
      events.taskMoved({
        taskId: validTaskId,
        toColumnId: validColumnId,
        position: movePosition,
        updatedAt: new Date(),
      })
    )

    return {
      success: true,
      task: {
        id: validTaskId,
        columnId: validColumnId,
        position: movePosition,
      },
    }
  } catch (error) {
    console.error('Error moving task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Moves a task to a different project (core implementation)
 */
function moveTaskToProjectCore(
  store: Store,
  params: TaskMoveToProjectParams
): { success: boolean; error?: string; task?: any } {
  try {
    const { taskId, toProjectId, toColumnId, position } = params

    // Validate required fields
    const validTaskId = validators.requireId(taskId, 'Task ID')
    const validColumnId = validators.requireId(toColumnId, 'Column ID')

    // Verify task exists
    const tasks = store.query(getTaskById$(validTaskId))
    validators.requireEntity(tasks, 'Task', validTaskId)

    // Verify target project and column if projectId provided
    if (toProjectId) {
      const validProjectId = validators.requireId(toProjectId, 'Project ID')
      const projects = store.query(getProjects$)
      const targetProject = projects.find((p: any) => p.id === validProjectId)
      if (!targetProject) {
        return { success: false, error: `Project with ID ${validProjectId} not found` }
      }

      const columns = store.query(getBoardColumns$(validProjectId))
      const targetColumn = columns.find((c: any) => c.id === validColumnId)
      if (!targetColumn) {
        return {
          success: false,
          error: `Column with ID ${validColumnId} not found in project ${validProjectId}`,
        }
      }
    }

    // Calculate position if not provided
    let movePosition = position
    if (movePosition === undefined) {
      if (toProjectId) {
        const validProjectId = validators.requireId(toProjectId, 'Project ID')
        const existingTasks = store.query(getBoardTasks$(validProjectId))
        const tasksInColumn = existingTasks.filter((t: any) => t.columnId === validColumnId)
        const validPositions = tasksInColumn
          .map((t: any) => t.position)
          .filter((pos: any) => typeof pos === 'number' && !isNaN(pos))
        movePosition = validPositions.length > 0 ? Math.max(...validPositions) + 1 : 0
      } else {
        movePosition = 0
      }
    }

    // Create move to project event
    store.commit(
      events.taskMovedToProject({
        taskId: validTaskId,
        toProjectId: toProjectId?.trim(),
        toColumnId: validColumnId,
        position: movePosition,
        updatedAt: new Date(),
      })
    )

    return {
      success: true,
      task: {
        id: validTaskId,
        projectId: toProjectId,
        columnId: validColumnId,
        position: movePosition,
      },
    }
  } catch (error) {
    console.error('Error moving task to project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Archives a task (core implementation)
 */
function archiveTaskCore(
  store: Store,
  taskId: string
): { success: boolean; error?: string; task?: any } {
  try {
    // Validate required fields
    const validTaskId = validators.requireId(taskId, 'Task ID')

    // Verify task exists
    const tasks = store.query(getTaskById$(validTaskId))
    const task = validators.requireEntity(tasks, 'Task', validTaskId)
    if (task.archivedAt) {
      return { success: false, error: 'Task is already archived' }
    }

    // Create archive event
    store.commit(
      events.taskArchived({
        taskId: validTaskId,
        archivedAt: new Date(),
      })
    )

    return {
      success: true,
      task: {
        id: validTaskId,
        archivedAt: new Date(),
      },
    }
  } catch (error) {
    console.error('Error archiving task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Unarchives a task (core implementation)
 */
function unarchiveTaskCore(
  store: Store,
  taskId: string
): { success: boolean; error?: string; task?: any } {
  try {
    // Validate required fields
    const validTaskId = validators.requireId(taskId, 'Task ID')

    // Verify task exists (need to query without archive filter)
    const tasks = store.query(getTaskById$(validTaskId))
    const task = validators.requireEntity(tasks, 'Task', validTaskId)
    if (!task.archivedAt) {
      return { success: false, error: 'Task is not archived' }
    }

    // Create unarchive event
    store.commit(
      events.taskUnarchived({
        taskId: validTaskId,
      })
    )

    return {
      success: true,
      task: {
        id: validTaskId,
        archivedAt: null,
      },
    }
  } catch (error) {
    console.error('Error unarchiving task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get a specific task by ID (core implementation)
 */
function getTaskByIdCore(
  store: Store,
  taskId: string
): { success: boolean; task?: any; error?: string } {
  // Validate required fields
  const validTaskId = validators.requireId(taskId, 'Task ID')

  // Query for the task
  const tasks = store.query(getTaskById$(validTaskId)) as any[]
  const task = validators.requireEntity(tasks, 'Task', validTaskId)

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
function getProjectTasksCore(
  store: Store,
  projectId: string
): { success: boolean; tasks?: any[]; error?: string } {
  // Validate required fields
  const validProjectId = validators.requireId(projectId, 'Project ID')

  // Verify project exists
  const projects = store.query(getProjects$)
  const project = projects.find((p: any) => p.id === validProjectId)
  if (!project) {
    throw new Error(`Project with ID ${validProjectId} not found`)
  }

  const tasks = store.query(getBoardTasks$(validProjectId)) as any[]
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

/**
 * Get all orphaned tasks (tasks without a project) (core implementation)
 */
function getOrphanedTasksCore(store: Store): {
  success: boolean
  tasks?: any[]
  error?: string
} {
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
export const moveTask = wrapToolFunction(moveTaskCore)
export const moveTaskToProject = wrapToolFunction(moveTaskToProjectCore)
export const archiveTask = wrapStringParamFunction(archiveTaskCore)
export const unarchiveTask = wrapStringParamFunction(unarchiveTaskCore)
export const getTaskById = wrapStringParamFunction(getTaskByIdCore)
export const getProjectTasks = wrapStringParamFunction(getProjectTasksCore)
export const getOrphanedTasks = wrapNoParamFunction(getOrphanedTasksCore)
