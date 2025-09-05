import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderPlus } from '@phosphor-icons/react'
import { BaseEventItem } from './BaseEventItem.js'
import { HistoryEvent } from '../types.js'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../util/navigation.js'
import { useActorName } from '../hooks/useActorName.js'

interface ProjectCreatedEventProps {
  event: HistoryEvent
  timestamp: Date
}

export const ProjectCreatedEvent: React.FC<ProjectCreatedEventProps> = ({ event, timestamp }) => {
  const navigate = useNavigate()
  const actorName = useActorName(event.actorId)
  const data = event.data as {
    id: string
    name: string
    description?: string
  }

  const handleViewProject = () => {
    navigate(preserveStoreIdInUrl(generateRoute.project(data.id)))
  }

  const icon = <FolderPlus size={16} className='text-blue-600' />

  return (
    <BaseEventItem
      icon={icon}
      timestamp={timestamp}
      title={`Created project "${data.name}"`}
      details={data.description}
      actor={actorName}
      actions={[{ label: 'View Project', onClick: handleViewProject }]}
    />
  )
}
