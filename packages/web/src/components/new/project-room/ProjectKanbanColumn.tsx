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
        className='w-full p-3 border border-[#e5e2dc] rounded-lg text-sm text-[#2f2b27] bg-white focus:outline-none focus:ring-2 focus:ring-[#8b8680] focus:border-transparent'
        autoFocus
      />
      <div className='flex gap-2 mt-2'>
        <button
          type='submit'
          disabled={!title.trim()}
          className='px-3 py-1 bg-[#2f2b27] text-white text-sm rounded-lg hover:bg-[#3d3832] disabled:bg-[#d4d0c8] disabled:cursor-not-allowed transition-colors'
        >
          Add
        </button>
        <button
          type='button'
          onClick={onCancel}
          className='px-3 py-1 bg-[#f1efe9] text-[#2f2b27] text-sm rounded-lg hover:bg-[#e5e2dc] transition-colors'
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
      className='bg-[#f5f3f0] border-2 border-dashed border-[#d4d0c8] rounded-lg mb-2 transition-all duration-200'
      style={{ height: `${draggedTaskHeight}px` }}
    >
      <div className='flex items-center justify-center h-full text-[#8b8680] text-sm opacity-75'>
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
    <div className='flex-shrink-0 w-72 min-w-72 h-full flex flex-col bg-[#faf9f7] border border-[#e5e2dc] rounded-2xl p-4'>
      {/* Column Header */}
      <div className='flex items-center justify-between mb-4 flex-shrink-0'>
        <h2 className='text-sm font-semibold text-[#2f2b27] uppercase tracking-wide'>
          {column.name}
        </h2>
        <span className='text-xs text-[#8b8680] bg-[#f1efe9] rounded-full px-2 py-1'>
          {tasks.length}
        </span>
      </div>

      {/* Column Content - Scrollable */}
      <div className='flex-1 overflow-y-auto space-y-2 min-h-0'>
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
                className='w-full p-3 text-left text-[#8b8680] hover:text-[#2f2b27] hover:bg-[#f5f3f0] rounded-lg border-2 border-dashed border-[#d4d0c8] hover:border-[#8b8680] transition-colors text-sm'
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
