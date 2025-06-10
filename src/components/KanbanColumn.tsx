import React from 'react'
import type { Column, Task } from '../livestore/schema.js'
import { TaskCard } from './TaskCard.js'

interface KanbanColumnProps {
  column: Column
  tasks: Task[]
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  return (
    <div className='flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
          {column.name}
        </h2>
        <span className='text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-1'>
          {tasks.length}
        </span>
      </div>
      <div className='space-y-2'>
        {tasks.length === 0 ? (
          <div className='text-center py-8 text-gray-400 text-sm'>No tasks yet</div>
        ) : (
          tasks.map(task => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  )
}
