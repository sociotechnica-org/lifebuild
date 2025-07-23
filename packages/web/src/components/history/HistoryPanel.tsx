import React from 'react'
import { EventList } from './EventList.js'

export const HistoryPanel: React.FC = () => {
  // TODO: Replace with actual LiveStore event query when available
  const events: any[] = []

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
