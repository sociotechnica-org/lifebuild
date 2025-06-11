import React, { useState, useEffect } from 'react'
import { useQuery, useStore } from '@livestore/react'
import type { Task, Column } from '../livestore/schema.js'
import { getTaskById$, getBoardColumns$ } from '../livestore/queries.js'
import { events } from '../livestore/schema.js'

interface TaskModalProps {
  taskId: string | null
  onClose: () => void
}

export function TaskModal({ taskId, onClose }: TaskModalProps) {
  // Don't render if no task selected
  if (!taskId) return null

  const { store } = useStore()
  const taskResult = useQuery(getTaskById$(taskId))
  const task = taskResult?.[0] as Task | undefined

  // Don't render if task not found
  if (!task) return null

  const columns = useQuery(getBoardColumns$(task.boardId)) ?? []
  const column = columns.find((col: Column) => col.id === task.columnId)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description || '')
  const [titleError, setTitleError] = useState('')

  // Update form fields when task changes (for optimistic updates)
  useEffect(() => {
    setEditTitle(task.title)
    setEditDescription(task.description || '')
  }, [task.title, task.description])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isEditing) {
        handleCancelEdit()
      } else {
        onClose()
      }
    }
  }

  const validateTitle = (title: string): boolean => {
    const trimmed = title.trim()
    if (!trimmed) {
      setTitleError('Title is required')
      return false
    }
    setTitleError('')
    return true
  }

  const handleSave = () => {
    const trimmedTitle = editTitle.trim()

    if (!validateTitle(trimmedTitle)) {
      return
    }

    // Only update if values have changed
    const titleChanged = trimmedTitle !== task.title
    const descriptionChanged = editDescription !== (task.description || '')

    if (titleChanged || descriptionChanged) {
      store.commit(
        events.taskUpdated({
          taskId: task.id,
          title: titleChanged ? trimmedTitle : undefined,
          description: descriptionChanged ? editDescription || undefined : undefined,
          updatedAt: new Date(),
        })
      )
    }

    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setTitleError('')
    setIsEditing(false)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEditTitle(value)

    // Real-time validation
    if (titleError && value.trim()) {
      setTitleError('')
    }
  }

  // Set up escape key listener
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-50'
      onClick={handleBackdropClick}
    >
      <div
        className='bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'
        role='dialog'
        aria-modal='true'
        aria-labelledby='task-modal-title'
      >
        {/* Header */}
        <div className='flex items-start justify-between p-6 border-b border-gray-200'>
          <div className='flex-1 min-w-0'>
            {isEditing ? (
              <div>
                <input
                  type='text'
                  value={editTitle}
                  onChange={handleTitleChange}
                  className={`text-xl font-semibold text-gray-900 bg-transparent border-b-2 focus:outline-none focus:border-blue-500 w-full pr-8 ${
                    titleError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder='Task title'
                  autoFocus
                />
                {titleError && <p className='text-red-500 text-sm mt-1'>{titleError}</p>}
              </div>
            ) : (
              <h1 id='task-modal-title' className='text-xl font-semibold text-gray-900 pr-8'>
                {task.title}
              </h1>
            )}
            <p className='text-sm text-gray-500 mt-1'>in {column?.name || 'Unknown Column'}</p>
          </div>
          <div className='flex items-center gap-2'>
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className='px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors'
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className='px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className='px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
                aria-label='Edit task'
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100'
              aria-label='Close modal'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Description */}
          <div>
            <h2 className='text-sm font-medium text-gray-900 mb-2'>Description</h2>
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[100px]'
                placeholder='Add a description...'
                rows={4}
              />
            ) : (
              <>
                {task.description ? (
                  <div className='text-sm text-gray-700 whitespace-pre-wrap'>
                    {task.description}
                  </div>
                ) : (
                  <div className='text-sm text-gray-500 italic'>No description provided.</div>
                )}
              </>
            )}
          </div>

          {/* Metadata */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200'>
            <div>
              <h3 className='text-sm font-medium text-gray-900'>Created</h3>
              <p className='text-sm text-gray-600 mt-1'>{formatDate(task.createdAt)}</p>
            </div>
            <div>
              <h3 className='text-sm font-medium text-gray-900'>Last Updated</h3>
              <p className='text-sm text-gray-600 mt-1'>{formatDate(task.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
