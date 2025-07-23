import React from 'react'
import { BaseEventItem } from './BaseEventItem.js'
import { HistoryEvent } from '../types.js'

interface ConversationCreatedEventProps {
  event: HistoryEvent
  timestamp: Date
}

export const ConversationCreatedEvent: React.FC<ConversationCreatedEventProps> = ({
  event,
  timestamp,
}) => {
  const data = event.data as {
    id: string
    title: string
    model: string
    workerId?: string
  }

  const icon = (
    <svg className='w-4 h-4 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
      />
    </svg>
  )

  return (
    <BaseEventItem
      icon={icon}
      timestamp={timestamp}
      title={`Started conversation "${data.title}"`}
      details={`Using model: ${data.model}`}
    />
  )
}
