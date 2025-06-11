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
import { useParams, Link } from 'react-router-dom'
import { getBoardColumns$, getBoardTasks$, getBoardById$ } from '../livestore/queries.js'
import type { Column, Task, Board } from '../livestore/schema.js'
import { events } from '../livestore/schema.js'
import { KanbanColumn } from './KanbanColumn.js'
import { TaskCard } from './TaskCard.js'
import { TaskModal } from './TaskModal.js'

export function KanbanBoard() {
  const { boardId } = useParams<{ boardId: string }>()
  const { store } = useStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [insertionPreview, setInsertionPreview] = useState<{
    columnId: string
    position: number
  } | null>(null)
  const [dragOverAddCard, setDragOverAddCard] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  if (!boardId) {
    return <div>Board not found</div>
  }

  const boardResult = useQuery(getBoardById$(boardId))
  const board = boardResult?.[0] as Board | undefined
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

  // Handle task card click
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId)
  }

  // Handle modal close
  const handleModalClose = () => {
    setSelectedTaskId(null)
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

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event
    if (!over || !active) {
      setInsertionPreview(null)
      setDragOverAddCard(null)
      return
    }

    const overId = over.id as string
    const activeTaskId = active.id as string
    const draggedTask = findTask(activeTaskId)

    if (!draggedTask) {
      setInsertionPreview(null)
      setDragOverAddCard(null)
      return
    }

    if (overId.startsWith('add-card-')) {
      // Hovering over Add Card button
      const targetColumnId = overId.replace('add-card-', '')
      setDragOverAddCard(targetColumnId)
      const columnTasks = tasksByColumn[targetColumnId] || []
      const targetPosition = columnTasks.filter(t => t.id !== activeTaskId).length
      setInsertionPreview({ columnId: targetColumnId, position: targetPosition })
    } else {
      // Hovering over a task
      setDragOverAddCard(null)
      const targetTask = findTask(overId)
      if (!targetTask) {
        setInsertionPreview(null)
        return
      }

      // Don't show insertion preview if dragging a task over itself
      if (targetTask.id === activeTaskId) {
        setInsertionPreview(null)
        return
      }

      const targetColumnId = targetTask.columnId
      let targetPosition = targetTask.position

      // For same-column movements, adjust position if moving down
      if (targetColumnId === draggedTask.columnId && draggedTask.position < targetTask.position) {
        targetPosition = targetTask.position - 1
      }

      // Don't show preview if the position would be the same
      if (targetColumnId === draggedTask.columnId && targetPosition === draggedTask.position) {
        setInsertionPreview(null)
        return
      }

      setInsertionPreview({ columnId: targetColumnId, position: targetPosition })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setInsertionPreview(null)
    setDragOverAddCard(null)

    if (!over || !active) return

    const taskId = active.id as string
    const task = findTask(taskId)
    if (!task) return

    const overId = over.id as string
    let targetColumnId: string
    let targetPosition: number

    if (overId.startsWith('add-card-')) {
      // Dropped on Add Card button - place at end of column
      targetColumnId = overId.replace('add-card-', '')
      const columnTasks = tasksByColumn[targetColumnId] || []
      targetPosition = columnTasks.filter(t => t.id !== taskId).length
    } else {
      // Dropped on another task
      const targetTask = findTask(overId)
      if (!targetTask) return

      targetColumnId = targetTask.columnId
      targetPosition = targetTask.position

      // For same-column movements, adjust position if moving down
      if (task.columnId === targetColumnId && task.position < targetTask.position) {
        targetPosition = targetTask.position - 1
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
        {/* Board Header */}
        <div className='border-b border-gray-200 bg-white px-6 py-4'>
          <div className='flex items-center gap-4'>
            <Link
              to='/boards'
              className='flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors'
              aria-label='Back to boards'
            >
              <svg
                className='w-4 h-4 text-gray-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            </Link>
            <h1 className='text-xl font-semibold text-gray-900'>{board?.name || 'Loading...'}</h1>
          </div>
        </div>

        {/* Board Content */}
        <div
          className='flex h-full overflow-x-auto p-6 gap-6 pb-6'
          style={{ height: 'calc(100% - 73px)' }}
        >
          {(columns || []).map((column: Column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn[column.id] || []}
              insertionPreview={
                insertionPreview?.columnId === column.id ? insertionPreview.position : null
              }
              draggedTaskHeight={activeTask ? 76 : 0} // Approximate task card height
              draggedTaskId={activeTask?.id || null}
              showAddCardPreview={dragOverAddCard === column.id}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      </div>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} isDragOverlay /> : null}</DragOverlay>
      <TaskModal taskId={selectedTaskId} onClose={handleModalClose} />
    </DndContext>
  )
}
