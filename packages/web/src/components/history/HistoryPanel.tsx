import React from 'react'
import { EventList } from './EventList.js'

export const HistoryPanel: React.FC = () => {
  // For now, we'll create mock data until we understand how to access LiveStore events
  // TODO: Replace with actual LiveStore event query
  const mockEvents = [
    {
      id: '1',
      type: 'v1.ProjectCreated',
      timestamp: new Date(),
      data: {
        id: 'proj-1',
        name: 'Sample Project',
        description: 'A sample project for testing',
        createdAt: new Date(),
      },
    },
    {
      id: '2',
      type: 'v1.TaskCreated',
      timestamp: new Date(Date.now() - 60000),
      data: {
        id: 'task-1',
        projectId: 'proj-1',
        columnId: 'col-1',
        title: 'Sample Task',
        description: 'A sample task for testing',
        position: 0,
        createdAt: new Date(Date.now() - 60000),
      },
    },
  ]

  return (
    <div className='h-full flex flex-col'>
      <div className='bg-white border-b border-gray-200 px-6 py-4'>
        <h1 className='text-2xl font-bold text-gray-900'>History</h1>
        <p className='text-sm text-gray-500 mt-1'>
          Activity stream of all events in your workspace
        </p>
      </div>

      <div className='flex-1 overflow-auto'>
        <EventList events={mockEvents} />
      </div>
    </div>
  )
}
