import React, { useState, useEffect } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { formatDateTime } from '../../../util/dates.js'
import type { Task, Column, User, Comment } from '@work-squared/shared/schema'
import {
  getTaskById$,
  getBoardColumnsOptional$,
  getUsers$,
  getTaskComments$,
} from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import { AssigneeSelector } from '../../ui/AssigneeSelector/AssigneeSelector.js'
import { getInitials } from '../../../util/initials.js'
import { useSnackbar } from '../../ui/Snackbar/Snackbar.js'
import { Markdown } from '../../markdown/Markdown.js'
import { MoveTaskModal } from '../MoveTaskModal.js'
import { useAuth } from '../../../contexts/AuthContext.js'

interface TaskModalProps {
  taskId: string | null
  onClose: () => void
}

export function TaskModal({ taskId, onClose }: TaskModalProps) {
  // Don't render if no task selected
  if (!taskId) return null

  const { store } = useStore()
  const { user: authUser } = useAuth()
  const { showSnackbar } = useSnackbar()
  const taskResult = useQuery(getTaskById$(taskId))
  const task = taskResult?.[0] as Task | undefined

  // Don't render if task not found
  if (!task) return null

  const columns = useQuery(getBoardColumnsOptional$(task.projectId)) ?? []
  const column = columns.find((col: Column) => col.id === task.columnId)

  const users = useQuery(getUsers$) ?? []
  const comments = useQuery(getTaskComments$(taskId)) ?? []

  // Prefer authenticated user for comment composer, fallback to first available user
  const currentUser = React.useMemo(() => {
    if (authUser) {
      const matchedUser = users.find((user: User) => user.id === authUser.id)
      if (matchedUser) {
        return matchedUser
      }
    }

    return users[0]
  }, [authUser, users])

  // Parse assigneeIds from JSON string safely
  let currentAssigneeIds: string[] = []
  try {
    currentAssigneeIds = task.assigneeIds ? JSON.parse(task.assigneeIds) : []
  } catch {
    currentAssigneeIds = []
  }

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description || '')
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>(currentAssigneeIds)
  const [titleError, setTitleError] = useState('')

  // Comment state
  const [newComment, setNewComment] = useState('')
  const [commentError, setCommentError] = useState('')

  // More actions dropdown state
  const [moreActionsOpen, setMoreActionsOpen] = useState(false)
  const moreActionsRef = React.useRef<HTMLDivElement>(null)

  // Move modal state
  const [moveModalOpen, setMoveModalOpen] = useState(false)

  // Update form fields when task changes (for optimistic updates)
  useEffect(() => {
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setEditAssigneeIds(currentAssigneeIds)
  }, [task.title, task.description, task.assigneeIds])

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

    // Only update if values have changed (assignees are saved immediately)
    const titleChanged = trimmedTitle !== task.title
    const descriptionChanged = editDescription !== (task.description || '')

    if (titleChanged || descriptionChanged) {
      store.commit(
        events.taskUpdated({
          taskId: task.id,
          title: titleChanged ? trimmedTitle : undefined,
          description: descriptionChanged ? editDescription : undefined,
          assigneeIds: undefined, // Assignees are saved immediately
          updatedAt: new Date(),
        })
      )
    }

    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    // Don't reset assignees since they save immediately
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

  // Handle click outside more actions dropdown
  const handleClickOutside = React.useCallback((event: MouseEvent) => {
    if (moreActionsRef.current && !moreActionsRef.current.contains(event.target as Node)) {
      setMoreActionsOpen(false)
    }
  }, [])

  // Set up escape key listener
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, handleCancelEdit, onClose])

  // Set up click outside listener for more actions dropdown
  React.useEffect(() => {
    if (moreActionsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [moreActionsOpen, handleClickOutside])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const validateComment = (content: string): boolean => {
    const trimmed = content.trim()
    if (!trimmed) {
      setCommentError('Comment cannot be empty')
      return false
    }
    if (trimmed.length > 5000) {
      setCommentError('Comment cannot exceed 5000 characters')
      return false
    }
    setCommentError('')
    return true
  }

  const handleAddComment = () => {
    if (!currentUser) return

    const trimmedComment = newComment.trim()
    if (!validateComment(trimmedComment)) {
      return
    }

    store.commit(
      events.commentAdded({
        id: crypto.randomUUID(),
        taskId: task.id,
        authorId: currentUser.id,
        content: trimmedComment,
        createdAt: new Date(),
      })
    )

    setNewComment('')
    setCommentError('')
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNewComment(value)

    // Real-time validation
    if (commentError && value.trim()) {
      setCommentError('')
    }
  }

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleAddComment()
    }
  }

  const handleArchiveTask = () => {
    store.commit(
      events.taskArchived({
        taskId: task.id,
        archivedAt: new Date(),
      })
    )

    // Show undo snackbar
    showSnackbar({
      message: `Task "${task.title}" archived`,
      type: 'archive-undo',
      actionLabel: 'Undo',
      actionData: { taskId: task.id },
      duration: 5000, // Show for 5 seconds
    })

    setMoreActionsOpen(false)
    onClose() // Close the modal after archiving
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
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className='px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
                  aria-label='Edit task'
                >
                  Edit
                </button>
                {/* More actions dropdown */}
                <div className='relative' ref={moreActionsRef}>
                  <button
                    onClick={() => setMoreActionsOpen(!moreActionsOpen)}
                    className='p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100'
                    aria-label='More actions'
                  >
                    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                      <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                    </svg>
                  </button>

                  {moreActionsOpen && (
                    <div className='absolute right-0 top-full mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10'>
                      <div className='py-1'>
                        <button
                          onClick={() => {
                            setMoveModalOpen(true)
                            setMoreActionsOpen(false)
                          }}
                          className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors'
                        >
                          Move to Project
                        </button>
                        <button
                          onClick={handleArchiveTask}
                          className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors'
                        >
                          Archive Task
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
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
          {/* Assignees */}
          <div>
            <h2 className='text-sm font-medium text-gray-900 mb-2'>Assignees</h2>
            <AssigneeSelector
              selectedIds={editAssigneeIds}
              onSelectionChange={assigneeIds => {
                setEditAssigneeIds(assigneeIds)
                // Save immediately when not in edit mode
                if (!isEditing) {
                  const assigneesChanged =
                    JSON.stringify(assigneeIds) !== JSON.stringify(currentAssigneeIds)
                  if (assigneesChanged) {
                    store.commit(
                      events.taskUpdated({
                        taskId: task.id,
                        title: undefined,
                        description: undefined,
                        assigneeIds,
                        updatedAt: new Date(),
                      })
                    )
                  }
                }
              }}
              placeholder='Select assignees...'
            />
          </div>

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

          {/* Comments */}
          <div>
            <h2 className='text-sm font-medium text-gray-900 mb-3'>Comments ({comments.length})</h2>

            {/* Comment composer */}
            {currentUser && (
              <div className='mb-4 p-4 border border-gray-200 rounded-lg'>
                <div className='flex gap-3'>
                  <div
                    className='w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0'
                    title={currentUser.name}
                  >
                    {getInitials(currentUser.name)}
                  </div>
                  <div className='flex-1'>
                    <textarea
                      value={newComment}
                      onChange={handleCommentChange}
                      onKeyDown={handleCommentKeyDown}
                      className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical min-h-[80px] ${
                        commentError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder='Add a comment...'
                      rows={3}
                    />
                    {commentError && <p className='text-red-500 text-sm mt-1'>{commentError}</p>}
                    <div className='flex items-center justify-between mt-2'>
                      <p className='text-xs text-gray-500'>
                        {newComment.length}/5000 • Cmd+Enter to post
                      </p>
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className='px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments list */}
            <div className='space-y-4'>
              {comments.length > 0
                ? comments.map((comment: Comment) => {
                    const author = users.find((user: User) => user.id === comment.authorId)
                    return (
                      <div key={comment.id} className='flex gap-3'>
                        <div
                          className='w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0'
                          title={author?.name || 'Unknown User'}
                        >
                          {getInitials(author?.name || 'Unknown User')}
                        </div>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <span className='text-sm font-medium text-gray-900'>
                              {author?.name || 'Unknown User'}
                            </span>
                            <span className='text-xs text-gray-500'>
                              {formatDateTime(comment.createdAt)}
                            </span>
                          </div>
                          <Markdown content={comment.content} />
                        </div>
                      </div>
                    )
                  })
                : null}
            </div>
          </div>

          {/* Metadata */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200'>
            <div>
              <h3 className='text-sm font-medium text-gray-900'>Created</h3>
              <p className='text-sm text-gray-600 mt-1'>{formatDateTime(task.createdAt)}</p>
            </div>
            <div>
              <h3 className='text-sm font-medium text-gray-900'>Last Updated</h3>
              <p className='text-sm text-gray-600 mt-1'>{formatDateTime(task.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Move Task Modal */}
      <MoveTaskModal isOpen={moveModalOpen} onClose={() => setMoveModalOpen(false)} task={task} />
    </div>
  )
}
