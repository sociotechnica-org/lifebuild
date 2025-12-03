import { useCallback } from 'react'
import { useStore, useQuery } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import type { Task, Project, TaskStatus } from '@work-squared/shared/schema'
import { getProjects$ } from '@work-squared/shared/queries'
import { resolveLifecycleState } from '@work-squared/shared'

/**
 * Hook that provides a task status change function with automatic bronze project activation.
 *
 * When a task's status changes from 'todo' to any other status, this hook checks if the
 * parent project is a bronze-stream backlog project and automatically activates it.
 */
export function useTaskStatusChange() {
  const { store } = useStore()
  const allProjects = (useQuery(getProjects$) ?? []) as Project[]

  const changeTaskStatus = useCallback(
    (
      task: Task,
      toStatus: TaskStatus,
      position: number,
      updatedAt: Date = new Date(),
      actorId?: string
    ) => {
      // Check if we need to auto-activate a bronze project
      // Condition: task was 'todo' and is moving to a different status
      if (task.status === 'todo' && toStatus !== 'todo' && task.projectId) {
        const project = allProjects.find(p => p.id === task.projectId)
        if (project) {
          const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)

          // Auto-activate if: bronze stream AND backlog status
          if (lifecycle.stream === 'bronze' && lifecycle.status === 'backlog') {
            store.commit(
              events.projectLifecycleUpdated({
                projectId: project.id,
                lifecycleState: {
                  ...lifecycle,
                  status: 'active',
                },
                updatedAt,
                actorId,
              })
            )
          }
        }
      }

      // Emit the task status change event
      store.commit(
        events.taskStatusChanged({
          taskId: task.id,
          toStatus,
          position,
          updatedAt,
          actorId,
        })
      )
    },
    [store, allProjects]
  )

  return { changeTaskStatus }
}
