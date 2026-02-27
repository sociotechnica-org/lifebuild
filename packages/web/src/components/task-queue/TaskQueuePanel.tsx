import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TASK_STATUSES } from '@lifebuild/shared'
import { getAllTasks$, getHexPositions$, getProjects$ } from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import type { Project, Task, TaskStatus } from '@lifebuild/shared/schema'
import { generateRoute } from '../../constants/routes.js'
import { useQuery, useStore } from '../../livestore-compat.js'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'
import { SimpleTaskCard } from '../project-room/SimpleTaskCard.js'

export const TASK_QUEUE_COLLAPSED_STORAGE_KEY = 'lifebuild.taskQueuePanel.collapsed'

const STATUS_ORDER = new Map<TaskStatus, number>(
  TASK_STATUSES.map((status, index) => [status as TaskStatus, index])
)

const getStatusOrder = (status: string): number => {
  return STATUS_ORDER.get(status as TaskStatus) ?? Number.MAX_SAFE_INTEGER
}

const sortTasks = (tasks: readonly Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    const statusDiff = getStatusOrder(a.status) - getStatusOrder(b.status)
    if (statusDiff !== 0) return statusDiff

    const positionDiff = a.position - b.position
    if (positionDiff !== 0) return positionDiff

    const createdAtDiff = a.createdAt.getTime() - b.createdAt.getTime()
    if (createdAtDiff !== 0) return createdAtDiff

    return a.id.localeCompare(b.id)
  })
}

const readPersistedCollapsedState = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(TASK_QUEUE_COLLAPSED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

type TaskProjectGroup = {
  project: Project
  tasks: Task[]
}

export const TaskQueuePanel: React.FC = () => {
  const navigate = useNavigate()
  const { store } = useStore()
  const projects = useQuery(getProjects$) ?? []
  const tasks = useQuery(getAllTasks$) ?? []
  const hexPositions = useQuery(getHexPositions$) ?? []
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => readPersistedCollapsedState())

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(TASK_QUEUE_COLLAPSED_STORAGE_KEY, String(isCollapsed))
    } catch {
      // Ignore localStorage errors in private mode/test environments.
    }
  }, [isCollapsed])

  const placedProjectIds = useMemo(() => {
    return new Set(
      hexPositions
        .filter(position => position.entityType === 'project')
        .map(position => position.entityId)
    )
  }, [hexPositions])

  const placedProjects = useMemo(() => {
    return projects.filter(project => placedProjectIds.has(project.id))
  }, [placedProjectIds, projects])

  const shouldRenderPanel = placedProjects.length >= 2

  const tasksById = useMemo(() => {
    return new Map(tasks.map(task => [task.id, task]))
  }, [tasks])

  const groupedTasks = useMemo<TaskProjectGroup[]>(() => {
    if (!shouldRenderPanel) {
      return []
    }

    const placedProjectLookup = new Map(placedProjects.map(project => [project.id, project]))
    const grouped = new Map<string, Task[]>()

    for (const task of tasks) {
      if (!task.projectId) {
        continue
      }

      if (!placedProjectLookup.has(task.projectId)) {
        continue
      }

      const existingGroup = grouped.get(task.projectId) ?? []
      existingGroup.push(task)
      grouped.set(task.projectId, existingGroup)
    }

    return Array.from(grouped.entries())
      .map(([projectId, groupTasks]) => {
        const project = placedProjectLookup.get(projectId)
        if (!project) {
          return null
        }

        return {
          project,
          tasks: sortTasks(groupTasks),
        }
      })
      .filter((value): value is TaskProjectGroup => value !== null)
      .sort((a, b) => a.project.name.localeCompare(b.project.name))
  }, [placedProjects, shouldRenderPanel, tasks])

  const totalTaskCount = useMemo(() => {
    return groupedTasks.reduce((count, group) => count + group.tasks.length, 0)
  }, [groupedTasks])

  const handleTaskClick = (taskId: string) => {
    const task = tasksById.get(taskId)
    if (!task?.projectId) {
      return
    }

    navigate(preserveStoreIdInUrl(generateRoute.project(task.projectId)), {
      state: { openedFromMap: true },
    })
  }

  const handleCycleStatus = (task: Task) => {
    if (!task.projectId) {
      return
    }

    const currentStatusIndex = TASK_STATUSES.indexOf(task.status as TaskStatus)
    const nextStatus =
      TASK_STATUSES[(currentStatusIndex + 1) % TASK_STATUSES.length] ?? TASK_STATUSES[0]

    if (!nextStatus) {
      return
    }

    const tasksInTargetStatus = tasks.filter(
      candidate =>
        candidate.projectId === task.projectId &&
        candidate.status === nextStatus &&
        candidate.id !== task.id
    )

    const maxPosition = tasksInTargetStatus.reduce((max, candidate) => {
      return Math.max(max, candidate.position)
    }, 0)

    store.commit(
      events.taskStatusChanged({
        taskId: task.id,
        toStatus: nextStatus,
        position: maxPosition + 1000,
        updatedAt: new Date(),
      })
    )
  }

  if (!shouldRenderPanel) {
    return null
  }

  return (
    <aside
      className='pointer-events-auto fixed right-4 top-[5.5rem] z-[130] w-[min(24rem,calc(100vw-2rem))]'
      data-testid='task-queue-panel'
      aria-label='Task queue panel'
    >
      <div className='overflow-hidden rounded-2xl border border-[#d8cab3] bg-[#fff8ec]/95 shadow-[0_14px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm'>
        <div className='flex items-center justify-between border-b border-[#e1d2bb] px-4 py-3'>
          <h2 className='text-sm font-semibold uppercase tracking-wide text-[#5f4a36]'>
            Task queue
          </h2>
          <div className='flex items-center gap-2'>
            <span
              className='rounded-full bg-[#f1e2cb] px-2 py-1 text-xs font-medium text-[#5f4a36]'
              data-testid='task-queue-count'
            >
              {totalTaskCount}
            </span>
            <button
              type='button'
              onClick={() => setIsCollapsed(value => !value)}
              className='rounded-md border border-[#d8cab3] bg-[#fff8ec] px-2 py-1 text-xs font-semibold text-[#5f4a36] transition-colors hover:bg-white'
              aria-label={isCollapsed ? 'Expand task queue' : 'Collapse task queue'}
              data-testid='task-queue-toggle'
            >
              {isCollapsed ? 'Expand' : 'Collapse'}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div
            className='max-h-[calc(100dvh-11rem)] overflow-y-auto px-4 py-3'
            data-testid='task-queue-content'
          >
            {groupedTasks.length > 0 ? (
              <div className='space-y-4'>
                {groupedTasks.map(group => (
                  <section
                    key={group.project.id}
                    data-testid={`task-queue-project-${group.project.id}`}
                  >
                    <h3 className='mb-2 text-xs font-semibold uppercase tracking-wide text-[#7a6857]'>
                      {group.project.name}
                    </h3>
                    <div className='space-y-2'>
                      {group.tasks.map(task => (
                        <div key={task.id} data-testid={`task-queue-task-${task.id}`}>
                          <SimpleTaskCard
                            task={task}
                            onClick={handleTaskClick}
                            onCycleStatus={handleCycleStatus}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <p className='text-sm text-[#7f6952]'>No tasks yet across placed projects.</p>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
