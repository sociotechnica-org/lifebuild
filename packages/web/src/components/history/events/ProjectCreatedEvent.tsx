import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BaseEventItem } from './BaseEventItem.js'
import { HistoryEvent } from '../types.js'
import { preserveStoreIdInUrl } from '../../../util/navigation.js'

interface ProjectCreatedEventProps {
  event: HistoryEvent
  timestamp: Date
}

export const ProjectCreatedEvent: React.FC<ProjectCreatedEventProps> = ({ event, timestamp }) => {
  const navigate = useNavigate()
  const data = event.data as {
    id: string
    name: string
    description?: string
  }

  const handleViewProject = () => {
    navigate(preserveStoreIdInUrl(`/project/${data.id}`))
  }

  const icon = (
    <svg className='w-4 h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M12 6v6m0 0v6m0-6h6m-6 0H6'
      />
    </svg>
  )

  return (
    <BaseEventItem
      icon={icon}
      timestamp={timestamp}
      title={`Created project "${data.name}"`}
      details={data.description}
      actions={[{ label: 'View Project', onClick: handleViewProject }]}
    />
  )
}
