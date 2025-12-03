import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from '@phosphor-icons/react'
import { BaseEventItem } from './BaseEventItem.js'
import { HistoryEvent } from '../types.js'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'

interface DocumentCreatedEventProps {
  event: HistoryEvent
  timestamp: Date
}

export const DocumentCreatedEvent: React.FC<DocumentCreatedEventProps> = ({ event, timestamp }) => {
  const navigate = useNavigate()
  const data = event.data as {
    id: string
    title: string
    content?: string
  }

  const handleViewDocument = () => {
    navigate(preserveStoreIdInUrl(generateRoute.oldDocument(data.id)))
  }

  const icon = <FileText size={16} className='text-amber-600' />

  const previewContent =
    data.content !== undefined
      ? data.content.length > 100
        ? data.content.substring(0, 100) + '...'
        : data.content
      : undefined

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
