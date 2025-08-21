import React, { useState, useEffect } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { getProjects$ } from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import { calculateNextExecution } from '@work-squared/shared'
import type { Project, RecurringTask } from '@work-squared/shared'

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
        description?: string
        prompt?: string
        intervalHours?: number
        projectId?: string
      } = {}

      let needsNextExecutionUpdate = false

      if (trimmedName !== task.name) {
        updates.name = trimmedName
      }

      const trimmedDescription = description.trim()
      if (trimmedDescription !== (task.description || '')) {
        updates.description = trimmedDescription || undefined
      }

      if (trimmedPrompt !== task.prompt) {
        updates.prompt = trimmedPrompt
      }

      if (intervalHours !== task.intervalHours) {
        updates.intervalHours = intervalHours
        needsNextExecutionUpdate = true
      }

      if (selectedProjectId !== task.projectId) {
        updates.projectId = selectedProjectId || undefined
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

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto'>
        <div className='px-6 py-4 border-b'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>Edit Recurring Task</h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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

        <form onSubmit={handleSubmit} className='px-6 py-4 space-y-4'>
          {/* Name Field */}
          <div>
            <label htmlFor='task-name' className='block text-sm font-medium text-gray-700 mb-1'>
              Task Name
            </label>
            <input
              id='task-name'
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                nameError ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder='Enter task name'
            />
            {nameError && <p className='text-red-600 text-xs mt-1'>{nameError}</p>}
          </div>

          {/* Description Field */}
          <div>
            <label
              htmlFor='task-description'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Description (optional)
            </label>
            <input
              id='task-description'
              type='text'
              value={description}
              onChange={e => setDescription(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Brief description of the task'
            />
          </div>

          {/* Prompt Field */}
          <div>
            <label htmlFor='task-prompt' className='block text-sm font-medium text-gray-700 mb-1'>
              Task Prompt
            </label>
            <textarea
              id='task-prompt'
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                promptError ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder='Enter the prompt that will be sent to the AI when this task runs'
            />
            {promptError && <p className='text-red-600 text-xs mt-1'>{promptError}</p>}
          </div>

          {/* Interval Field */}
          <div>
            <label htmlFor='task-interval' className='block text-sm font-medium text-gray-700 mb-1'>
              Run Every
            </label>
            <select
              id='task-interval'
              value={intervalHours}
              onChange={e => setIntervalHours(Number(e.target.value))}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              {INTERVAL_OPTIONS.map(option => (
                <option key={option.hours} value={option.hours}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Project Field */}
          <div>
            <label htmlFor='task-project' className='block text-sm font-medium text-gray-700 mb-1'>
              Project (optional)
            </label>
            <select
              id='task-project'
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(e.target.value || null)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value=''>No specific project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </form>

        {/* Actions */}
        <div className='px-6 py-4 border-t bg-gray-50 flex justify-end gap-2'>
          <button
            type='button'
            onClick={onClose}
            className='px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2'
          >
            {isSubmitting && (
              <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
            )}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
