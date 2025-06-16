import type { Store } from '@livestore/livestore'
import { events } from '../livestore/schema.js'
import { getBoards$, getBoardColumns$, getBoardTasks$, getUsers$ } from '../livestore/queries.js'

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
  boardName?: string
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

    // Get all boards to determine target board
    const boards = store.query(getBoards$)
    if (boards.length === 0) {
      return { success: false, error: 'No boards available. Please create a board first.' }
    }

    // Use provided boardId or default to first board
    const targetBoard = boardId ? boards.find((b: any) => b.id === boardId) : boards[0]
    if (!targetBoard) {
      return {
        success: false,
        error: boardId ? `Board with ID ${boardId} not found` : 'No boards available',
      }
    }

    // Get columns for the target board
    const columns = store.query(getBoardColumns$(targetBoard.id))
    if (columns.length === 0) {
      return {
        success: false,
        error: `Board "${targetBoard.name}" has no columns. Please add columns first.`,
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
    const existingTasks = store.query(getBoardTasks$(targetBoard.id))
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
      boardId: targetBoard.id,
      boardName: targetBoard.name,
      columnId: targetColumn.id,
      columnName: targetColumn.name,
      title: title.trim(),
      position: nextPosition,
      existingTasksInColumn: tasksInColumn.length,
    })

    store.commit(
      events.taskCreated({
        id: taskId,
        boardId: targetBoard.id,
        columnId: targetColumn.id,
        title: title.trim(),
        position: nextPosition,
        createdAt: new Date(),
      })
    )

    console.log('✅ Task creation event committed')

    // Add description if provided
    if (description?.trim()) {
      store.commit(
        events.taskUpdated({
          taskId,
          title: undefined,
          description: description.trim(),
          assigneeIds: undefined,
          updatedAt: new Date(),
        })
      )
    }

    // Add assignee if provided
    if (assigneeId) {
      store.commit(
        events.taskUpdated({
          taskId,
          title: undefined,
          description: undefined,
          assigneeIds: [assigneeId],
          updatedAt: new Date(),
        })
      )
    }

    return {
      success: true,
      taskId,
      taskTitle: title.trim(),
      boardName: targetBoard.name,
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
 * List all available boards
 */
export function listBoards(store: Store): { success: boolean; boards?: any[]; error?: string } {
  try {
    const boards = store.query(getBoards$)
    return {
      success: true,
      boards: boards.map((b: any) => ({
        id: b.id,
        name: b.name,
        createdAt: b.createdAt,
      })),
    }
  } catch (error) {
    console.error('Error listing boards:', error)
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

    case 'list_boards':
      return listBoards(store)

    default:
      throw new Error(`Unknown tool: ${toolCall.name}`)
  }
}
