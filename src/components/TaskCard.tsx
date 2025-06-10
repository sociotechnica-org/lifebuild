import React from 'react'
import type { Task } from '../livestore/schema.js'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 hover:shadow-md transition-shadow'>
      <h3 className='text-sm font-medium text-gray-900 line-clamp-2'>{task.title}</h3>
    </div>
  )
}
