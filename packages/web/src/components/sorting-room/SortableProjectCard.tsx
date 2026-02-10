import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Project } from '@lifebuild/shared/schema'
import { generateRoute } from '../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'

export interface SortableProjectCardProps {
  project: Project
  index: number
  stream: 'gold' | 'silver'
  onActivateToTable: (project: Project) => void
  isActiveView?: boolean
}

// Stream colors
const STREAM_COLORS = {
  gold: '#d8a650',
  silver: '#c5ced8',
}

/**
 * Sortable Project Card - Draggable project in the queue
 */
export const SortableProjectCard: React.FC<SortableProjectCardProps> = ({
  project,
  index,
  stream,
  onActivateToTable,
  isActiveView: _isActiveView = false,
}) => {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleView = () => {
    navigate(preserveStoreIdInUrl(generateRoute.project(project.id)))
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeftWidth: '4px',
        borderLeftColor: STREAM_COLORS[stream],
      }}
      className={`flex items-start gap-3 p-4 bg-white border border-[#e8e4de] rounded-xl transition-all duration-150 hover:border-[#8b8680] hover:bg-[#faf9f7] ${
        isDragging ? 'shadow-lg rotate-2' : ''
      }`}
      {...attributes}
    >
      <div
        className='cursor-grab flex items-center justify-center p-1 rounded transition-colors duration-150 hover:bg-black/5 active:cursor-grabbing'
        {...listeners}
      >
        <span className='text-xs font-semibold text-[#8b8680] bg-[#faf9f7] py-1 px-2 rounded min-w-[2rem] text-center'>
          #{index + 1}
        </span>
      </div>
      <div className='flex-1 min-w-0'>
        <div className='font-medium text-sm text-[#2f2b27] truncate'>{project.name}</div>
        <div className='text-xs text-[#8b8680] mt-0.5'>
          {project.category && <span>{project.category}</span>}
        </div>
      </div>
      <div className='flex gap-2 flex-shrink-0'>
        <button
          type='button'
          className='text-xs py-1.5 px-3 rounded-lg bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27] whitespace-nowrap'
          onClick={handleView}
        >
          View
        </button>
        <button
          type='button'
          className='text-xs py-1.5 px-3 rounded-lg bg-[#2f2b27] text-white border-none cursor-pointer transition-all duration-150 hover:bg-black whitespace-nowrap'
          onClick={() => onActivateToTable(project)}
        >
          Activate to Table
        </button>
      </div>
    </div>
  )
}
