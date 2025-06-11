import React from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useQuery } from '@livestore/react'
import type { Task, User } from '../livestore/schema.js'
import { getUsers$ } from '../livestore/queries.js'
import { getInitials } from '../util/initials.js'

interface TaskCardProps {
  task: Task
  isDragOverlay?: boolean
  onClick?: (taskId: string) => void
}

export function TaskCard({ task, isDragOverlay = false, onClick }: TaskCardProps) {
  const users = useQuery(getUsers$) ?? []

  // Parse assigneeIds from JSON string safely
  let assigneeIds: string[] = []
  try {
    assigneeIds = task.assigneeIds ? JSON.parse(task.assigneeIds) : []
  } catch {
    assigneeIds = []
  }
  const assignees = users.filter((user: User) => assigneeIds.includes(user.id))

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
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 transition-shadow cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : 'hover:shadow-md'
      } ${isDragOverlay ? 'shadow-lg rotate-2' : ''}`}
    >
      <div className='flex items-start justify-between'>
        <h3 className='text-sm font-medium text-gray-900 line-clamp-2 flex-1 pr-2'>{task.title}</h3>
        {assignees.length > 0 && (
          <div className='flex -space-x-1'>
            {assignees.slice(0, 3).map((assignee: User) => (
              <div
                key={assignee.id}
                className='w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium border-2 border-white'
                title={assignee.name}
              >
{getInitials(assignee.name)}
              </div>
            ))}
            {assignees.length > 3 && (
              <div
                className='w-7 h-7 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-medium border-2 border-white'
                title={`+${assignees.length - 3} more`}
              >
                +{assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
