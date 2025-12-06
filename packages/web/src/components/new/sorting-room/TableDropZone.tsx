import React from 'react'
import { useDroppable } from '@dnd-kit/core'

export interface TableDropZoneProps {
  stream: 'gold' | 'silver'
  hasProject: boolean
  children: React.ReactNode
}

/**
 * Table Drop Zone - Droppable area for activating projects to the table
 */
export const TableDropZone: React.FC<TableDropZoneProps> = ({ stream, hasProject, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `table-drop-${stream}`,
  })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl transition-all duration-200 ${
        isOver && !hasProject
          ? 'bg-green-500/[0.08] border-2 border-dashed border-green-500/40'
          : ''
      }`}
    >
      {children}
    </div>
  )
}
