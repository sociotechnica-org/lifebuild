import React from 'react'
import { formatRelativeTime } from '@work-squared/shared'
import type { TaskExecution } from '@work-squared/shared/schema'

interface ExecutionHistoryProps {
  executions: TaskExecution[]
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({ executions }) => {
  if (executions.length === 0) {
    return null
  }

  return (
    <div className='space-y-1'>
      <h5 className='text-xs font-medium text-gray-500 mb-1'>Recent Executions</h5>
      {executions.map(execution => {
        const isRunning = execution.status === 'running'
        const isFailed = execution.status === 'failed'
        const isCompleted = execution.status === 'completed'

        return (
          <div key={execution.id} className='flex items-center gap-2 text-xs text-gray-600'>
            {/* Status Icon */}
            <div className='flex-shrink-0'>
              {isRunning && (
                <svg className='w-3 h-3 text-blue-500 animate-spin' fill='none' viewBox='0 0 24 24'>
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
              {isCompleted && (
                <svg className='w-3 h-3 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
              {isFailed && (
                <svg className='w-3 h-3 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
            </div>

            {/* Execution Info */}
            <div className='flex-1 flex items-center gap-2'>
              <span
                className={`font-medium ${
                  isRunning ? 'text-blue-600' : isFailed ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                {isRunning ? 'Running' : isCompleted ? 'Completed' : 'Failed'}
              </span>

              <span className='text-gray-400'>
                {execution.triggerType === 'automatic' ? 'Auto' : 'Manual'}
              </span>

              <span className='text-gray-500'>
                {formatRelativeTime(execution.startedAt.getTime())}
              </span>

              {execution.completedAt && !isRunning && (
                <span className='text-gray-400'>
                  (
                  {Math.round(
                    (execution.completedAt.getTime() - execution.startedAt.getTime()) / 1000
                  )}
                  s)
                </span>
              )}

              {execution.output && isCompleted && (
                <span className='text-gray-500 truncate flex-1' title={execution.output}>
                  {JSON.parse(execution.output).error || execution.output.substring(0, 50)}
                </span>
              )}

              {execution.createdTaskIds && (
                <span className='text-blue-600'>
                  {JSON.parse(execution.createdTaskIds).length} task
                  {JSON.parse(execution.createdTaskIds).length !== 1 ? 's' : ''} created
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
