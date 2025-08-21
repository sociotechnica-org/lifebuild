import React from 'react'
import { useQuery } from '@livestore/react'
import { getRecurringTasks$ } from '@work-squared/shared/queries'
import { formatInterval, formatRelativeTime } from '@work-squared/shared'
import type { RecurringTask } from '@work-squared/shared/schema'

interface RecurringTasksListProps {
  onCreateTask: () => void
  projectId?: string | null
}

export const RecurringTasksList: React.FC<RecurringTasksListProps> = ({
  onCreateTask,
  projectId,
}) => {
  const allRecurringTasks = useQuery(getRecurringTasks$) ?? []

  // Filter tasks by project if projectId is provided
  const recurringTasks = React.useMemo(() => {
    if (projectId === null || projectId === undefined) {
      // Show all tasks for top-level /tasks page
      return allRecurringTasks
    }
    // Filter by specific project
    return allRecurringTasks.filter(task => task.projectId === projectId)
  }, [allRecurringTasks, projectId])

  if (recurringTasks.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center p-8 text-gray-500'>
        <div className='mb-4'>
          <svg
            className='w-16 h-16 mx-auto text-gray-300'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>No recurring tasks yet</h3>
        <p className='text-center text-gray-500 mb-4 max-w-sm'>
          Create recurring tasks that will automatically run on a schedule with custom prompts.
        </p>
        <button
          onClick={onCreateTask}
          className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors'
        >
          Create Recurring Task
        </button>
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      {recurringTasks.map((task: RecurringTask) => (
        <RecurringTaskCard key={task.id} task={task} />
      ))}
      <div className='pt-2'>
        <button
          onClick={onCreateTask}
          className='w-full bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 text-gray-600 px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          Add Recurring Task
        </button>
      </div>
    </div>
  )
}

interface RecurringTaskCardProps {
  task: RecurringTask
}

const RecurringTaskCard: React.FC<RecurringTaskCardProps> = ({ task }) => {
  const isEnabled = task.enabled
  const nextExecution = task.nextExecutionAt ? task.nextExecutionAt.getTime() : null

  return (
    <div
      className={`bg-white border rounded-lg p-4 shadow-sm ${
        isEnabled ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-60'
      }`}
    >
      <div className='flex items-start justify-between'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1'>
            <h4 className={`font-medium truncate ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
              {task.name}
            </h4>
            <div
              className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-400' : 'bg-gray-300'}`}
              title={isEnabled ? 'Enabled' : 'Disabled'}
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
      </div>
    </div>
  )
}
