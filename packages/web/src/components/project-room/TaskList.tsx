import React, { useMemo, useRef, useState } from 'react'
import { useStore } from '../../livestore-compat.js'
import type { Task, TaskStatus } from '@lifebuild/shared/schema'
import { events } from '@lifebuild/shared/schema'
import { TASK_STATUSES } from '@lifebuild/shared'
import { SimpleTaskCard } from './SimpleTaskCard.js'
import { usePostHog } from '../../lib/analytics.js'

interface TaskListProps {
  tasks: readonly Task[]
  projectId: string
  onTaskClick?: (taskId: string) => void
}

const STATUS_ORDER = new Map<TaskStatus, number>(
  TASK_STATUSES.map((status, index) => [status as TaskStatus, index])
)

const getStatusOrder = (status: string): number => {
  return STATUS_ORDER.get(status as TaskStatus) ?? Number.MAX_SAFE_INTEGER
}

export function TaskList({ tasks, projectId, onTaskClick }: TaskListProps) {
  const { store } = useStore()
  const posthog = usePostHog()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const statusDiff = getStatusOrder(a.status) - getStatusOrder(b.status)
      if (statusDiff !== 0) return statusDiff

      const positionDiff = a.position - b.position
      if (positionDiff !== 0) return positionDiff

      const createdAtDiff = a.createdAt.getTime() - b.createdAt.getTime()
      if (createdAtDiff !== 0) return createdAtDiff

      return a.id.localeCompare(b.id)
    })
  }, [tasks])

  const handleCycleStatus = (task: Task) => {
    const currentStatusIndex = TASK_STATUSES.indexOf(task.status as TaskStatus)
    const nextStatus =
      TASK_STATUSES[(currentStatusIndex + 1) % TASK_STATUSES.length] ?? TASK_STATUSES[0]
    if (!nextStatus) return

    const tasksInTargetStatus = tasks.filter(t => t.status === nextStatus && t.id !== task.id)
    const maxPosition = tasksInTargetStatus.reduce((max, t) => Math.max(max, t.position), 0)
    const position = maxPosition + 1000

    store.commit(
      events.taskStatusChanged({
        taskId: task.id,
        toStatus: nextStatus,
        position,
        updatedAt: new Date(),
      })
    )

    posthog?.capture('task_status_changed', {
      from: task.status,
      to: nextStatus,
      projectId,
      taskId: task.id,
    })
  }

  const handleAddTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = newTaskTitle.trim()
    if (!title) return

    const todoTasks = tasks.filter(task => task.status === 'todo')
    const maxPosition = todoTasks.reduce((max, task) => Math.max(max, task.position), 0)
    const position = maxPosition + 1000

    store.commit(
      events.taskCreatedV2({
        id: crypto.randomUUID(),
        projectId,
        title,
        description: undefined,
        status: 'todo',
        assigneeIds: undefined,
        position,
        createdAt: new Date(),
      })
    )

    posthog?.capture('task_created', { projectId })
    setNewTaskTitle('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className='h-full m-4 border border-[#e5e2dc] rounded-2xl bg-white overflow-hidden flex flex-col'>
      <div className='px-4 py-3 border-b border-[#e5e2dc] flex items-center justify-between'>
        <h2 className='text-sm font-semibold text-[#2f2b27] uppercase tracking-wide'>Task list</h2>
        <span className='text-xs text-[#8b8680] bg-[#f1efe9] rounded-full px-2 py-1'>
          {sortedTasks.length}
        </span>
      </div>

      <div className='flex-1 min-h-0 overflow-y-auto p-4'>
        {sortedTasks.length > 0 ? (
          <div className='space-y-2'>
            {sortedTasks.map(task => (
              <SimpleTaskCard
                key={task.id}
                task={task}
                onClick={onTaskClick}
                onCycleStatus={handleCycleStatus}
              />
            ))}
          </div>
        ) : (
          <p className='text-sm text-[#8b8680] text-center py-6'>
            No tasks yet. Add one to get started.
          </p>
        )}
      </div>

      <form
        onSubmit={handleAddTask}
        className='border-t border-[#e5e2dc] p-4 flex items-center gap-2 bg-[#faf9f7]'
      >
        <input
          ref={inputRef}
          type='text'
          value={newTaskTitle}
          onChange={event => setNewTaskTitle(event.target.value)}
          placeholder='Task name'
          className='flex-1 p-3 border border-[#e5e2dc] rounded-lg text-sm text-[#2f2b27] bg-white focus:outline-none focus:ring-2 focus:ring-[#8b8680] focus:border-transparent'
        />
        <button
          type='submit'
          disabled={!newTaskTitle.trim()}
          className='px-3 py-2 bg-[#2f2b27] text-white text-sm rounded-lg hover:bg-[#3d3832] disabled:bg-[#d4d0c8] disabled:cursor-not-allowed transition-colors'
        >
          Add task
        </button>
      </form>
    </div>
  )
}
