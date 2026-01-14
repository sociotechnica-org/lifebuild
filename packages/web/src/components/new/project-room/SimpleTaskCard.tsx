import React from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { Task } from '@lifebuild/shared/schema'
import { formatDeadline } from './TaskDetailModal.js'

interface SimpleTaskCardProps {
  task: Task
  isDragOverlay?: boolean
  onClick?: (taskId: string) => void
}

// Parse deadline from task attributes, handling both string (from DB) and object formats
function getTaskDeadline(task: Task): number | undefined {
  if (!task.attributes) return undefined
  try {
    const attrs =
      typeof task.attributes === 'string' ? JSON.parse(task.attributes) : task.attributes
    return attrs?.deadline
  } catch {
    return undefined
  }
}

export function SimpleTaskCard({ task, isDragOverlay = false, onClick }: SimpleTaskCardProps) {
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
  })

  const { setNodeRef: setDropRef } = useDroppable({
    id: task.id,
  })

  // Combine refs for both draggable and droppable
  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node)
    setDropRef(node)
  }

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const handleClick = (e: React.MouseEvent) => {
    // Only handle click if not dragging and click handler exists
    if (!isDragging && onClick) {
      e.stopPropagation()
      onClick(task.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragListeners}
      {...dragAttributes}
      onClick={handleClick}
      className={`bg-white rounded-lg border border-[#e5e2dc] p-3 mb-2 transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : 'hover:bg-[#f5f3f0]'
      } ${isDragOverlay ? 'shadow-lg rotate-2' : ''}`}
    >
      <h3 className='text-sm font-medium text-[#2f2b27] line-clamp-2'>{task.title}</h3>
      {(() => {
        const deadline = getTaskDeadline(task)
        if (!deadline) return null
        return (
          <p
            className={`text-xs mt-1 ${deadline < Date.now() ? 'text-orange-500' : 'text-[#8b8680]'}`}
          >
            {formatDeadline(deadline)}
          </p>
        )
      })()}
    </div>
  )
}
