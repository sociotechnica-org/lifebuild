import type { Task, TaskStatus } from '@lifebuild/shared/schema'

export interface StatusReorderResult {
  taskId: string
  toStatus: TaskStatus
  position: number
  updatedAt: Date
}

/**
 * Calculates the new positions for tasks when reordering within or between statuses.
 *
 * Uses an integer position system with large gaps to minimize database updates.
 */
export function calculateStatusTaskReorder(
  draggedTask: Task,
  targetStatus: TaskStatus,
  targetIndex: number,
  tasksInTargetStatus: Task[]
): StatusReorderResult[] {
  const now = new Date()
  const results: StatusReorderResult[] = []

  // Filter out the dragged task if it's already in the target status
  const otherTasks = tasksInTargetStatus.filter(t => t.id !== draggedTask.id)

  // Calculate the new position for the dragged task
  let newPosition: number

  if (otherTasks.length === 0) {
    newPosition = 1000
  } else if (targetIndex <= 0) {
    const firstTask = otherTasks[0]
    if (firstTask) {
      newPosition = Math.floor(firstTask.position / 2)
      if (newPosition < 1) newPosition = 1
    } else {
      newPosition = 1000
    }
  } else if (targetIndex >= otherTasks.length) {
    const lastTask = otherTasks[otherTasks.length - 1]
    if (lastTask) {
      newPosition = lastTask.position + 1000
    } else {
      newPosition = 1000
    }
  } else {
    const prevTask = otherTasks[targetIndex - 1]
    const nextTask = otherTasks[targetIndex]
    if (prevTask && nextTask) {
      newPosition = Math.floor((prevTask.position + nextTask.position) / 2)
      if (newPosition <= prevTask.position || newPosition >= nextTask.position) {
        newPosition = prevTask.position
      }
    } else {
      newPosition = 1000
    }
  }

  // Check if we need to normalize positions
  const needsNormalization = shouldNormalizePositions(newPosition, otherTasks, targetIndex)

  if (needsNormalization) {
    return normalizeStatusPositions(draggedTask, targetStatus, targetIndex, otherTasks, now)
  }

  results.push({
    taskId: draggedTask.id,
    toStatus: targetStatus,
    position: newPosition,
    updatedAt: now,
  })

  return results
}

function shouldNormalizePositions(
  newPosition: number,
  otherTasks: Task[],
  targetIndex: number
): boolean {
  if (otherTasks.length === 0) return false

  if (targetIndex > 0 && targetIndex < otherTasks.length) {
    const prevTask = otherTasks[targetIndex - 1]
    const nextTask = otherTasks[targetIndex]
    if (prevTask && nextTask) {
      const gap = nextTask.position - prevTask.position
      return gap <= 1 || newPosition <= prevTask.position || newPosition >= nextTask.position
    }
  }

  if (targetIndex === 0 && otherTasks.length > 0) {
    const firstTask = otherTasks[0]
    // Normalize if new position would be <= 0 OR would collide with first task's position
    if (firstTask && (newPosition <= 0 || newPosition >= firstTask.position)) {
      return true
    }
  }

  return false
}

function normalizeStatusPositions(
  draggedTask: Task,
  targetStatus: TaskStatus,
  targetIndex: number,
  otherTasks: Task[],
  updatedAt: Date
): StatusReorderResult[] {
  const results: StatusReorderResult[] = []
  const POSITION_GAP = 1000

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

  allTasks.forEach((task, index) => {
    const newPosition = (index + 1) * POSITION_GAP

    if (task.id === draggedTask.id || task.position !== newPosition) {
      results.push({
        taskId: task.id,
        toStatus: targetStatus,
        position: newPosition,
        updatedAt,
      })
    }
  })

  return results
}

/**
 * Calculates the target status and index where the task should be inserted
 */
export function calculateStatusDropTarget(
  overId: string,
  draggedTask: Task,
  tasksByStatus: Record<string, Task[]>
): { statusId: string; index: number } | null {
  // Handle "Add Card" button drops
  if (overId.startsWith('add-card-')) {
    const statusId = overId.replace('add-card-', '')
    const tasks = tasksByStatus[statusId] || []
    return { statusId, index: tasks.length }
  }

  // Handle column drops (for empty columns)
  if (overId.startsWith('column-')) {
    const statusId = overId.replace('column-', '')
    return { statusId, index: 0 }
  }

  // Handle task card drops
  const targetTask = Object.values(tasksByStatus)
    .flat()
    .find(t => t.id === overId)

  if (!targetTask || !targetTask.status) return null

  const tasksInStatus = tasksByStatus[targetTask.status] || []
  const sortedTasks = [...tasksInStatus].sort((a, b) => a.position - b.position)
  const targetIndex = sortedTasks.findIndex(t => t.id === targetTask.id)

  // When dropping within the same status, the index calculation in calculateStatusTaskReorder
  // already filters out the dragged task, so we don't need to adjust the index.
  // Always return the target task's index - the reorder function handles the rest.
  return { statusId: targetTask.status, index: targetIndex }
}
