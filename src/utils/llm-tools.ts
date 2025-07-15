import type { Store } from '@livestore/livestore'
import { events } from '../livestore/schema.js'
import {
  getProjects$,
  getBoardColumns$,
  getBoardTasks$,
  getUsers$,
  getDocumentList$,
  getDocumentById$,
  searchDocuments$,
  searchDocumentsWithProject$,
  getProjectDetails$,
  getAllDocuments$,
  getDocumentProjectsByProject$,
  getTaskById$,
  getOrphanedTasks$,
} from '../livestore/queries.js'

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

export interface LLMToolCall {
  name: string
  parameters: any
  result?: any
  error?: string
  status: 'pending' | 'success' | 'error'
}

/**
 * Creates a task using the provided parameters
 */
export function createTask(store: Store, params: TaskCreationParams): TaskCreationResult {
  try {
    const { title, description, boardId, columnId, assigneeId } = params

    if (!title?.trim()) {
      return { success: false, error: 'Task title is required' }
    }

    // Get all projects to determine target project
    const projects = store.query(getProjects$)
    if (projects.length === 0) {
      return { success: false, error: 'No projects available. Please create a project first.' }
    }

    // Use provided boardId or default to first project
    const targetProject = boardId ? projects.find((p: any) => p.id === boardId) : projects[0]
    if (!targetProject) {
      return {
        success: false,
        error: boardId ? `Project with ID ${boardId} not found` : 'No projects available',
      }
    }

    // Get columns for the target board
    const columns = store.query(getBoardColumns$(targetProject.id))
    if (columns.length === 0) {
      return {
        success: false,
        error: `Board "${targetProject.name}" has no columns. Please add columns first.`,
      }
    }

    // Use provided columnId or default to first column (typically "To Do")
    const targetColumn = columnId ? columns.find((c: any) => c.id === columnId) : columns[0]
    if (!targetColumn) {
      return {
        success: false,
        error: columnId ? `Column with ID ${columnId} not found` : 'No columns available',
      }
    }

    // Validate assignee if provided
    let assigneeName: string | undefined
    if (assigneeId) {
      const users = store.query(getUsers$)
      const assignee = users.find((u: any) => u.id === assigneeId)
      if (!assignee) {
        return { success: false, error: `User with ID ${assigneeId} not found` }
      }
      assigneeName = assignee.name
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
      title: title.trim(),
      position: nextPosition,
      existingTasksInColumn: tasksInColumn.length,
    })

    store.commit(
      events.taskCreated({
        id: taskId,
        projectId: targetProject.id,
        columnId: targetColumn.id,
        title: title.trim(),
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
      taskTitle: title.trim(),
      projectName: targetProject.name,
      columnName: targetColumn.name,
      assigneeName,
    }
  } catch (error) {
    console.error('Error creating task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Updates a task with new information
 */
export function updateTask(
  store: Store,
  params: TaskUpdateParams
): { success: boolean; error?: string; task?: any } {
  try {
    const { taskId, title, description, assigneeIds } = params

    if (!taskId?.trim()) {
      return { success: false, error: 'Task ID is required' }
    }

    // Verify task exists
    const tasks = store.query(getTaskById$(taskId.trim()))
    if (tasks.length === 0) {
      return { success: false, error: `Task with ID ${taskId} not found` }
    }

    // Validate assignees if provided
    if (assigneeIds && assigneeIds.length > 0) {
      const users = store.query(getUsers$)
      const userIds = new Set(users.map((u: any) => u.id))
      const invalidAssignees = assigneeIds.filter(id => !userIds.has(id))
      if (invalidAssignees.length > 0) {
        return { success: false, error: `Invalid assignee IDs: ${invalidAssignees.join(', ')}` }
      }
    }

    // Create update event
    store.commit(
      events.taskUpdated({
        taskId: taskId.trim(),
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
  } catch (error) {
    console.error('Error updating task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Moves a task to a different column
 */
export function moveTask(
  store: Store,
  params: TaskMoveParams
): { success: boolean; error?: string; task?: any } {
  try {
    const { taskId, toColumnId, position } = params

    if (!taskId?.trim()) {
      return { success: false, error: 'Task ID is required' }
    }

    if (!toColumnId?.trim()) {
      return { success: false, error: 'Column ID is required' }
    }

    // Verify task exists
    const tasks = store.query(getTaskById$(taskId.trim()))
    if (tasks.length === 0) {
      return { success: false, error: `Task with ID ${taskId} not found` }
    }

    const task = tasks[0]
    if (!task) {
      return { success: false, error: `Task with ID ${taskId} not found` }
    }

    // Get project to verify column exists
    if (!task.projectId) {
      return { success: false, error: 'Cannot move orphaned task' }
    }

    const columns = store.query(getBoardColumns$(task.projectId))
    const targetColumn = columns.find((c: any) => c.id === toColumnId.trim())
    if (!targetColumn) {
      return { success: false, error: `Column with ID ${toColumnId} not found` }
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
        taskId: taskId.trim(),
        toColumnId: toColumnId.trim(),
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
  } catch (error) {
    console.error('Error moving task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Moves a task to a different project
 */
export function moveTaskToProject(
  store: Store,
  params: TaskMoveToProjectParams
): { success: boolean; error?: string; task?: any } {
  try {
    const { taskId, toProjectId, toColumnId, position } = params

    if (!taskId?.trim()) {
      return { success: false, error: 'Task ID is required' }
    }

    if (!toColumnId?.trim()) {
      return { success: false, error: 'Column ID is required' }
    }

    // Verify task exists
    const tasks = store.query(getTaskById$(taskId.trim()))
    if (tasks.length === 0) {
      return { success: false, error: `Task with ID ${taskId} not found` }
    }

    // Verify target project and column if projectId provided
    if (toProjectId) {
      const projects = store.query(getProjects$)
      const targetProject = projects.find((p: any) => p.id === toProjectId.trim())
      if (!targetProject) {
        return { success: false, error: `Project with ID ${toProjectId} not found` }
      }

      const columns = store.query(getBoardColumns$(toProjectId.trim()))
      const targetColumn = columns.find((c: any) => c.id === toColumnId.trim())
      if (!targetColumn) {
        return {
          success: false,
          error: `Column with ID ${toColumnId} not found in project ${toProjectId}`,
        }
      }
    }

    // Calculate position if not provided
    let movePosition = position
    if (movePosition === undefined) {
      if (toProjectId) {
        const existingTasks = store.query(getBoardTasks$(toProjectId.trim()))
        const tasksInColumn = existingTasks.filter((t: any) => t.columnId === toColumnId)
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
        taskId: taskId.trim(),
        toProjectId: toProjectId?.trim(),
        toColumnId: toColumnId.trim(),
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
  } catch (error) {
    console.error('Error moving task to project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Archives a task
 */
export function archiveTask(
  store: Store,
  taskId: string
): { success: boolean; error?: string; task?: any } {
  try {
    if (!taskId?.trim()) {
      return { success: false, error: 'Task ID is required' }
    }

    // Verify task exists
    const tasks = store.query(getTaskById$(taskId.trim()))
    if (tasks.length === 0) {
      return { success: false, error: `Task with ID ${taskId} not found` }
    }

    const task = tasks[0]
    if (!task) {
      return { success: false, error: `Task with ID ${taskId} not found` }
    }
    if (task.archivedAt) {
      return { success: false, error: 'Task is already archived' }
    }

    // Create archive event
    store.commit(
      events.taskArchived({
        taskId: taskId.trim(),
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
  } catch (error) {
    console.error('Error archiving task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Unarchives a task
 */
export function unarchiveTask(
  store: Store,
  taskId: string
): { success: boolean; error?: string; task?: any } {
  try {
    if (!taskId?.trim()) {
      return { success: false, error: 'Task ID is required' }
    }

    // Verify task exists (need to query without archive filter)
    const tasks = store.query(getTaskById$(taskId.trim()))
    if (tasks.length === 0) {
      return { success: false, error: `Task with ID ${taskId} not found` }
    }

    const task = tasks[0]
    if (!task) {
      return { success: false, error: `Task with ID ${taskId} not found` }
    }
    if (!task.archivedAt) {
      return { success: false, error: 'Task is not archived' }
    }

    // Create unarchive event
    store.commit(
      events.taskUnarchived({
        taskId: taskId.trim(),
      })
    )

    return {
      success: true,
      task: {
        id: taskId,
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

// Note: Tool definitions are maintained in functions/_worker.ts
// The Cloudflare Worker is the single source of truth for LLM tool schemas

/**
 * Execute an LLM tool call
 */
/**
 * List all available projects
 */
export function listProjects(store: Store): { success: boolean; projects?: any[]; error?: string } {
  try {
    const projects = store.query(getProjects$) as any[]
    return {
      success: true,
      projects: projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
      })),
    }
  } catch (error) {
    console.error('Error listing projects:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * List all available documents
 */
export function listDocuments(store: Store): {
  success: boolean
  documents?: any[]
  error?: string
} {
  try {
    const documents = store.query(getDocumentList$) as any[]
    return {
      success: true,
      documents: documents.map((d: any) => ({
        id: d.id,
        title: d.title,
        updatedAt: d.updatedAt,
      })),
    }
  } catch (error) {
    console.error('Error listing documents:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Read a specific document by ID
 */
export function readDocument(
  store: Store,
  documentId: string
): { success: boolean; document?: any; error?: string } {
  try {
    if (!documentId?.trim()) {
      return { success: false, error: 'Document ID is required' }
    }

    const documents = store.query(getDocumentById$(documentId)) as any[]
    if (documents.length === 0) {
      return { success: false, error: `Document with ID ${documentId} not found` }
    }

    const document = documents[0]
    return {
      success: true,
      document: {
        id: document.id,
        title: document.title,
        content: document.content,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    }
  } catch (error) {
    console.error('Error reading document:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Search documents by query string
 */
export function searchDocuments(
  store: Store,
  query: string
): { success: boolean; results?: any[]; error?: string } {
  try {
    if (!query?.trim()) {
      return { success: false, error: 'Search query is required' }
    }

    const searchQuery = query.trim().toLowerCase()
    const allDocuments = store.query(searchDocuments$(query.trim())) as any[]

    // Filter documents that match the search query in title or content
    const results = allDocuments.filter(
      (d: any) =>
        d.title.toLowerCase().includes(searchQuery) || d.content.toLowerCase().includes(searchQuery)
    )

    return {
      success: true,
      results: results.map((d: any) => ({
        id: d.id,
        title: d.title,
        snippet: d.content.substring(0, 200) + (d.content.length > 200 ? '...' : ''),
      })),
    }
  } catch (error) {
    console.error('Error searching documents:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get all documents for a specific project
 */
export function getProjectDocuments(
  store: Store,
  projectId: string
): { success: boolean; documents?: any[]; error?: string } {
  try {
    if (!projectId?.trim()) {
      return { success: false, error: 'Project ID is required' }
    }

    // Get document-project associations and all documents, then filter
    const documentProjects = store.query(getDocumentProjectsByProject$(projectId.trim())) as any[]
    const allDocuments = store.query(getAllDocuments$) as any[]
    const documentIds = new Set(documentProjects.map(dp => dp.documentId))
    const documents = allDocuments.filter(doc => documentIds.has(doc.id))

    return {
      success: true,
      documents: documents.map((d: any) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        updatedAt: d.updatedAt,
        createdAt: d.createdAt,
      })),
    }
  } catch (error) {
    console.error('Error getting project documents:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get project documents',
    }
  }
}

/**
 * Search documents within a specific project
 */
export function searchProjectDocuments(
  store: Store,
  query: string,
  projectId?: string
): { success: boolean; results?: any[]; error?: string } {
  try {
    if (!query?.trim()) {
      return { success: false, error: 'Search query is required' }
    }

    const searchQuery = query.trim().toLowerCase()
    let documents = store.query(searchDocumentsWithProject$(query.trim(), projectId)) as any[]

    // If projectId is provided, filter documents by project
    if (projectId) {
      const documentProjects = store.query(getDocumentProjectsByProject$(projectId)) as any[]
      const documentIds = new Set(documentProjects.map(dp => dp.documentId))
      documents = documents.filter(doc => documentIds.has(doc.id))
    }

    // Filter documents that match the search query in title or content
    const results = documents.filter(
      (d: any) =>
        d.title.toLowerCase().includes(searchQuery) || d.content.toLowerCase().includes(searchQuery)
    )

    return {
      success: true,
      results: results.map((d: any) => ({
        id: d.id,
        title: d.title,
        snippet: d.content.substring(0, 200) + (d.content.length > 200 ? '...' : ''),
        projectId: projectId,
      })),
    }
  } catch (error) {
    console.error('Error searching project documents:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search project documents',
    }
  }
}

/**
 * Get a specific task by ID
 */
export function getTaskById(
  store: Store,
  taskId: string
): { success: boolean; task?: any; error?: string } {
  try {
    if (!taskId?.trim()) {
      return { success: false, error: 'Task ID is required' }
    }

    const tasks = store.query(getTaskById$(taskId.trim())) as any[]
    if (tasks.length === 0) {
      return { success: false, error: `Task with ID ${taskId} not found` }
    }

    const task = tasks[0]
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
  } catch (error) {
    console.error('Error getting task by ID:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get all tasks for a specific project
 */
export function getProjectTasks(
  store: Store,
  projectId: string
): { success: boolean; tasks?: any[]; error?: string } {
  try {
    if (!projectId?.trim()) {
      return { success: false, error: 'Project ID is required' }
    }

    // Verify project exists
    const projects = store.query(getProjects$)
    const project = projects.find((p: any) => p.id === projectId.trim())
    if (!project) {
      return { success: false, error: `Project with ID ${projectId} not found` }
    }

    const tasks = store.query(getBoardTasks$(projectId.trim())) as any[]
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
  } catch (error) {
    console.error('Error getting project tasks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get all orphaned tasks (tasks without a project)
 */
export function getOrphanedTasks(store: Store): {
  success: boolean
  tasks?: any[]
  error?: string
} {
  try {
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
  } catch (error) {
    console.error('Error getting orphaned tasks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get detailed information about a project
 */
export function getProjectDetails(
  store: Store,
  projectId: string
): { success: boolean; project?: any; error?: string } {
  try {
    if (!projectId?.trim()) {
      return { success: false, error: 'Project ID is required' }
    }

    const projects = store.query(getProjectDetails$(projectId.trim())) as any[]

    if (projects.length === 0) {
      return { success: false, error: 'Project not found' }
    }

    const project = projects[0]

    // Get document and task counts using client-side filtering
    const documentProjects = store.query(getDocumentProjectsByProject$(projectId.trim())) as any[]
    const tasks = store.query(getBoardTasks$(projectId.trim())) as any[]

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
  } catch (error) {
    console.error('Error getting project details:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get project details',
    }
  }
}

export async function executeLLMTool(
  store: Store,
  toolCall: { name: string; parameters: any }
): Promise<any> {
  switch (toolCall.name) {
    case 'create_task':
      return createTask(store, toolCall.parameters)

    case 'update_task':
      return updateTask(store, toolCall.parameters)

    case 'move_task':
      return moveTask(store, toolCall.parameters)

    case 'move_task_to_project':
      return moveTaskToProject(store, toolCall.parameters)

    case 'archive_task':
      return archiveTask(store, toolCall.parameters.taskId)

    case 'unarchive_task':
      return unarchiveTask(store, toolCall.parameters.taskId)

    case 'get_task_by_id':
      return getTaskById(store, toolCall.parameters.taskId)

    case 'get_project_tasks':
      return getProjectTasks(store, toolCall.parameters.projectId)

    case 'get_orphaned_tasks':
      return getOrphanedTasks(store)

    case 'list_projects':
      return listProjects(store)

    case 'list_documents':
      return listDocuments(store)

    case 'read_document':
      return readDocument(store, toolCall.parameters.documentId)

    case 'search_documents':
      return searchDocuments(store, toolCall.parameters.query)

    case 'get_project_documents':
      return getProjectDocuments(store, toolCall.parameters.projectId)

    case 'search_project_documents':
      return searchProjectDocuments(store, toolCall.parameters.query, toolCall.parameters.projectId)

    case 'get_project_details':
      return getProjectDetails(store, toolCall.parameters.projectId)

    default:
      throw new Error(`Unknown tool: ${toolCall.name}`)
  }
}
