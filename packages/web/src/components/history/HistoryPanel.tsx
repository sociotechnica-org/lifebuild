import React from 'react'
import { EventList } from './EventList.js'

export const HistoryPanel: React.FC = () => {
  // For now, we'll create mock data until we understand how to access LiveStore events
  // TODO: Replace with actual LiveStore event query
  const mockEvents = [
    {
      id: '1',
      type: 'v1.DocumentCreated',
      timestamp: new Date(),
      data: {
        id: 'doc-1',
        title: 'Product Requirements',
        content: 'This document outlines the requirements for our new product feature...',
        createdAt: new Date(),
      },
    },
    {
      id: '2',
      type: 'v1.ConversationCreated',
      timestamp: new Date(Date.now() - 120000),
      data: {
        id: 'conv-1',
        title: 'Planning Session',
        model: 'claude-3-5-sonnet-latest',
        createdAt: new Date(Date.now() - 120000),
      },
    },
    {
      id: '3',
      type: 'v1.TaskCreated',
      timestamp: new Date(Date.now() - 300000),
      data: {
        id: 'task-1',
        projectId: 'test-project',
        columnId: 'col-1',
        title: 'Create landing page design',
        position: 0,
        createdAt: new Date(Date.now() - 300000),
      },
    },
    {
      id: '4',
      type: 'v1.ProjectCreated',
      timestamp: new Date(Date.now() - 600000),
      data: {
        id: 'test-project',
        name: 'Marketing Campaign',
        createdAt: new Date(Date.now() - 600000),
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
