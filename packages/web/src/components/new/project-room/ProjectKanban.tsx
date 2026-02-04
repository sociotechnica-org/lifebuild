import React, { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core'
import { useStore } from '../../../livestore-compat.js'
import type { Task, TaskStatus } from '@lifebuild/shared/schema'
import { events } from '@lifebuild/shared/schema'
import { STATUS_COLUMNS } from '@lifebuild/shared'
import { ProjectKanbanColumn } from './ProjectKanbanColumn.js'
import { SimpleTaskCard } from './SimpleTaskCard.js'
import { calculateStatusTaskReorder, calculateStatusDropTarget } from './taskReordering.js'
import { usePostHog } from '../../../lib/analytics.js'

interface ProjectKanbanProps {
  tasks: readonly Task[]
  projectId: string
  onTaskClick?: (taskId: string) => void
}

export function ProjectKanban({ tasks, projectId, onTaskClick }: ProjectKanbanProps) {
  const { store } = useStore()
  const posthog = usePostHog()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [insertionPreview, setInsertionPreview] = useState<{
    statusId: string
    position: number
  } | null>(null)
  const [dragOverAddCard, setDragOverAddCard] = useState<string | null>(null)

  // Configure sensors with distance threshold
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    STATUS_COLUMNS.forEach(statusColumn => {
      grouped[statusColumn.status] = tasks.filter(task => task.status === statusColumn.status)
    })
    return grouped
  }, [tasks])

  // Find task by ID helper
  const findTask = (taskId: string): Task | undefined => {
    return tasks.find(task => task.id === taskId)
  }

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

    // Handle dropping over Add Card buttons
    if (overId.startsWith('add-card-')) {
      const targetStatusId = overId.replace('add-card-', '')
      setDragOverAddCard(targetStatusId)
      setInsertionPreview(null)
      return
    }

    // Handle dropping over task cards
    const dropTarget = calculateStatusDropTarget(overId, draggedTask, tasksByStatus)
    if (dropTarget) {
      setInsertionPreview({
        statusId: dropTarget.statusId,
        position: dropTarget.index,
      })
      setDragOverAddCard(null)
    } else {
      setInsertionPreview(null)
      setDragOverAddCard(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    // Clear drag state
    setActiveTask(null)
    setInsertionPreview(null)
    setDragOverAddCard(null)

    if (!over || !active) return

    const taskId = active.id as string
    const task = findTask(taskId)
    if (!task) return

    const overId = over.id as string

    // Calculate drop target
    const dropTarget = calculateStatusDropTarget(overId, task, tasksByStatus)
    if (!dropTarget) return

    const { statusId: targetStatusId, index: targetIndex } = dropTarget

    // Don't move if dropping in same position
    if (targetStatusId === task.status) {
      const statusTasks = tasksByStatus[targetStatusId]
      if (!statusTasks) return
      const sortedTasks = [...statusTasks].sort((a, b) => a.position - b.position)
      const currentIndex = sortedTasks.findIndex(t => t.id === task.id)
      if (currentIndex === targetIndex) return
    }

    // Track status change if the task is moving to a different column
    if (targetStatusId !== task.status) {
      posthog?.capture('task_status_changed', {
        from: task.status,
        to: targetStatusId,
        projectId,
        taskId: task.id,
      })
    }

    // Calculate reorder operations
    const targetStatusTasks = tasksByStatus[targetStatusId] || []
    const sortedTargetTasks = [...targetStatusTasks].sort((a, b) => a.position - b.position)
    const reorderResults = calculateStatusTaskReorder(
      task,
      targetStatusId as TaskStatus,
      targetIndex,
      sortedTargetTasks
    )

    // Commit all position updates
    reorderResults.forEach(result => {
      store.commit(
        events.taskStatusChanged({
          taskId: result.taskId,
          toStatus: result.toStatus,
          position: result.position,
          updatedAt: result.updatedAt,
        })
      )
    })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className='h-full m-4 border border-[#e5e2dc] rounded-2xl bg-white overflow-hidden'>
        <div className='h-full flex gap-4 p-4 overflow-x-auto'>
          {STATUS_COLUMNS.map(statusColumn => (
            <ProjectKanbanColumn
              key={statusColumn.id}
              column={statusColumn}
              tasks={tasksByStatus[statusColumn.status] || []}
              insertionPreview={
                insertionPreview?.statusId === statusColumn.id ? insertionPreview.position : null
              }
              draggedTaskHeight={activeTask ? 60 : 0}
              draggedTaskId={activeTask?.id || null}
              showAddCardPreview={dragOverAddCard === statusColumn.id}
              onTaskClick={onTaskClick}
              projectId={projectId}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeTask ? <SimpleTaskCard task={activeTask} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
