import React, { useState } from 'react'
import { useStore } from '@livestore/react'
import type { Column, Task } from '../livestore/schema.js'
import { TaskCard } from './TaskCard.js'
import { AddTaskForm } from './AddTaskForm.js'
import { events } from '../livestore/schema.js'

interface OrphanedKanbanColumnProps {
  column: Column
  tasks: Task[]
  onTaskClick?: (taskId: string) => void
}

export function OrphanedKanbanColumn({ column, tasks, onTaskClick }: OrphanedKanbanColumnProps) {
  const { store } = useStore()
  const [isAddingTask, setIsAddingTask] = useState(false)

  const handleAddTask = (title: string) => {
    const nextPosition = tasks.length === 0 ? 0 : Math.max(...tasks.map(t => t.position)) + 1

    store.commit(
      events.taskCreated({
        id: crypto.randomUUID(),
        projectId: undefined, // undefined for orphaned tasks
        columnId: column.id,
        title,
        description: undefined,
        assigneeIds: undefined,
        position: nextPosition,
        createdAt: new Date(),
      })
    )

    setIsAddingTask(false)
  }

  // Sort tasks by position
  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position)

  return (
    <div className='flex-shrink-0 w-80 min-w-80 bg-gray-50 rounded-lg p-4'>
      {/* Column Header */}
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
          {column.name}
        </h2>
        <span className='text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-1'>
          {tasks.length}
        </span>
      </div>

      {/* Column Content */}
      <div className='space-y-2 min-h-24'>
        {sortedTasks.map(task => (
          <TaskCard key={task.id} task={task} onClick={onTaskClick} />
        ))}

        {isAddingTask ? (
          <AddTaskForm onSubmit={handleAddTask} onCancel={() => setIsAddingTask(false)} />
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className='w-full p-3 text-left text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors text-sm'
          >
            ➕ Add Card
          </button>
        )}
      </div>
    </div>
  )
}
