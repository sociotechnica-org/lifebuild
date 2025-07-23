import React from 'react'
import { ChatCircle } from '@phosphor-icons/react'
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

  const icon = <ChatCircle size={16} className='text-purple-600' />

  return (
    <BaseEventItem
      icon={icon}
      timestamp={timestamp}
      title={`Started conversation "${data.title}"`}
      details={`Using model: ${data.model}`}
    />
  )
}
