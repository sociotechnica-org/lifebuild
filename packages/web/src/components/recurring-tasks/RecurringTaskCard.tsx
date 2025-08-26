import React, { useState } from 'react'
import { useQuery } from '@livestore/react'
import { getProjects$ } from '@work-squared/shared/queries'
import { formatInterval, formatRelativeTime } from '@work-squared/shared'
import type { RecurringTask } from '@work-squared/shared/schema'
import { ExecutionHistory } from './ExecutionHistory'

interface RecurringTaskCardProps {
  task: RecurringTask
  onEdit: (task: RecurringTask) => void
  onDelete: (taskId: string) => void
  onToggleEnabled: (taskId: string, enabled: boolean) => void
  onTrigger: (taskId: string) => void
}

export const RecurringTaskCard: React.FC<RecurringTaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onToggleEnabled,
  onTrigger,
}) => {
  const projects = useQuery(getProjects$) ?? []
  const [showActions, setShowActions] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [isTriggering, setIsTriggering] = useState(false)

  const isEnabled = task.enabled
  const nextExecution = task.nextExecutionAt ? task.nextExecutionAt.getTime() : null
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null

  const handleToggleEnabled = async () => {
    setIsToggling(true)
    try {
      await onToggleEnabled(task.id, !isEnabled)
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${task.name}"? This action cannot be undone.`
      )
    ) {
      setIsDeleting(true)
      try {
        await onDelete(task.id)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleEdit = () => {
    onEdit(task)
  }

  const handleTrigger = async () => {
    setIsTriggering(true)
    try {
      await onTrigger(task.id)
    } finally {
      setIsTriggering(false)
    }
  }

  return (
    <div
      className={`bg-white border rounded-lg p-4 shadow-sm transition-all ${
        isEnabled ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-60'
      } ${isDeleting || isToggling ? 'opacity-50 pointer-events-none' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className='flex items-start justify-between'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1'>
            <h4 className={`font-medium truncate ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
              {task.name}
            </h4>
            <button
              onClick={handleToggleEnabled}
              disabled={isToggling}
              className={`w-2 h-2 rounded-full transition-colors ${
                isEnabled ? 'bg-green-400 hover:bg-green-500' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              title={isEnabled ? 'Click to disable' : 'Click to enable'}
            />
          </div>

          {task.description && (
            <p className={`text-sm mb-2 ${isEnabled ? 'text-gray-600' : 'text-gray-400'}`}>
              {task.description}
            </p>
          )}

          <div className='flex flex-wrap gap-4 text-xs text-gray-500'>
            <div className='flex items-center gap-1'>
              <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              Every {formatInterval(task.intervalHours)}
            </div>

            {project && (
              <div className='flex items-center gap-1'>
                <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                  />
                </svg>
                {project.name}
              </div>
            )}

            {isEnabled && nextExecution && (
              <div className='flex items-center gap-1'>
                <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
                Next: {formatRelativeTime(nextExecution)}
              </div>
            )}

            {task.lastExecutedAt && (
              <div className='flex items-center gap-1'>
                <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
                Last: {formatRelativeTime(task.lastExecutedAt.getTime())}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div
          className={`flex items-center gap-1 ml-2 transition-opacity ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={handleTrigger}
            disabled={isTriggering || !isEnabled}
            className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${
              isTriggering || !isEnabled
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-blue-500 hover:text-blue-600'
            }`}
            title={isEnabled ? 'Run now' : 'Enable task to run'}
          >
            {isTriggering ? (
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
            ) : (
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            )}
          </button>

          <button
            onClick={handleEdit}
            className='p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors'
            title='Edit task'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
          </button>

          <button
            onClick={handleToggleEnabled}
            disabled={isToggling}
            className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${
              isEnabled
                ? 'text-green-500 hover:text-green-600'
                : 'text-gray-400 hover:text-green-500'
            }`}
            title={isEnabled ? 'Disable task' : 'Enable task'}
          >
            {isToggling ? (
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
            ) : (
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d={
                    isEnabled
                      ? 'M10 9v6m4-6v6'
                      : 'M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707a1 1 0 00.707.293H14M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  }
                />
              </svg>
            )}
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors'
            title='Delete task'
          >
            {isDeleting ? (
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
            ) : (
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Execution History */}
      <ExecutionHistory recurringTaskId={task.id} maxItems={5} />
    </div>
  )
}
