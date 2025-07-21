import React from 'react'

interface ErrorMessageProps {
  error: string | null
  onDismiss: () => void
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onDismiss }) => {
  if (!error) return null

  return (
    <div className='mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md'>
      <div className='flex items-center'>
        <svg
          className='w-5 h-5 text-red-400 mr-2'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
        <span className='text-red-800 text-sm'>{error}</span>
        <button onClick={onDismiss} className='ml-auto text-red-400 hover:text-red-600'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
