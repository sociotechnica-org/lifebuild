import React, { useState } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { getProjects$ } from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import { calculateNextExecution } from '@work-squared/shared'
import type { Project } from '@work-squared/shared/schema'

interface RecurringTaskFormProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string | null
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

export const RecurringTaskForm: React.FC<RecurringTaskFormProps> = ({
  isOpen,
  onClose,
  projectId = null,
}) => {
  const { store } = useStore()
  const projects = useQuery(getProjects$) ?? []

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [prompt, setPrompt] = useState('')
  const [intervalHours, setIntervalHours] = useState(24)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectId)
  const [nameError, setNameError] = useState('')
  const [promptError, setPromptError] = useState('')

  React.useEffect(() => {
    if (isOpen) {
      setName('')
      setDescription('')
      setPrompt('')
      setIntervalHours(24)
      setSelectedProjectId(projectId)
      setNameError('')
      setPromptError('')
    }
  }, [isOpen, projectId])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const validateName = (value: string): boolean => {
    const trimmed = value.trim()
    if (!trimmed) {
      setNameError('Name is required')
      return false
    }
    setNameError('')
    return true
  }

  const validatePrompt = (value: string): boolean => {
    const trimmed = value.trim()
    if (!trimmed) {
      setPromptError('Prompt is required')
      return false
    }
    setPromptError('')
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const trimmedPrompt = prompt.trim()

    const isNameValid = validateName(trimmedName)
    const isPromptValid = validatePrompt(trimmedPrompt)

    if (!isNameValid || !isPromptValid) {
      return
    }

    const now = new Date()
    const nextExecutionAt = new Date(calculateNextExecution(now.getTime(), intervalHours))

    store.commit(
      events.recurringTaskCreated({
        id: crypto.randomUUID(),
        name: trimmedName,
        description: description.trim() || undefined,
        prompt: trimmedPrompt,
        intervalHours,
        enabled: true,
        projectId: selectedProjectId || undefined,
        nextExecutionAt,
        createdAt: now,
      })
    )

    onClose()
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
        className='bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto'
        role='dialog'
        aria-modal='true'
        aria-labelledby='create-recurring-task-modal-title'
        onKeyDown={handleKeyDown}
      >
        <form onSubmit={handleSubmit}>
          <div className='flex items-center justify-between p-6 border-b border-gray-200'>
            <h1
              id='create-recurring-task-modal-title'
              className='text-lg font-semibold text-gray-900'
            >
              Create Recurring Task
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

          <div className='p-6 space-y-4'>
            <div>
              <label
                htmlFor='recurring-task-name'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Name *
              </label>
              <input
                id='recurring-task-name'
                type='text'
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  if (nameError && e.target.value.trim()) {
                    setNameError('')
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  nameError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder='e.g., Daily standup reminder'
                autoFocus
              />
              {nameError && <p className='text-red-500 text-sm mt-1'>{nameError}</p>}
            </div>

            <div>
              <label
                htmlFor='recurring-task-description'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Description
              </label>
              <textarea
                id='recurring-task-description'
                value={description}
                onChange={e => setDescription(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical min-h-[60px]'
                placeholder='Optional description of what this task does'
                rows={2}
              />
            </div>

            <div>
              <label
                htmlFor='recurring-task-prompt'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Prompt *
              </label>
              <textarea
                id='recurring-task-prompt'
                value={prompt}
                onChange={e => {
                  setPrompt(e.target.value)
                  if (promptError && e.target.value.trim()) {
                    setPromptError('')
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical min-h-[100px] ${
                  promptError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Create a task to review yesterday's completed tasks and plan today's priorities"
                rows={4}
              />
              {promptError && <p className='text-red-500 text-sm mt-1'>{promptError}</p>}
              <p className='text-xs text-gray-500 mt-1'>
                This prompt will be sent to the AI when the task runs automatically.
              </p>
            </div>

            <div>
              <label
                htmlFor='recurring-task-interval'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Run Every
              </label>
              <select
                id='recurring-task-interval'
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

            <div>
              <label
                htmlFor='recurring-task-project'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Project
              </label>
              <select
                id='recurring-task-project'
                value={selectedProjectId || ''}
                onChange={e => setSelectedProjectId(e.target.value || null)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>No specific project</option>
                {projects.map((project: Project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <p className='text-xs text-gray-500 mt-1'>
                If selected, the AI will have access to this project's context when running the
                task.
              </p>
            </div>
          </div>

          <div className='flex gap-3 px-6 py-4 border-t border-gray-200'>
            <button
              type='submit'
              disabled={!name.trim() || !prompt.trim()}
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
