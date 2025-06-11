import React from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { Task } from '../livestore/schema.js'

interface TaskCardProps {
  task: Task
  isDragOverlay?: boolean
}

export function TaskCard({ task, isDragOverlay = false }: TaskCardProps) {
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: task.id,
  })

  // Combine refs
  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node)
    setDropRef(node)
  }

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragListeners}
      {...dragAttributes}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 transition-shadow cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : 'hover:shadow-md'
      } ${isDragOverlay ? 'shadow-lg rotate-2' : ''} ${isOver ? 'border-blue-300 border-2' : ''}`}
    >
      <h3 className='text-sm font-medium text-gray-900 line-clamp-2'>{task.title}</h3>
    </div>
  )
}
