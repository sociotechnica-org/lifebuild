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

export async function executeLLMTool(
  store: Store,
  toolCall: { name: string; parameters: any }
): Promise<any> {
  switch (toolCall.name) {
    case 'create_task':
      return createTask(store, toolCall.parameters)

    case 'list_projects':
      return listProjects(store)

    case 'list_documents':
      return listDocuments(store)

    case 'read_document':
      return readDocument(store, toolCall.parameters.documentId)

    case 'search_documents':
      return searchDocuments(store, toolCall.parameters.query)

    default:
      throw new Error(`Unknown tool: ${toolCall.name}`)
  }
}
