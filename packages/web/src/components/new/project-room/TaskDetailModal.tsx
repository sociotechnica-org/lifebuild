import React, { useState, useEffect } from 'react'
import { useStore } from '@livestore/react'
import type { Task } from '@lifebuild/shared/schema'
import { events } from '@lifebuild/shared/schema'
import { STATUS_COLUMNS, type TaskStatus } from '@lifebuild/shared'
import { useAuth } from '../../../contexts/AuthContext.js'

/**
 * Format a deadline timestamp for display.
 * Shows "Dec 20" format, or "Dec 20, 2026" if the year differs from current year.
 * Uses UTC to ensure consistent display across all timezones.
 */
export function formatDeadline(timestamp: number | null | undefined): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const currentYear = new Date().getUTCFullYear()
  const deadlineYear = date.getUTCFullYear()

  const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
  const day = date.getUTCDate()

  if (deadlineYear !== currentYear) {
    return `${month} ${day}, ${deadlineYear}`
  }
  return `${month} ${day}`
}

/**
 * Convert a timestamp to YYYY-MM-DD date string for input[type="date"]
 * Uses UTC to ensure consistent date across all timezones.
 */
function timestampToDateString(timestamp: number | null | undefined): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convert a YYYY-MM-DD date string to timestamp (UTC midnight)
 * Uses Date.UTC to ensure consistent storage across all timezones.
 * All collaborators will see the same deadline date regardless of their timezone.
 */
function dateStringToTimestamp(dateStr: string): number | undefined {
  if (!dateStr) return undefined
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return undefined
  return Date.UTC(year, month - 1, day)
}

interface TaskDetailModalProps {
  /** Task to edit, or null for creation mode */
  task: Task | null
  /** All tasks in the project (for position calculations) */
  allTasks: readonly Task[]
  /** Called when modal should close */
  onClose: () => void
  /** Project ID - required for creation mode */
  projectId?: string
  /** Creation mode: opens in edit mode, creates new task on save */
  isCreating?: boolean
  /** Hide status selector (used in Stage 3 drafting where all tasks are "todo") */
  hideStatus?: boolean
  /** Called after a task is successfully created (creation mode only) */
  onTaskCreated?: (taskId: string) => void
}

export function TaskDetailModal({
  task,
  allTasks,
  onClose,
  projectId,
  isCreating = false,
  hideStatus = false,
  onTaskCreated,
}: TaskDetailModalProps) {
  const { store } = useStore()
  const { user } = useAuth()

  // Edit mode state - creation mode starts in edit mode
  const [isEditing, setIsEditing] = useState(isCreating)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState<TaskStatus>('todo')
  const [editDeadline, setEditDeadline] = useState<string>('')
  const [titleError, setTitleError] = useState('')

  // Parse task attributes to get deadline
  const getTaskDeadline = (t: Task | null): number | undefined => {
    if (!t?.attributes) return undefined
    try {
      const attrs = typeof t.attributes === 'string' ? JSON.parse(t.attributes) : t.attributes
      return attrs?.deadline
    } catch {
      return undefined
    }
  }

  // Update form fields when task changes externally (for optimistic updates and sync)
  useEffect(() => {
    if (task) {
      setEditTitle(task.title)
      setEditDescription(task.description || '')
      setEditStatus(task.status as TaskStatus)
      setEditDeadline(timestampToDateString(getTaskDeadline(task)))
    }
  }, [task?.title, task?.description, task?.status, task?.attributes])

  // Reset editing state only when viewing a different task (not in creation mode)
  useEffect(() => {
    if (task && !isCreating) {
      setIsEditing(false)
      setTitleError('')
    }
  }, [task?.id, isCreating])

  // Reset form when entering creation mode
  useEffect(() => {
    if (isCreating) {
      setEditTitle('')
      setEditDescription('')
      setEditStatus('todo')
      setEditDeadline('')
      setTitleError('')
      setIsEditing(true)
    }
  }, [isCreating])

  // Set up escape key listener
  useEffect(() => {
    if (!task && !isCreating) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing && !isCreating && task) {
          // Reset form fields
          setEditTitle(task.title)
          setEditDescription(task.description || '')
          setEditStatus(task.status as TaskStatus)
          setEditDeadline(timestampToDateString(getTaskDeadline(task)))
          setTitleError('')
          setIsEditing(false)
        } else {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [task, isEditing, isCreating, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!task && !isCreating) return

    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [task, isCreating])

  // Don't render if no task and not in creation mode (after all hooks)
  if (!task && !isCreating) return null

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

    const now = new Date()
    const deadlineTimestamp = dateStringToTimestamp(editDeadline)

    if (isCreating) {
      // Creation mode: create a new task
      if (!projectId) {
        console.error('projectId is required for task creation')
        return
      }

      const taskId = crypto.randomUUID()
      const maxPosition = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.position)) : -1

      // Build attributes if we have a deadline
      const attributes = deadlineTimestamp ? { deadline: deadlineTimestamp } : undefined

      store.commit(
        events.taskCreatedV2({
          id: taskId,
          projectId,
          title: trimmedTitle,
          description: editDescription || undefined,
          status: 'todo',
          assigneeIds: undefined,
          attributes,
          position: maxPosition + 1,
          createdAt: now,
          actorId: user?.id,
        })
      )

      onTaskCreated?.(taskId)
      onClose()
      return
    }

    // Edit mode: update existing task
    if (!task) return

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
          updatedAt: now,
          actorId: user?.id,
        })
      )
    }

    // Update deadline if changed (via attributes)
    const currentDeadline = getTaskDeadline(task)
    const deadlineChanged = deadlineTimestamp !== currentDeadline
    if (deadlineChanged) {
      // Parse existing attributes to get priority (only known attribute besides deadline)
      let existingPriority: 'low' | 'normal' | 'high' | 'critical' | undefined
      if (task.attributes) {
        try {
          const attrs =
            typeof task.attributes === 'string' ? JSON.parse(task.attributes) : task.attributes
          existingPriority = attrs?.priority
        } catch {
          // Ignore parse errors
        }
      }

      // Build new attributes with only the schema-allowed fields
      const newAttrs: { priority?: 'low' | 'normal' | 'high' | 'critical'; deadline?: number } = {}
      if (existingPriority) {
        newAttrs.priority = existingPriority
      }
      if (deadlineTimestamp) {
        newAttrs.deadline = deadlineTimestamp
      }

      store.commit(
        events.taskAttributesUpdated({
          taskId: task.id,
          attributes: newAttrs,
          updatedAt: now,
          actorId: user?.id,
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
          updatedAt: now,
          actorId: user?.id,
        })
      )
    }

    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    if (isCreating) {
      onClose()
      return
    }

    if (task) {
      setEditTitle(task.title)
      setEditDescription(task.description || '')
      setEditStatus(task.status as TaskStatus)
      setEditDeadline(timestampToDateString(getTaskDeadline(task)))
      setTitleError('')
      setIsEditing(false)
    }
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

  // Display values for view mode - use edit fields as they contain the latest saved values
  // This ensures the modal shows correct state immediately after save, before LiveStore updates the task prop
  // Use ?? (nullish coalescing) to allow empty strings to display correctly (e.g., after clearing a description)
  const displayTitle = editTitle ?? task?.title ?? ''
  const displayDescription = editDescription ?? task?.description ?? ''
  const displayStatus = editStatus ?? (task?.status as TaskStatus) ?? 'todo'
  const displayDeadline = editDeadline ? dateStringToTimestamp(editDeadline) : getTaskDeadline(task)

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
                {displayTitle}
              </h1>
            )}
            {!isCreating && !hideStatus && (
              <p className='text-sm text-[#8b8680] mt-1'>Status: {formatStatus(displayStatus)}</p>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {!isEditing && !isCreating && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className='px-3 py-1.5 text-sm border border-[#e5e2dc] text-[#2f2b27] rounded-lg hover:bg-[#f5f3f0] transition-colors'
                  aria-label='Edit task'
                >
                  Edit
                </button>
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
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Status (editable) - hidden in creation mode or when hideStatus is true */}
          {isEditing && !isCreating && !hideStatus && (
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
                {displayDescription ? (
                  <div className='text-sm text-[#2f2b27] whitespace-pre-wrap'>
                    {displayDescription}
                  </div>
                ) : (
                  <div className='text-sm text-[#8b8680] italic'>No description provided.</div>
                )}
              </>
            )}
          </div>

          {/* Deadline */}
          <div>
            <h2 className='text-sm font-medium text-[#2f2b27] mb-2'>Deadline (Optional)</h2>
            {isEditing ? (
              <input
                type='date'
                value={editDeadline}
                onChange={e => setEditDeadline(e.target.value)}
                className='w-full p-2 border border-[#e5e2dc] rounded-lg text-[#2f2b27] focus:outline-none focus:ring-2 focus:ring-[#8b8680]'
              />
            ) : (
              <>
                {displayDeadline ? (
                  <div className='text-sm text-[#2f2b27]'>{formatDeadline(displayDeadline)}</div>
                ) : (
                  <div className='text-sm text-[#8b8680] italic'>No deadline set.</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer with Save/Cancel buttons (Issue #397: moved to bottom) */}
        {isEditing && (
          <div className='flex justify-end gap-2 p-6 pt-0'>
            <button
              onClick={handleCancelEdit}
              className='px-4 py-2 text-sm border border-[#e5e2dc] text-[#2f2b27] rounded-lg hover:bg-[#f5f3f0] transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className='px-4 py-2 text-sm bg-[#2f2b27] text-white rounded-lg hover:bg-[#3d3832] transition-colors'
            >
              {isCreating ? 'Create Task' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
