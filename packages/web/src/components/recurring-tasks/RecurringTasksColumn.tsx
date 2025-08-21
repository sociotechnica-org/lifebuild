import React, { useState } from 'react'
import { RecurringTasksList } from './RecurringTasksList.js'
import { RecurringTaskForm } from './RecurringTaskForm.js'

interface RecurringTasksColumnProps {
  projectId?: string | null
}

export const RecurringTasksColumn: React.FC<RecurringTasksColumnProps> = ({ projectId }) => {
  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <>
      <div className='w-80 flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg'>
        <div className='p-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <svg
                className='w-4 h-4 text-blue-500'
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
              <h3 className='text-sm font-semibold text-gray-900'>Recurring Tasks</h3>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className='text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-200 transition-colors'
              title='Add recurring task'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v16m8-8H4'
                />
              </svg>
            </button>
          </div>
          <p className='text-xs text-gray-500 mt-1'>Automated tasks that run on schedule</p>
        </div>

        <div className='p-4'>
          <RecurringTasksList onCreateTask={() => setIsFormOpen(true)} projectId={projectId} />
        </div>
      </div>

      <RecurringTaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        projectId={projectId}
      />
    </>
  )
}
