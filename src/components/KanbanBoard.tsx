import React, { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { useQuery, useStore } from '@livestore/react'
import { useParams } from 'react-router-dom'
import { getBoardColumns$, getBoardTasks$ } from '../livestore/queries.js'
import type { Column, Task } from '../livestore/schema.js'
import { events } from '../livestore/schema.js'
import { KanbanColumn } from './KanbanColumn.js'
import { TaskCard } from './TaskCard.js'

export function KanbanBoard() {
  const { boardId } = useParams<{ boardId: string }>()
  const { store } = useStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  if (!boardId) {
    return <div>Board not found</div>
  }

  const columns = useQuery(getBoardColumns$(boardId)) ?? []
  const tasks = useQuery(getBoardTasks$(boardId)) ?? []

  // Group tasks by column
  const tasksByColumn = (tasks || []).reduce((acc: Record<string, Task[]>, task: Task) => {
    if (task?.columnId && !acc[task.columnId]) {
      acc[task.columnId] = []
    }
    if (task?.columnId) {
      acc[task.columnId]?.push(task)
    }
    return acc
  }, {})

  // Set up sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    })
  )

  // Find task by ID helper
  const findTask = (taskId: string): Task | undefined => {
    return tasks.find(task => task.id === taskId)
  }

  // Recalculate positions in a column (not used yet, but will be needed for future optimizations)
  // const recalculatePositions = (
  //   columnTasks: Task[],
  //   insertIndex: number,
  //   excludeTaskId?: string
  // ) => {
  //   return columnTasks
  //     .filter(task => task.id !== excludeTaskId)
  //     .map((task, index) => ({
  //       ...task,
  //       position: index >= insertIndex ? index + 1 : index,
  //     }))
  // }

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string
    const task = findTask(taskId)
    setActiveTask(task || null)
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Could add visual feedback here for drop zones
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over || !active) return

    const taskId = active.id as string
    const task = findTask(taskId)
    if (!task) return

    // Extract column ID and position from the over identifier
    const overId = over.id as string
    let targetColumnId: string
    let targetPosition: number

    if (overId.startsWith('column-')) {
      // Dropped on a column (empty area)
      targetColumnId = overId.replace('column-', '')
      targetPosition = tasksByColumn[targetColumnId]?.length || 0
    } else {
      // Dropped on another task - insert before the target task
      const targetTask = findTask(overId)
      if (!targetTask) return
      targetColumnId = targetTask.columnId

      // If moving within the same column and dropping after the current position,
      // we need to account for the fact that the dragged task will be removed first
      if (task.columnId === targetColumnId && task.position < targetTask.position) {
        targetPosition = targetTask.position - 1
      } else {
        targetPosition = targetTask.position
      }
    }

    // Don't do anything if dropped in the same position
    if (task.columnId === targetColumnId && task.position === targetPosition) {
      return
    }

    // Calculate position updates for affected tasks
    const now = new Date()
    const moveEvents: any[] = []

    if (task.columnId === targetColumnId) {
      // Moving within the same column
      const columnTasks = tasksByColumn[targetColumnId] || []

      if (task.position < targetPosition) {
        // Moving down: shift tasks between old and new position up
        columnTasks
          .filter(
            t => t.position > task.position && t.position <= targetPosition && t.id !== taskId
          )
          .forEach(t => {
            moveEvents.push(
              events.taskMoved({
                taskId: t.id,
                toColumnId: targetColumnId,
                position: t.position - 1,
                updatedAt: now,
              })
            )
          })
      } else {
        // Moving up: shift tasks between new and old position down
        columnTasks
          .filter(
            t => t.position >= targetPosition && t.position < task.position && t.id !== taskId
          )
          .forEach(t => {
            moveEvents.push(
              events.taskMoved({
                taskId: t.id,
                toColumnId: targetColumnId,
                position: t.position + 1,
                updatedAt: now,
              })
            )
          })
      }
    } else {
      // Moving between columns
      const oldColumnTasks = tasksByColumn[task.columnId] || []
      const newColumnTasks = tasksByColumn[targetColumnId] || []

      // Shift tasks in old column up
      oldColumnTasks
        .filter(t => t.position > task.position)
        .forEach(t => {
          moveEvents.push(
            events.taskMoved({
              taskId: t.id,
              toColumnId: task.columnId,
              position: t.position - 1,
              updatedAt: now,
            })
          )
        })

      // Shift tasks in new column down
      newColumnTasks
        .filter(t => t.position >= targetPosition)
        .forEach(t => {
          moveEvents.push(
            events.taskMoved({
              taskId: t.id,
              toColumnId: targetColumnId,
              position: t.position + 1,
              updatedAt: now,
            })
          )
        })
    }

    // Commit all position updates
    moveEvents.forEach(event => store.commit(event))

    // Finally, move the dragged task
    store.commit(
      events.taskMoved({
        taskId,
        toColumnId: targetColumnId,
        position: targetPosition,
        updatedAt: now,
      })
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className='h-full bg-white'>
        <div className='flex h-full overflow-x-auto p-6 gap-6'>
          {(columns || []).map((column: Column) => (
            <KanbanColumn key={column.id} column={column} tasks={tasksByColumn[column.id] || []} />
          ))}
        </div>
      </div>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} isDragOverlay /> : null}</DragOverlay>
    </DndContext>
  )
}
