import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Project } from '@work-squared/shared/schema'

export interface SortableProjectCardProps {
  project: Project
  index: number
  stream: 'gold' | 'silver'
  onActivateToTable: (project: Project) => void
}

/**
 * Sortable Project Card - Draggable project in the queue
 */
export const SortableProjectCard: React.FC<SortableProjectCardProps> = ({
  project,
  index,
  stream,
  onActivateToTable,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sorting-room-project-card queued ${stream}`}
      {...attributes}
    >
      <div className='sorting-room-drag-handle' {...listeners}>
        <span className='sorting-room-queue-position'>#{index + 1}</span>
      </div>
      <div className='sorting-room-project-info'>
        <div className='sorting-room-project-name'>{project.name}</div>
        <div className='sorting-room-project-meta'>
          {project.category && <span>{project.category}</span>}
        </div>
      </div>
      <button
        type='button'
        className='sorting-room-action-btn activate'
        onClick={() => onActivateToTable(project)}
      >
        Activate to Table
      </button>
    </div>
  )
}
