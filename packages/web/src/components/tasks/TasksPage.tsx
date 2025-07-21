import { useQuery, useStore } from '@livestore/react'
import React, { useState, useEffect } from 'react'
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { getOrphanedTasks$, getOrphanedColumns$ } from '@work-squared/shared/queries'
import type { Task } from '@work-squared/shared/schema'
import { events } from '@work-squared/shared/schema'
import { KanbanBoard } from './kanban/KanbanBoard.js'
import { CreateTaskModal } from './CreateTaskModal.js'
import { TaskModal } from './TaskModal/TaskModal.js'

export const TasksPage: React.FC = () => {
  const { store } = useStore()
  const tasks = useQuery(getOrphanedTasks$) ?? []
  const columns = useQuery(getOrphanedColumns$) ?? []
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [hasInitializedColumns, setHasInitializedColumns] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [insertionPreview, setInsertionPreview] = useState<{
    columnId: string
    position: number
  } | null>(null)
  const [dragOverAddCard, setDragOverAddCard] = useState<string | null>(null)

  // Initialize default columns for orphaned tasks if none exist
  useEffect(() => {
    if (columns.length === 0 && !hasInitializedColumns) {
      setHasInitializedColumns(true)
      const defaultColumns = [
        { name: 'Todo', position: 0 },
        { name: 'Doing', position: 1 },
        { name: 'In Review', position: 2 },
        { name: 'Done', position: 3 },
      ]

      defaultColumns.forEach(column => {
        store.commit(
          events.columnCreated({
            id: `orphaned-${column.name.toLowerCase().replace(/\s+/g, '-')}`,
            projectId: undefined, // undefined for orphaned columns
            name: column.name,
            position: column.position,
            createdAt: new Date(),
          })
        )
      })
    }
  }, [columns.length, hasInitializedColumns, store])

  // Group tasks by column
  const tasksByColumn = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    columns.forEach(column => {
      grouped[column.id] = tasks.filter(task => task.columnId === column.id)
    })
    return grouped
  }, [tasks, columns])

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
      const targetColumnId = overId.replace('add-card-', '')
      setDragOverAddCard(targetColumnId)
      setInsertionPreview(null)
      return
    }

    // Handle dropping over task cards or columns
    const targetTask = findTask(overId)
    if (targetTask && targetTask.columnId !== draggedTask.columnId) {
      // Calculate insertion position
      const targetColumnTasks = tasksByColumn[targetTask.columnId] || []
      const sortedTasks = [...targetColumnTasks].sort((a, b) => a.position - b.position)
      const targetIndex = sortedTasks.findIndex(t => t.id === targetTask.id)

      setInsertionPreview({
        columnId: targetTask.columnId,
        position: targetIndex,
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

    // Handle dropping on Add Card buttons
    if (overId.startsWith('add-card-')) {
      const targetColumnId = overId.replace('add-card-', '')
      if (targetColumnId === task.columnId) return // Same column, no move needed

      const targetColumnTasks = tasksByColumn[targetColumnId] || []
      const nextPosition =
        targetColumnTasks.length === 0 ? 0 : Math.max(...targetColumnTasks.map(t => t.position)) + 1

      store.commit(
        events.taskMoved({
          taskId: task.id,
          toColumnId: targetColumnId,
          position: nextPosition,
          updatedAt: new Date(),
        })
      )
      return
    }

    // Handle dropping on other tasks
    const targetTask = findTask(overId)
    if (!targetTask) return

    const targetColumnId = targetTask.columnId
    if (targetColumnId === task.columnId && targetTask.id === task.id) return // Same task, no move

    // Move to target position
    const targetColumnTasks = tasksByColumn[targetColumnId] || []
    const sortedTasks = [...targetColumnTasks].sort((a, b) => a.position - b.position)
    const targetIndex = sortedTasks.findIndex(t => t.id === targetTask.id)

    store.commit(
      events.taskMoved({
        taskId: task.id,
        toColumnId: targetColumnId,
        position: targetIndex,
        updatedAt: new Date(),
      })
    )
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
        {columns.length === 0 ? (
          <div className='flex items-center justify-center h-full text-gray-500'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'></div>
              <p className='text-gray-500 mt-4'>Setting up columns...</p>
            </div>
          </div>
        ) : (
          <>
            <KanbanBoard
              columns={columns}
              tasksByColumn={tasksByColumn}
              enableDragAndDrop={true}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              insertionPreview={insertionPreview}
              activeTask={activeTask}
              dragOverAddCard={dragOverAddCard}
              onTaskClick={handleTaskClick}
            />
            <TaskModal taskId={selectedTaskId} onClose={handleModalClose} />
          </>
        )}
      </div>

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projectId={null} // null for orphaned tasks
        defaultColumnId={columns[0]?.id}
      />
    </div>
  )
}
