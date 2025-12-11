import React, { useState, useEffect } from 'react'
import { useStore } from '@livestore/react'
import type { Task } from '@lifebuild/shared/schema'
import { events } from '@lifebuild/shared/schema'
import { STATUS_COLUMNS, type TaskStatus } from '@lifebuild/shared'

interface TaskDetailModalProps {
  task: Task | null
  onClose: () => void
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const { store } = useStore()

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState<TaskStatus>('todo')
  const [titleError, setTitleError] = useState('')

  // Update form fields when task changes
  useEffect(() => {
    if (task) {
      setEditTitle(task.title)
      setEditDescription(task.description || '')
      setEditStatus(task.status as TaskStatus)
      setIsEditing(false)
      setTitleError('')
    }
  }, [task])

  // Don't render if no task
  if (!task) return null

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

  // Set up escape key listener
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEditing])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

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

    // Update title and description if changed
    const titleChanged = trimmedTitle !== task.title
    const descriptionChanged = editDescription !== (task.description || '')

    if (titleChanged || descriptionChanged) {
      store.commit(
        events.taskUpdated({
          taskId: task.id,
          title: titleChanged ? trimmedTitle : undefined,
          description: descriptionChanged ? editDescription : undefined,
          assigneeIds: undefined,
          updatedAt: new Date(),
        })
      )
    }

    // Update status if changed
    if (editStatus !== task.status) {
      store.commit(
        events.taskStatusChanged({
          taskId: task.id,
          toStatus: editStatus,
          position: task.position,
          updatedAt: new Date(),
        })
      )
    }

    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setEditStatus(task.status as TaskStatus)
    setTitleError('')
    setIsEditing(false)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEditTitle(value)
    if (titleError && value.trim()) {
      setTitleError('')
    }
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
  }

  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-[9999]'
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
            <p className='text-sm text-gray-500 mt-1'>Status: {formatStatus(task.status)}</p>
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
          {/* Status (editable) */}
          {isEditing && (
            <div>
              <h2 className='text-sm font-medium text-gray-900 mb-2'>Status</h2>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as TaskStatus)}
                className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                {STATUS_COLUMNS.map(col => (
                  <option key={col.status} value={col.status}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
        </div>
      </div>
    </div>
  )
}
