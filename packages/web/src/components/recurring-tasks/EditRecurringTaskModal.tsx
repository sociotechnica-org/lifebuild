import React, { useState, useEffect } from 'react'
import { useQuery, useStore } from '../../livestore-compat.js'
import { getProjects$ } from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import { calculateNextExecution } from '@lifebuild/shared'
import type { RecurringTask } from '@lifebuild/shared'
import { AssigneeSelector } from '../ui/AssigneeSelector/AssigneeSelector.js'

interface EditRecurringTaskModalProps {
  isOpen: boolean
  task: RecurringTask | null
  onClose: () => void
}

const INTERVAL_OPTIONS = [
  { hours: 1, label: '1 hour' },
  { hours: 4, label: '4 hours' },
  { hours: 8, label: '8 hours' },
  { hours: 12, label: '12 hours' },
  { hours: 24, label: '1 day' },
  { hours: 48, label: '2 days' },
  { hours: 72, label: '3 days' },
  { hours: 168, label: '1 week' },
]

export const EditRecurringTaskModal: React.FC<EditRecurringTaskModalProps> = ({
  isOpen,
  task,
  onClose,
}) => {
  const { store } = useStore()
  const projects = useQuery(getProjects$) ?? []

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [prompt, setPrompt] = useState('')
  const [intervalHours, setIntervalHours] = useState(24)
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [nameError, setNameError] = useState('')
  const [promptError, setPromptError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when task changes or modal opens
  useEffect(() => {
    if (task && isOpen) {
      setName(task.name)
      setDescription(task.description || '')
      setPrompt(task.prompt)
      setIntervalHours(task.intervalHours)
      setAssigneeIds(
        (() => {
          try {
            return task.assigneeIds ? JSON.parse(task.assigneeIds) : []
          } catch {
            return []
          }
        })()
      )
      setSelectedProjectId(task.projectId || null)
      setNameError('')
      setPromptError('')
    }
  }, [task, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task) return

    // Validation
    setNameError('')
    setPromptError('')

    const trimmedName = name.trim()
    const trimmedPrompt = prompt.trim()

    if (!trimmedName) {
      setNameError('Task name is required')
      return
    }

    if (!trimmedPrompt) {
      setPromptError('Task prompt is required')
      return
    }

    setIsSubmitting(true)

    try {
      const now = new Date()

      // Build updates object - only include changed fields
      const updates: {
        name?: string
        description?: string | null
        prompt?: string
        intervalHours?: number
        assigneeIds?: string[]
        projectId?: string | null
      } = {}

      let needsNextExecutionUpdate = false

      if (trimmedName !== task.name) {
        updates.name = trimmedName
      }

      const trimmedDescription = description.trim()
      if (trimmedDescription !== (task.description || '')) {
        updates.description = trimmedDescription || null
      }

      if (trimmedPrompt !== task.prompt) {
        updates.prompt = trimmedPrompt
      }

      if (intervalHours !== task.intervalHours) {
        updates.intervalHours = intervalHours
        needsNextExecutionUpdate = true
      }

      const currentAssigneeIds = (() => {
        try {
          return task.assigneeIds ? JSON.parse(task.assigneeIds) : []
        } catch {
          return []
        }
      })()
      if (
        JSON.stringify([...assigneeIds].sort()) !== JSON.stringify([...currentAssigneeIds].sort())
      ) {
        updates.assigneeIds = assigneeIds
      }

      if (selectedProjectId !== task.projectId) {
        updates.projectId = selectedProjectId || null
      }

      // Calculate new nextExecutionAt if interval changed and task is enabled
      let nextExecutionAt: Date | undefined
      if (needsNextExecutionUpdate && task.enabled) {
        nextExecutionAt = new Date(calculateNextExecution(now.getTime(), intervalHours))
      }

      // Only commit if there are changes
      if (Object.keys(updates).length > 0 || nextExecutionAt) {
        // Create a complete updates object with all fields present
        const fullUpdates = {
          name: updates.name,
          description: updates.description,
          prompt: updates.prompt,
          intervalHours: updates.intervalHours,
          assigneeIds: updates.assigneeIds,
          projectId: updates.projectId,
        }

        await store.commit(
          events.recurringTaskUpdated({
            id: task.id,
            updates: fullUpdates,
            updatedAt: now,
            nextExecutionAt,
          })
        )
      }

      onClose()
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !task) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-[9999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-start justify-between p-6 border-b border-gray-200'>
          <h3 className='text-lg font-semibold leading-6 text-gray-900'>Edit Recurring Task</h3>
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

        {/* Content */}
        <div className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Name Field */}
            <div>
              <label htmlFor='task-name' className='block text-sm font-medium text-gray-900 mb-2'>
                Task Name *
              </label>
              <input
                id='task-name'
                type='text'
                value={name}
                onChange={e => setName(e.target.value)}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  nameError ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Enter task name'
                autoFocus
              />
              {nameError && <p className='mt-1 text-sm text-red-600'>{nameError}</p>}
            </div>

            {/* Description Field */}
            <div>
              <label
                htmlFor='task-description'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Description
              </label>
              <input
                id='task-description'
                type='text'
                value={description}
                onChange={e => setDescription(e.target.value)}
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Brief description of the task (optional)'
              />
            </div>

            {/* Prompt Field */}
            <div>
              <label htmlFor='task-prompt' className='block text-sm font-medium text-gray-900 mb-2'>
                Task Prompt *
              </label>
              <textarea
                id='task-prompt'
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={4}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[100px] ${
                  promptError ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Enter the prompt that will be sent to the AI when this task runs'
              />
              {promptError && <p className='mt-1 text-sm text-red-600'>{promptError}</p>}
            </div>

            {/* Interval Field */}
            <div>
              <label
                htmlFor='task-interval'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Run Every
              </label>
              <select
                id='task-interval'
                value={intervalHours}
                onChange={e => setIntervalHours(Number(e.target.value))}
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                {INTERVAL_OPTIONS.map(option => (
                  <option key={option.hours} value={option.hours}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignees Field */}
            <div>
              <label className='block text-sm font-medium text-gray-900 mb-2'>Assignees</label>
              <AssigneeSelector
                selectedIds={assigneeIds}
                onSelectionChange={setAssigneeIds}
                placeholder='Select assignees for this task...'
                className='w-full'
              />
              <p className='text-xs text-gray-500 mt-1'>
                Who should be assigned when tasks are created from this recurring task.
              </p>
            </div>

            {/* Project Field */}
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
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value=''>No specific project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className='flex justify-end space-x-3 pt-4'>
              <button
                type='button'
                onClick={onClose}
                className='px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isSubmitting}
                className='px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
