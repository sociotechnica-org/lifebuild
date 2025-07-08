import React from 'react'
import { LoadingSpinner } from './LoadingSpinner.js'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
  className = '',
}) => {
  const baseClasses = 'flex flex-col items-center justify-center space-y-3'
  const fullScreenClasses = fullScreen ? 'min-h-screen bg-gray-50' : 'py-8'

  return (
    <div className={`${baseClasses} ${fullScreenClasses} ${className}`}>
      <LoadingSpinner size={size} />
      <p className='text-sm text-gray-600'>{message}</p>
    </div>
  )
}
