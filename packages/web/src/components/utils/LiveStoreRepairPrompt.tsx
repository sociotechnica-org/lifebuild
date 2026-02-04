import React, { useState } from 'react'
import { ConfirmModal } from '../ui/ConfirmModal/index.js'

interface LiveStoreRepairPromptProps {
  title: string
  description: string
  details?: string
  showRepairAction?: boolean
  isRepairing?: boolean
  onConfirmRepair?: () => void
  onRetry?: () => void
  onReload?: () => void
}

export const LiveStoreRepairPrompt: React.FC<LiveStoreRepairPromptProps> = ({
  title,
  description,
  details,
  showRepairAction = false,
  isRepairing = false,
  onConfirmRepair,
  onRetry,
  onReload,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const openConfirm = () => {
    if (!onConfirmRepair) return
    setIsConfirmOpen(true)
  }

  const handleConfirm = () => {
    setIsConfirmOpen(false)
    onConfirmRepair?.()
  }

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
      <div className='max-w-md w-full'>
        <div className='bg-white rounded-lg shadow-lg p-6'>
          <div className='flex items-center mb-4'>
            <div className='flex-shrink-0'>
              <svg
                className='h-8 w-8 text-amber-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>
            <div className='ml-3'>
              <h3 className='text-lg font-medium text-gray-900'>{title}</h3>
            </div>
          </div>

          <div className='mb-4 space-y-2 text-sm text-gray-600'>
            <p>{description}</p>
            {details ? <p className='text-gray-500'>{details}</p> : null}
          </div>

          <div className='flex flex-wrap gap-3'>
            {showRepairAction ? (
              <button
                onClick={openConfirm}
                disabled={isRepairing}
                className='flex-1 bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60'
              >
                {isRepairing ? 'Repairing…' : 'Repair local data'}
              </button>
            ) : null}
            {onRetry ? (
              <button
                onClick={onRetry}
                className='flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors'
              >
                Try again
              </button>
            ) : null}
            {onReload ? (
              <button
                onClick={onReload}
                className='flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors'
              >
                Reload page
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {showRepairAction ? (
        <ConfirmModal
          isOpen={isConfirmOpen}
          title='Repair local data'
          message='This will clear the local LiveStore data on this device and re-sync from the server. Server data will not be affected.'
          confirmText='Repair'
          destructive
          onConfirm={handleConfirm}
          onClose={() => setIsConfirmOpen(false)}
        />
      ) : null}
    </div>
  )
}
