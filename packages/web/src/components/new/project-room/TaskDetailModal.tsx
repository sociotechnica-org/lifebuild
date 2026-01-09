import React, { useState, useEffect } from 'react'
import { useStore } from '../../../livestore-compat.js'
import type { Task } from '@lifebuild/shared/schema'
import { events } from '@lifebuild/shared/schema'
import { STATUS_COLUMNS, type TaskStatus } from '@lifebuild/shared'

interface TaskDetailModalProps {
  task: Task | null
  allTasks: readonly Task[]
  onClose: () => void
}

export function TaskDetailModal({ task, allTasks, onClose }: TaskDetailModalProps) {
  const { store } = useStore()

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState<TaskStatus>('todo')
  const [titleError, setTitleError] = useState('')

  // Update form fields when task changes externally (for optimistic updates and sync)
  // Uses actual field values as dependencies following the existing TaskModal pattern
  useEffect(() => {
    if (task) {
      setEditTitle(task.title)
      setEditDescription(task.description || '')
      setEditStatus(task.status as TaskStatus)
      // Only reset editing state when opening a different task
    }
  }, [task?.title, task?.description, task?.status])

  // Reset editing state only when viewing a different task
  useEffect(() => {
    if (task) {
      setIsEditing(false)
      setTitleError('')
    }
  }, [task?.id])

  // Set up escape key listener
  useEffect(() => {
    if (!task) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) {
          // Reset form fields
          setEditTitle(task.title)
          setEditDescription(task.description || '')
          setEditStatus(task.status as TaskStatus)
          setTitleError('')
          setIsEditing(false)
        } else {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [task, isEditing, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!task) return

    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [task])

  // Don't render if no task (after all hooks)
  if (!task) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
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
      // Calculate position at end of target column to avoid collisions
      const tasksInTargetStatus = allTasks.filter(t => t.status === editStatus && t.id !== task.id)
      const maxPosition = tasksInTargetStatus.reduce((max, t) => Math.max(max, t.position), 0)
      const newPosition = maxPosition + 1000

      store.commit(
        events.taskStatusChanged({
          taskId: task.id,
          toStatus: editStatus,
          position: newPosition,
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
      className='fixed inset-0 bg-[#2f2b27]/20 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-[9999]'
      onClick={handleBackdropClick}
    >
      <div
        className='bg-white border border-[#e5e2dc] rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'
        role='dialog'
        aria-modal='true'
        aria-labelledby='task-modal-title'
      >
        {/* Header */}
        <div className='flex items-start justify-between p-6 border-b border-[#e5e2dc]'>
          <div className='flex-1 min-w-0'>
            {isEditing ? (
              <div>
                <input
                  type='text'
                  value={editTitle}
                  onChange={handleTitleChange}
                  className={`text-xl font-semibold text-[#2f2b27] bg-transparent border-b-2 focus:outline-none focus:border-[#8b8680] w-full pr-8 ${
                    titleError ? 'border-red-500' : 'border-[#e5e2dc]'
                  }`}
                  placeholder='Task title'
                  autoFocus
                />
                {titleError && <p className='text-red-500 text-sm mt-1'>{titleError}</p>}
              </div>
            ) : (
              <h1 id='task-modal-title' className='text-xl font-semibold text-[#2f2b27] pr-8'>
                {task.title}
              </h1>
            )}
            <p className='text-sm text-[#8b8680] mt-1'>Status: {formatStatus(task.status)}</p>
          </div>
          <div className='flex items-center gap-2'>
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className='px-3 py-1.5 text-sm bg-[#2f2b27] text-white rounded-lg hover:bg-[#3d3832] transition-colors'
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className='px-3 py-1.5 text-sm border border-[#e5e2dc] text-[#2f2b27] rounded-lg hover:bg-[#f5f3f0] transition-colors'
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className='px-3 py-1.5 text-sm border border-[#e5e2dc] text-[#2f2b27] rounded-lg hover:bg-[#f5f3f0] transition-colors'
                aria-label='Edit task'
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className='text-[#8b8680] hover:text-[#2f2b27] transition-colors p-1 rounded-lg hover:bg-[#f5f3f0]'
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
              <h2 className='text-sm font-medium text-[#2f2b27] mb-2'>Status</h2>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as TaskStatus)}
                className='w-full p-2 border border-[#e5e2dc] rounded-lg text-[#2f2b27] focus:outline-none focus:ring-2 focus:ring-[#8b8680]'
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
            <h2 className='text-sm font-medium text-[#2f2b27] mb-2'>Description</h2>
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className='w-full p-3 border border-[#e5e2dc] rounded-lg text-[#2f2b27] focus:outline-none focus:ring-2 focus:ring-[#8b8680] focus:border-transparent resize-vertical min-h-[100px]'
                placeholder='Add a description...'
                rows={4}
              />
            ) : (
              <>
                {task.description ? (
                  <div className='text-sm text-[#2f2b27] whitespace-pre-wrap'>
                    {task.description}
                  </div>
                ) : (
                  <div className='text-sm text-[#8b8680] italic'>No description provided.</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
