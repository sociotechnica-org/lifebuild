import React from 'react'
import type { Task, TaskStatus } from '@lifebuild/shared/schema'
import { formatDeadline } from './TaskDetailModal.js'

interface SimpleTaskCardProps {
  task: Task
  onClick?: (taskId: string) => void
  onCycleStatus?: (task: Task) => void
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '[ ]',
  doing: '[i]',
  in_review: '[r]',
  done: '[x]',
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
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

export function SimpleTaskCard({ task, onClick, onCycleStatus }: SimpleTaskCardProps) {
  const handleClick = () => {
    onClick?.(task.id)
  }

  const handleCycleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onCycleStatus?.(task)
  }

  return (
    <div
      data-task-id={task.id}
      onClick={handleClick}
      className='flex items-start gap-3 bg-white rounded-lg border border-[#e5e2dc] p-3 transition-colors hover:bg-[#f5f3f0] cursor-pointer'
    >
      <button
        type='button'
        onClick={handleCycleClick}
        className='shrink-0 w-8 h-8 rounded-md border border-[#d4d0c8] text-xs font-mono text-[#2f2b27] hover:bg-[#f1efe9] transition-colors'
        aria-label={`Cycle status for ${task.title}`}
      >
        {STATUS_LABELS[task.status as TaskStatus] ?? STATUS_LABELS.todo}
      </button>
      <div className='min-w-0 flex-1'>
        <h3 className='text-sm font-medium text-[#2f2b27] line-clamp-2'>{task.title}</h3>
        <div className='flex items-center gap-2 mt-1'>
          <span className='text-xs text-[#8b8680]'>{formatStatus(task.status)}</span>
          {(() => {
            const deadline = getTaskDeadline(task)
            if (!deadline) return null
            // Deadline is stored as UTC midnight of the due date.
            // Task is overdue only after the due date has fully passed (end of day).
            const ONE_DAY_MS = 24 * 60 * 60 * 1000
            const isOverdue = Date.now() >= deadline + ONE_DAY_MS
            return (
              <span className={`text-xs ${isOverdue ? 'text-orange-500' : 'text-[#8b8680]'}`}>
                {formatDeadline(deadline)}
              </span>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
