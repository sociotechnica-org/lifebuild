import type { Task } from '@work-squared/shared/schema'

export interface ReorderResult {
  taskId: string
  toColumnId: string
  position: number
  updatedAt: Date
}

/**
 * Calculates the new positions for tasks when reordering within or between columns.
 *
 * This uses a simple floating-point position system to minimize database updates:
 * - When moving a task, we calculate a new position between its neighbors
 * - Only the moved task needs to be updated (no cascading updates)
 * - Positions are periodically normalized when gaps get too small
 *
 * @param draggedTask - The task being moved
 * @param targetColumnId - The column to move to
 * @param targetIndex - The index position in the sorted task list (0-based)
 * @param tasksInTargetColumn - All tasks currently in the target column (sorted by position)
 * @returns Array of tasks that need position updates
 */
export function calculateTaskReorder(
  draggedTask: Task,
  targetColumnId: string,
  targetIndex: number,
  tasksInTargetColumn: Task[]
): ReorderResult[] {
  const now = new Date()
  const results: ReorderResult[] = []

  // Filter out the dragged task if it's already in the target column
  const otherTasks = tasksInTargetColumn.filter(t => t.id !== draggedTask.id)

  // Calculate the new position for the dragged task
  let newPosition: number

  if (otherTasks.length === 0) {
    // Empty column - use position 1000 as starting point
    newPosition = 1000
  } else if (targetIndex <= 0) {
    // Moving to the beginning
    const firstTask = otherTasks[0]
    if (firstTask) {
      newPosition = firstTask.position / 2
    } else {
      newPosition = 1000
    }
  } else if (targetIndex >= otherTasks.length) {
    // Moving to the end
    const lastTask = otherTasks[otherTasks.length - 1]
    if (lastTask) {
      newPosition = lastTask.position + 1000
    } else {
      newPosition = 1000
    }
  } else {
    // Moving between two tasks
    const prevTask = otherTasks[targetIndex - 1]
    const nextTask = otherTasks[targetIndex]
    if (prevTask && nextTask) {
      newPosition = (prevTask.position + nextTask.position) / 2
    } else {
      newPosition = 1000
    }
  }

  // Check if we need to normalize positions (if gap is too small)
  const needsNormalization = shouldNormalizePositions(newPosition, otherTasks, targetIndex)

  if (needsNormalization) {
    // Normalize all positions in the column with even spacing
    const normalizedResults = normalizeColumnPositions(
      draggedTask,
      targetColumnId,
      targetIndex,
      otherTasks,
      now
    )
    return normalizedResults
  }

  // Only update the dragged task
  results.push({
    taskId: draggedTask.id,
    toColumnId: targetColumnId,
    position: newPosition,
    updatedAt: now,
  })

  return results
}

/**
 * Checks if positions need normalization (gaps too small for reliable ordering)
 */
function shouldNormalizePositions(
  newPosition: number,
  otherTasks: Task[],
  targetIndex: number
): boolean {
  if (otherTasks.length === 0) return false

  // Check if the new position is getting too close to neighbors
  const MIN_GAP = 0.001

  if (targetIndex > 0 && targetIndex < otherTasks.length) {
    const prevTask = otherTasks[targetIndex - 1]
    const nextTask = otherTasks[targetIndex]
    if (prevTask && nextTask) {
      const gap = nextTask.position - prevTask.position
      return gap < MIN_GAP * 2
    }
  }

  return false
}

/**
 * Normalizes all positions in a column to have even spacing
 */
function normalizeColumnPositions(
  draggedTask: Task,
  targetColumnId: string,
  targetIndex: number,
  otherTasks: Task[],
  updatedAt: Date
): ReorderResult[] {
  const results: ReorderResult[] = []
  const POSITION_GAP = 1000

  // Create the final sorted list with the dragged task in its new position
  const allTasks: Task[] = []
  for (let i = 0; i < targetIndex; i++) {
    const task = otherTasks[i]
    if (task) {
      allTasks.push(task)
    }
  }
  allTasks.push(draggedTask)
  for (let i = targetIndex; i < otherTasks.length; i++) {
    const task = otherTasks[i]
    if (task) {
      allTasks.push(task)
    }
  }

  // Assign new positions with even spacing
  allTasks.forEach((task, index) => {
    const newPosition = (index + 1) * POSITION_GAP

    // Only add to results if position actually changed
    if (task.id === draggedTask.id || Math.abs(task.position - newPosition) > 0.01) {
      results.push({
        taskId: task.id,
        toColumnId: targetColumnId,
        position: newPosition,
        updatedAt,
      })
    }
  })

  return results
}

/**
 * Simplified drop target calculation for drag and drop
 * Returns the target column and index where the task should be inserted
 */
export function calculateDropTarget(
  overId: string,
  draggedTask: Task,
  tasksByColumn: Record<string, Task[]>
): { columnId: string; index: number } | null {
  // Handle empty column drops
  if (overId.startsWith('empty-column-')) {
    const columnId = overId.replace('empty-column-', '')
    return { columnId, index: 0 }
  }

  // Handle "Add Card" button drops
  if (overId.startsWith('add-card-')) {
    const columnId = overId.replace('add-card-', '')
    const tasks = tasksByColumn[columnId] || []
    return { columnId, index: tasks.length }
  }

  // Handle task card drops
  const targetTask = Object.values(tasksByColumn)
    .flat()
    .find(t => t.id === overId)

  if (!targetTask) return null

  const tasksInColumn = tasksByColumn[targetTask.columnId] || []
  const sortedTasks = [...tasksInColumn].sort((a, b) => a.position - b.position)
  const targetIndex = sortedTasks.findIndex(t => t.id === targetTask.id)

  // If dropping on a task in the same column and below the dragged task,
  // we want to place it after the target
  if (targetTask.columnId === draggedTask.columnId) {
    const draggedIndex = sortedTasks.findIndex(t => t.id === draggedTask.id)
    if (draggedIndex < targetIndex) {
      return { columnId: targetTask.columnId, index: targetIndex }
    }
  }

  return { columnId: targetTask.columnId, index: targetIndex }
}
