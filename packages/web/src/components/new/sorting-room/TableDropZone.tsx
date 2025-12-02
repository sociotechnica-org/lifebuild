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
      className={`sorting-room-table-drop-zone ${isOver ? 'drag-over' : ''} ${hasProject ? 'has-project' : ''}`}
    >
      {children}
    </div>
  )
}
