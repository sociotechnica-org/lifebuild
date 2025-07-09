import React, { useState } from 'react'
import type { Worker } from '../../../livestore/schema.js'
import { EditWorkerModal } from '../EditWorkerModal/EditWorkerModal.js'

interface WorkerCardProps {
  worker: Worker
  onClick?: () => void
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker, onClick }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date))
  }

  return (
    <div
      className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200'
      onClick={onClick}
    >
      <div className='flex items-center mb-3'>
        <div className='w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center text-lg font-medium mr-3'>
          {worker.avatar || '🤖'}
        </div>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>{worker.name}</h3>
          {worker.roleDescription && (
            <p className='text-sm text-gray-600'>{worker.roleDescription}</p>
          )}
        </div>
      </div>

      <div className='text-sm text-gray-500 mb-3'>
        <p>Created: {formatDate(worker.createdAt)}</p>
        <p>Status: {worker.isActive ? 'Active' : 'Inactive'}</p>
      </div>

      <div className='flex gap-2'>
        <button className='flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors'>
          Chat
        </button>
        <button
          onClick={e => {
            e.stopPropagation()
            setIsEditModalOpen(true)
          }}
          className='flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors'
        >
          Edit
        </button>
      </div>

      <EditWorkerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        worker={worker}
      />
    </div>
  )
}
