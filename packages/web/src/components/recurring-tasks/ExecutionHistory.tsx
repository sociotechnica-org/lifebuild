import React from 'react'
import { useQuery } from '@livestore/react'
import { getTaskExecutions$ } from '@work-squared/shared/queries'
import { formatRelativeTime } from '@work-squared/shared'
import type { TaskExecution } from '@work-squared/shared/schema'

interface ExecutionHistoryProps {
  recurringTaskId: string
  maxItems?: number
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({
  recurringTaskId,
  maxItems = 5,
}) => {
  const executions = useQuery(getTaskExecutions$(recurringTaskId)) ?? []
  const recentExecutions = executions.slice(0, maxItems)

  if (recentExecutions.length === 0) {
    return (
      <div className='mt-3 pt-3 border-t border-gray-100'>
        <p className='text-xs text-gray-400'>No execution history yet</p>
      </div>
    )
  }

  return (
    <div className='mt-3 pt-3 border-t border-gray-100'>
      <h5 className='text-xs font-medium text-gray-600 mb-2'>Recent Executions</h5>
      <div className='space-y-1'>
        {recentExecutions.map(execution => (
          <ExecutionHistoryItem key={execution.id} execution={execution} />
        ))}
      </div>
    </div>
  )
}

const ExecutionHistoryItem: React.FC<{ execution: TaskExecution }> = ({ execution }) => {
  const getStatusIcon = () => {
    switch (execution.status) {
      case 'running':
        return (
          <svg className='w-3 h-3 animate-spin text-blue-500' fill='none' viewBox='0 0 24 24'>
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
        )
      case 'completed':
        return (
          <svg
            className='w-3 h-3 text-green-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
          </svg>
        )
      case 'failed':
        return (
          <svg
            className='w-3 h-3 text-red-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        )
      default:
        return (
          <svg
            className='w-3 h-3 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        )
    }
  }

  const getStatusColor = () => {
    switch (execution.status) {
      case 'running':
        return 'text-blue-600 bg-blue-50'
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getDuration = () => {
    if (!execution.completedAt) return null
    const duration = execution.completedAt.getTime() - execution.startedAt.getTime()
    const seconds = Math.round(duration / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.round(seconds / 60)
    return `${minutes}m`
  }

  const createdTaskCount = execution.createdTaskIds
    ? JSON.parse(execution.createdTaskIds).length
    : 0

  return (
    <div className='flex items-center justify-between text-xs'>
      <div className='flex items-center gap-2'>
        <div className='flex items-center gap-1'>
          {getStatusIcon()}
          <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor()}`}>
            {execution.status}
          </span>
        </div>
        <span className='text-gray-500'>{formatRelativeTime(execution.startedAt.getTime())}</span>
        {getDuration() && <span className='text-gray-400'>({getDuration()})</span>}
      </div>
      {createdTaskCount > 0 && (
        <span className='text-gray-500'>
          {createdTaskCount} task{createdTaskCount !== 1 ? 's' : ''} created
        </span>
      )}
    </div>
  )
}
