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
 * This uses an integer position system with large gaps to minimize database updates:
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
      // Use integer division to stay as integer
      newPosition = Math.floor(firstTask.position / 2)
      // Ensure we don't go below 1
      if (newPosition < 1) newPosition = 1
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
      // Use integer division for midpoint
      newPosition = Math.floor((prevTask.position + nextTask.position) / 2)
      // If no space between positions, trigger normalization
      if (newPosition <= prevTask.position || newPosition >= nextTask.position) {
        // This will trigger normalization below
        newPosition = prevTask.position
      }
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

  // Check if we have no space between integer positions
  if (targetIndex > 0 && targetIndex < otherTasks.length) {
    const prevTask = otherTasks[targetIndex - 1]
    const nextTask = otherTasks[targetIndex]
    if (prevTask && nextTask) {
      // If positions are consecutive integers, we need to normalize
      const gap = nextTask.position - prevTask.position
      return gap <= 1 || newPosition <= prevTask.position || newPosition >= nextTask.position
    }
  }

  // Also check if we're at the beginning and position is too low
  if (targetIndex === 0 && otherTasks.length > 0) {
    const firstTask = otherTasks[0]
    if (firstTask && newPosition <= 0) {
      return true
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
    if (task.id === draggedTask.id || task.position !== newPosition) {
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
