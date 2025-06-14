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
export async function createTask(
  store: Store,
  params: TaskCreationParams
): Promise<TaskCreationResult> {
  try {
    const { title, description, boardId, columnId, assigneeId } = params

    if (!title?.trim()) {
      return { success: false, error: 'Task title is required' }
    }

    // Get all boards to determine target board
    const boards = await store.query(getBoards$)
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
    const columns = await store.query(getBoardColumns$(targetBoard.id))
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
      const users = await store.query(getUsers$)
      const assignee = users.find((u: any) => u.id === assigneeId)
      if (!assignee) {
        return { success: false, error: `User with ID ${assigneeId} not found` }
      }
      assigneeName = assignee.name
    }

    // Get existing tasks in the column to calculate position
    const existingTasks = await store.query(getBoardTasks$(targetBoard.id))
    const tasksInColumn = existingTasks.filter((t: any) => t.columnId === targetColumn.id)
    const nextPosition =
      tasksInColumn.length > 0 ? Math.max(...tasksInColumn.map((t: any) => t.position)) + 1 : 1

    // Create the task
    const taskId = crypto.randomUUID()

    await store.commit(
      events.taskCreated({
        id: taskId,
        boardId: targetBoard.id,
        columnId: targetColumn.id,
        title: title.trim(),
        position: nextPosition,
        createdAt: new Date(),
      })
    )

    // Add description if provided
    if (description?.trim()) {
      await store.commit(
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
      await store.commit(
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

/**
 * Available LLM tools
 */
export const LLM_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'create_task',
      description: 'Create a new task in the Kanban system',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The title/name of the task (required)',
          },
          description: {
            type: 'string',
            description: 'Optional detailed description of the task',
          },
          boardId: {
            type: 'string',
            description:
              'ID of the board to create the task on (optional, defaults to first board)',
          },
          columnId: {
            type: 'string',
            description:
              'ID of the column to place the task in (optional, defaults to first column)',
          },
          assigneeId: {
            type: 'string',
            description: 'ID of the user to assign the task to (optional)',
          },
        },
        required: ['title'],
      },
    },
  },
] as const

/**
 * Execute an LLM tool call
 */
export async function executeLLMTool(
  store: Store,
  toolCall: { name: string; parameters: any }
): Promise<any> {
  switch (toolCall.name) {
    case 'create_task':
      return await createTask(store, toolCall.parameters)

    default:
      throw new Error(`Unknown tool: ${toolCall.name}`)
  }
}
