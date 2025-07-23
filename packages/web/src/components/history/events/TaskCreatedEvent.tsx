import React from 'react'
import { BaseEventItem } from './BaseEventItem.js'
import { HistoryEvent } from '../types.js'

interface TaskCreatedEventProps {
  event: HistoryEvent
  timestamp: Date
}

export const TaskCreatedEvent: React.FC<TaskCreatedEventProps> = ({ event, timestamp }) => {
  const data = event.data as {
    id: string
    projectId?: string
    columnId: string
    title: string
    description?: string
  }

  const icon = (
    <svg className='w-4 h-4 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
      />
    </svg>
  )

  return (
    <BaseEventItem
      icon={icon}
      timestamp={timestamp}
      title={`Created task "${data.title}"`}
      details={data.description}
    />
  )
}
