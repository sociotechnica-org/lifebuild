import React from 'react'
import { HistoryEvent } from './types.js'
import { eventComponentRegistry } from './events/index.js'
import { BaseEventItem } from './events/BaseEventItem.js'

interface EventListProps {
  events: HistoryEvent[]
}

export const EventList: React.FC<EventListProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-64 text-gray-500'>
        <div className='text-lg font-medium'>No events yet</div>
        <div className='text-sm'>Activity will appear here as you use the app</div>
      </div>
    )
  }

  return (
    <div className='divide-y divide-gray-200'>
      {events.map(event => {
        const EventComponent =
          eventComponentRegistry[event.type as keyof typeof eventComponentRegistry]

        if (EventComponent) {
          return (
            <div key={event.id} className='px-6 py-4'>
              <EventComponent event={event} timestamp={event.timestamp} />
            </div>
          )
        }

        // Fallback for unregistered event types
        return (
          <div key={event.id} className='px-6 py-4'>
            <BaseEventItem
              timestamp={event.timestamp}
              title={`${event.type} event`}
              details='Unknown event type'
            />
          </div>
        )
      })}
    </div>
  )
}
