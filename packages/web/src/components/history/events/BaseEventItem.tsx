import React from 'react'

interface BaseEventItemProps {
  timestamp: Date
  title: string
  details?: string
  icon?: React.ReactNode
  actions?: Array<{
    label: string
    onClick: () => void
  }>
}

export const BaseEventItem: React.FC<BaseEventItemProps> = ({
  timestamp,
  title,
  details,
  icon,
  actions,
}) => {
  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  return (
    <div className='flex items-start space-x-3'>
      {/* Icon */}
      <div className='flex-shrink-0'>
        {icon ? (
          <div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center'>
            {icon}
          </div>
        ) : (
          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
            <div className='w-2 h-2 bg-blue-500 rounded-full' />
          </div>
        )}
      </div>

      {/* Content */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-center justify-between'>
          <p className='text-sm font-medium text-gray-900'>{title}</p>
          <p className='text-xs text-gray-500 flex-shrink-0 ml-2'>{formatTime(timestamp)}</p>
        </div>

        {details && <p className='text-sm text-gray-600 mt-1'>{details}</p>}

        {actions && actions.length > 0 && (
          <div className='flex space-x-2 mt-2'>
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className='text-xs text-blue-600 hover:text-blue-800 font-medium'
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
