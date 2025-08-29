import React from 'react'
import type { Worker } from '@work-squared/shared/schema'
import { getAvatarColor } from '../../../utils/avatarColors.js'

interface ChatTypeModalProps {
  availableWorkers: readonly Worker[]
  onClose: () => void
  onSelectChatType: (workerId?: string) => void
}

export const ChatTypeModal: React.FC<ChatTypeModalProps> = ({
  availableWorkers,
  onClose,
  onSelectChatType,
}) => {
  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-50'
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className='bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Choose Chat Type</h3>

        <div className='space-y-2'>
          {/* Generic Chat Option */}
          <button
            onClick={() => onSelectChatType()}
            className='w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer flex items-center'
          >
            <div className='w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3'>
              💬
            </div>
            <div>
              <div className='font-medium text-gray-900'>Generic Chat</div>
              <div className='text-sm text-gray-500'>General purpose AI assistant</div>
            </div>
          </button>

          {/* Worker Options */}
          {availableWorkers.map(worker => (
            <button
              key={worker.id}
              onClick={() => onSelectChatType(worker.id)}
              className='w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer flex items-center'
            >
              <div
                className={`w-8 h-8 ${getAvatarColor(worker.id)} text-white rounded-full flex items-center justify-center text-sm font-medium mr-3`}
              >
                {worker.avatar || '🤖'}
              </div>
              <div>
                <div className='font-medium text-gray-900'>{worker.name}</div>
                <div className='text-sm text-gray-500'>{worker.roleDescription || 'AI Worker'}</div>
              </div>
            </button>
          ))}
        </div>

        <div className='mt-4 flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
