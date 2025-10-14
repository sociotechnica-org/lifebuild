import React, { useState } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { getProjects$ } from '@work-squared/shared/queries'
import type { Project, TaskStatus } from '@work-squared/shared/schema'
import { events } from '@work-squared/shared/schema'
import { STATUS_COLUMNS } from '@work-squared/shared'
import { AssigneeSelector } from '../ui/AssigneeSelector/AssigneeSelector.js'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string | null // Default project selection
  defaultStatus?: TaskStatus // Default status selection
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  projectId = null,
  defaultStatus = 'todo',
}) => {
  const { store } = useStore()
  const projects = useQuery(getProjects$) ?? []

  // States
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectId)
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(defaultStatus)
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([])
  const [titleError, setTitleError] = useState('')

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setTitle('')
      setDescription('')
      setSelectedProjectId(projectId)
      setSelectedStatus(defaultStatus)
      setSelectedAssigneeIds([])
      setTitleError('')
    }
  }, [isOpen, projectId, defaultStatus])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const validateTitle = (value: string): boolean => {
    const trimmed = value.trim()
    if (!trimmed) {
      setTitleError('Title is required')
      return false
    }
    setTitleError('')
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedTitle = title.trim()
    if (!validateTitle(trimmedTitle)) {
      return
    }

    // Calculate next position (add at the end)
    const nextPosition = 0

    // Use v2.TaskCreated event with status
    store.commit(
      events.taskCreatedV2({
        id: crypto.randomUUID(),
        projectId: selectedProjectId || undefined,
        title: trimmedTitle,
        description: description.trim() || undefined,
        status: selectedStatus,
        assigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
        position: nextPosition,
        createdAt: new Date(),
      })
    )

    onClose()
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTitle(value)
    if (titleError && value.trim()) {
      setTitleError('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-50'
      onClick={handleBackdropClick}
    >
      <div
        className='bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto'
        role='dialog'
        aria-modal='true'
        aria-labelledby='create-task-modal-title'
        onKeyDown={handleKeyDown}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b border-gray-200'>
            <h1 id='create-task-modal-title' className='text-lg font-semibold text-gray-900'>
              Create Task
            </h1>
            <button
              type='button'
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

          {/* Content */}
          <div className='p-6 space-y-4'>
            {/* Title */}
            <div>
              <label htmlFor='task-title' className='block text-sm font-medium text-gray-900 mb-2'>
                Title *
              </label>
              <input
                id='task-title'
                type='text'
                value={title}
                onChange={handleTitleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  titleError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder='Enter task title'
                autoFocus
              />
              {titleError && <p className='text-red-500 text-sm mt-1'>{titleError}</p>}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor='task-description'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Description
              </label>
              <textarea
                id='task-description'
                value={description}
                onChange={e => setDescription(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical min-h-[80px]'
                placeholder='Enter task description (optional)'
                rows={3}
              />
            </div>

            {/* Project Selection */}
            <div>
              <label
                htmlFor='task-project'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Project
              </label>
              <select
                id='task-project'
                value={selectedProjectId || ''}
                onChange={e => setSelectedProjectId(e.target.value || null)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>No Project (Orphaned)</option>
                {projects.map((project: Project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Selection */}
            <div>
              <label htmlFor='task-status' className='block text-sm font-medium text-gray-900 mb-2'>
                Status
              </label>
              <select
                id='task-status'
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value as TaskStatus)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                required
              >
                {STATUS_COLUMNS.map(statusColumn => (
                  <option key={statusColumn.id} value={statusColumn.status}>
                    {statusColumn.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignees Selection */}
            <div>
              <label className='block text-sm font-medium text-gray-900 mb-2'>Assignees</label>
              <AssigneeSelector
                selectedIds={selectedAssigneeIds}
                onSelectionChange={setSelectedAssigneeIds}
                placeholder='Select assignees (optional)'
              />
            </div>
          </div>

          {/* Footer */}
          <div className='flex gap-3 px-6 py-4 border-t border-gray-200'>
            <button
              type='submit'
              disabled={!title.trim()}
              className='flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors'
            >
              Create Task
            </button>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
