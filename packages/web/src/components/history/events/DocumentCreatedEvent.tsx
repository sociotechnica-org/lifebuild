import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BaseEventItem } from './BaseEventItem.js'
import { HistoryEvent } from '../types.js'
import { preserveStoreIdInUrl } from '../../../util/navigation.js'

interface DocumentCreatedEventProps {
  event: HistoryEvent
  timestamp: Date
}

export const DocumentCreatedEvent: React.FC<DocumentCreatedEventProps> = ({ event, timestamp }) => {
  const navigate = useNavigate()
  const data = event.data as {
    id: string
    title: string
    content: string
  }

  const handleViewDocument = () => {
    navigate(preserveStoreIdInUrl(`/document/${data.id}`))
  }

  const icon = (
    <svg className='w-4 h-4 text-amber-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      />
    </svg>
  )

  const previewContent =
    data.content.length > 100 ? data.content.substring(0, 100) + '...' : data.content

  return (
    <BaseEventItem
      icon={icon}
      timestamp={timestamp}
      title={`Created document "${data.title}"`}
      details={previewContent}
      actions={[{ label: 'View Document', onClick: handleViewDocument }]}
    />
  )
}
