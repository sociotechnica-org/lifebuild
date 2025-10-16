import React from 'react'
import { Note } from '@phosphor-icons/react'
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
    // PR3: columnId may exist in v1 events but is no longer used
    title: string
    description?: string
  }

  const icon = <Note size={16} className='text-green-600' />

  return (
    <BaseEventItem
      icon={icon}
      timestamp={timestamp}
      title={`Created task "${data.title}"`}
      details={data.description}
    />
  )
}
