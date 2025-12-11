import React, { useState, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useStore } from '@livestore/react'
import type { Task } from '@lifebuild/shared/schema'
import type { StatusColumn } from '@lifebuild/shared'
import { events } from '@lifebuild/shared/schema'
import { SimpleTaskCard } from './SimpleTaskCard.js'

interface ProjectKanbanColumnProps {
  column: StatusColumn
  tasks: Task[]
  insertionPreview: number | null
  draggedTaskHeight: number
  draggedTaskId: string | null
  showAddCardPreview: boolean
  onTaskClick?: (taskId: string) => void
  projectId: string
}

// Inline add task form component
function InlineAddTaskForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (title: string) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onSubmit(title.trim())
      setTitle('')
      // Refocus input for rapid entry
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className='mb-2'>
      <input
        ref={inputRef}
        type='text'
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Task name'
        className='w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        autoFocus
      />
      <div className='flex gap-2 mt-2'>
        <button
          type='submit'
          disabled={!title.trim()}
          className='px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed'
        >
          Add
        </button>
        <button
          type='button'
          onClick={onCancel}
          className='px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300'
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export function ProjectKanbanColumn({
  column,
  tasks,
  insertionPreview,
  draggedTaskHeight,
  draggedTaskId,
  showAddCardPreview,
  onTaskClick,
  projectId,
}: ProjectKanbanColumnProps) {
  const { store } = useStore()
  const [isAddingTask, setIsAddingTask] = useState(false)

  // Only allow adding tasks in the To Do column
  const canAddTask = column.status === 'todo'

  // Set up droppable for the Add Card button area
  const { setNodeRef: setAddCardRef } = useDroppable({
    id: `add-card-${column.id}`,
  })

  // Insertion preview placeholder
  const InsertionPlaceholder = () => (
    <div
      className='bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg mb-2 transition-all duration-200'
      style={{ height: `${draggedTaskHeight}px` }}
    >
      <div className='flex items-center justify-center h-full text-blue-500 text-sm opacity-75'>
        Drop here
      </div>
    </div>
  )

  // Filter out the dragged task
  const visibleTasks = tasks.filter(task => task.id !== draggedTaskId)

  const handleAddTask = (title: string) => {
    const nextPosition = tasks.length === 0 ? 0 : Math.max(...tasks.map(t => t.position)) + 1

    store.commit(
      events.taskCreatedV2({
        id: crypto.randomUUID(),
        projectId,
        title,
        description: undefined,
        status: column.status,
        assigneeIds: undefined,
        position: nextPosition,
        createdAt: new Date(),
      })
    )
  }

  return (
    <div className='flex-shrink-0 w-72 min-w-72 bg-gray-50 rounded-lg p-4'>
      {/* Column Header */}
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
          {column.name}
        </h2>
        <span className='text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-1'>
          {tasks.length}
        </span>
      </div>

      {/* Column Content */}
      <div className='space-y-2 min-h-24'>
        {(() => {
          const elements: React.ReactNode[] = []

          // Sort visible tasks by position
          const sortedTasks = [...visibleTasks].sort((a, b) => a.position - b.position)

          sortedTasks.forEach((task, index) => {
            // Show placeholder before this task if needed
            if (insertionPreview === index) {
              elements.push(<InsertionPlaceholder key={`placeholder-${index}`} />)
            }

            elements.push(<SimpleTaskCard key={task.id} task={task} onClick={onTaskClick} />)
          })

          // Show placeholder at the end if needed
          if (insertionPreview === sortedTasks.length || showAddCardPreview) {
            elements.push(<InsertionPlaceholder key='placeholder-end' />)
          }

          return elements
        })()}

        {/* Add Task - only in To Do column */}
        {canAddTask && (
          <>
            {isAddingTask ? (
              <InlineAddTaskForm onSubmit={handleAddTask} onCancel={() => setIsAddingTask(false)} />
            ) : (
              <button
                ref={setAddCardRef}
                onClick={() => setIsAddingTask(true)}
                className='w-full p-3 text-left text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors text-sm'
              >
                + Add task
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
