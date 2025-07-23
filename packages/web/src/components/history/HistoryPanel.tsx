import React from 'react'
import { useQuery } from '@livestore/react'
import { getAllEvents$ } from '@work-squared/shared/queries'
import { EventList } from './EventList.js'

export const HistoryPanel: React.FC = () => {
  const eventsLogData = useQuery(getAllEvents$) ?? []

  // Transform the eventsLog data to match our HistoryEvent interface
  const events = eventsLogData.map(eventLog => ({
    id: eventLog.id,
    type: eventLog.eventType,
    timestamp: eventLog.createdAt,
    data: JSON.parse(eventLog.eventData),
  }))

  return (
    <div className='h-full flex flex-col'>
      <div className='bg-white border-b border-gray-200 px-6 py-4'>
        <h1 className='text-2xl font-bold text-gray-900'>History</h1>
        <p className='text-sm text-gray-500 mt-1'>
          Activity stream of all events in your workspace
        </p>
      </div>

      <div className='flex-1 overflow-auto'>
        <EventList events={events} />
      </div>
    </div>
  )
}
