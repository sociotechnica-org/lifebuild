import { useQuery } from '@livestore/react'
import React, { useState } from 'react'
import { getWorkers$ } from '@lifebuild/shared/queries'
import { WorkerCard } from './WorkerCard/WorkerCard.js'
import { CreateWorkerModal } from './CreateWorkerModal/CreateWorkerModal.js'

export const WorkersPage: React.FC = () => {
  const workers = useQuery(getWorkers$) ?? []
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  if (workers.length === 0) {
    return (
      <div className='h-full bg-white flex flex-col'>
        {/* Header */}
        <div className='border-b border-gray-200 bg-white px-6 py-4'>
          <div className='flex justify-between items-center mb-4'>
            <div>
              <h1 className='text-xl font-semibold text-gray-900 mb-1'>Team</h1>
              <p className='text-gray-600 text-sm'>Manage your AI assistants</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
            >
              Create Worker
            </button>
          </div>
        </div>

        {/* Empty State Content */}
        <div className='flex-1 bg-gray-50 flex flex-col items-center justify-center p-8'>
          <div className='text-center'>
            <h2 className='text-xl font-semibold text-gray-600 mb-4'>No team members found</h2>
            <p className='text-gray-500 mb-6'>
              Create your first worker to get started with AI assistance.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
            >
              Create Worker
            </button>
          </div>
        </div>

        <CreateWorkerModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      </div>
    )
  }

  return (
    <div className='h-full bg-white flex flex-col'>
      {/* Header */}
      <div className='border-b border-gray-200 bg-white px-6 py-4'>
        <div className='flex justify-between items-center mb-4'>
          <div>
            <h1 className='text-xl font-semibold text-gray-900 mb-1'>Team</h1>
            <p className='text-gray-600 text-sm'>Manage your AI assistants</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
          >
            Create Worker
          </button>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto bg-gray-50 p-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {workers.map(worker => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
        </div>
      </div>

      <CreateWorkerModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  )
}
