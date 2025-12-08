import React, { useState } from 'react'
import { useQuery } from '@livestore/react'
import { getRecurringTasks$ } from '@lifebuild/shared/queries'
import { useRecurringTasks } from '../../hooks/useRecurringTasks.js'
import { RecurringTaskCard } from './RecurringTaskCard.js'
import { EditRecurringTaskModal } from './EditRecurringTaskModal.js'
import type { RecurringTask } from '@lifebuild/shared/schema'

interface RecurringTasksListProps {
  onCreateTask: () => void
  projectId?: string | null
}

export const RecurringTasksList: React.FC<RecurringTasksListProps> = ({
  onCreateTask,
  projectId,
}) => {
  const allRecurringTasks = useQuery(getRecurringTasks$) ?? []
  const { deleteRecurringTask, toggleRecurringTask, triggerRecurringTask } = useRecurringTasks()
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null)

  // Filter tasks by project if projectId is provided
  const recurringTasks = React.useMemo(() => {
    if (projectId === null || projectId === undefined) {
      // Show all tasks for top-level /tasks page
      return allRecurringTasks
    }
    // Filter by specific project
    return allRecurringTasks.filter(task => task.projectId === projectId)
  }, [allRecurringTasks, projectId])

  const handleEdit = (task: RecurringTask) => {
    setEditingTask(task)
  }

  const handleDelete = async (taskId: string) => {
    await deleteRecurringTask(taskId)
  }

  const handleToggleEnabled = async (taskId: string, enabled: boolean) => {
    await toggleRecurringTask(taskId, enabled)
  }

  const handleTrigger = async (taskId: string) => {
    await triggerRecurringTask(taskId)
  }

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
    <>
      <div className='space-y-3'>
        {recurringTasks.map((task: RecurringTask) => (
          <RecurringTaskCard
            key={task.id}
            task={task}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleEnabled={handleToggleEnabled}
            onTrigger={handleTrigger}
          />
        ))}
        <div className='pt-2'>
          <button
            onClick={onCreateTask}
            className='w-full bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 text-gray-600 px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
            Add Recurring Task
          </button>
        </div>
      </div>

      <EditRecurringTaskModal
        isOpen={editingTask !== null}
        task={editingTask}
        onClose={() => setEditingTask(null)}
      />
    </>
  )
}
