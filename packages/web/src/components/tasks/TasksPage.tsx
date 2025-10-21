import { useQuery, useStore } from '@livestore/react'
import React, { useState } from 'react'
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { getOrphanedTasks$ } from '@work-squared/shared/queries'
import type { Task, TaskStatus } from '@work-squared/shared/schema'
import { events } from '@work-squared/shared/schema'
import { STATUS_COLUMNS } from '@work-squared/shared'
import { KanbanBoard } from './kanban/KanbanBoard.js'
import { CreateTaskModal } from './CreateTaskModal.js'
import { TaskModal } from './TaskModal/TaskModal.js'
import {
  calculateStatusTaskReorder,
  calculateStatusDropTarget,
} from '../../utils/statusTaskReordering.js'

export const TasksPage: React.FC = () => {
  const { store } = useStore()
  const tasks = useQuery(getOrphanedTasks$) ?? []
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [insertionPreview, setInsertionPreview] = useState<{
    statusId: string
    position: number
  } | null>(null)
  const [dragOverAddCard, setDragOverAddCard] = useState<string | null>(null)

  // Group tasks by status
  const tasksByStatus = React.useMemo(() => {
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

  // Handle task card click
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId)
  }

  // Handle modal close
  const handleModalClose = () => {
    setSelectedTaskId(null)
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

    // Handle dropping over task cards - show preview for both same and different statuses
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

    // Calculate reorder operations
    const targetStatusTasks = tasksByStatus[targetStatusId] || []
    const sortedTargetTasks = [...targetStatusTasks].sort((a, b) => a.position - b.position)
    const reorderResults = calculateStatusTaskReorder(
      task,
      targetStatusId as TaskStatus,
      targetIndex,
      sortedTargetTasks
    )

    // Commit all position updates using v2.TaskStatusChanged
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
    <div className='h-full bg-white flex flex-col'>
      {/* Header */}
      <div className='border-b border-gray-200 bg-white px-6 py-4'>
        <div className='flex justify-between items-center mb-4'>
          <div>
            <h1 className='text-xl font-semibold text-gray-900 mb-1'>Tasks</h1>
            <p className='text-gray-600 text-sm'>Manage tasks across all projects</p>
          </div>
          <button
            onClick={() => setIsCreateTaskModalOpen(true)}
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
          >
            Create Task
          </button>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-hidden'>
        <KanbanBoard
          statusColumns={STATUS_COLUMNS}
          tasksByStatus={tasksByStatus}
          enableDragAndDrop={true}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          insertionPreview={insertionPreview}
          activeTask={activeTask}
          dragOverAddCard={dragOverAddCard}
          onTaskClick={handleTaskClick}
          showRecurringTasks={true}
          projectId={null}
        />
        <TaskModal taskId={selectedTaskId} onClose={handleModalClose} />
      </div>

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projectId={null} // null for orphaned tasks
        defaultStatus='todo'
      />
    </div>
  )
}
