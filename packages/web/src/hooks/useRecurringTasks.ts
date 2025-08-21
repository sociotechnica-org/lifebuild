import { useCallback } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { getRecurringTasks$, getRecurringTaskById$ } from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import { calculateNextExecution } from '@work-squared/shared'
import type { RecurringTask } from '@work-squared/shared/schema'

export interface CreateRecurringTaskParams {
  name: string
  description?: string
  prompt: string
  intervalHours: number
  projectId?: string
}

export interface UpdateRecurringTaskParams {
  name?: string
  description?: string
  prompt?: string
  intervalHours?: number
  projectId?: string
}

export function useRecurringTasks() {
  const { store } = useStore()
  const recurringTasks = useQuery(getRecurringTasks$) ?? []

  const createRecurringTask = useCallback(
    ({ name, description, prompt, intervalHours, projectId }: CreateRecurringTaskParams) => {
      const now = new Date()
      const nextExecutionAt = new Date(calculateNextExecution(now.getTime(), intervalHours))

      return store.commit(
        events.recurringTaskCreated({
          id: crypto.randomUUID(),
          name,
          description,
          prompt,
          intervalHours,
          enabled: true,
          projectId,
          nextExecutionAt,
          createdAt: now,
        })
      )
    },
    [store]
  )

  const updateRecurringTask = useCallback(
    (id: string, updates: UpdateRecurringTaskParams) => {
      const now = new Date()

      // Calculate new nextExecutionAt if interval changed
      let nextExecutionAt: Date | undefined
      if (updates.intervalHours !== undefined) {
        // Find the current task to check if it's enabled
        const currentTask = recurringTasks.find(task => task.id === id)
        if (currentTask && currentTask.enabled) {
          nextExecutionAt = new Date(calculateNextExecution(now.getTime(), updates.intervalHours))
        }
      }

      // Create a complete updates object with all fields present
      const fullUpdates = {
        name: updates.name,
        description: updates.description,
        prompt: updates.prompt,
        intervalHours: updates.intervalHours,
        projectId: updates.projectId,
      }

      return store.commit(
        events.recurringTaskUpdated({
          id,
          updates: fullUpdates,
          updatedAt: now,
          nextExecutionAt,
        })
      )
    },
    [store, recurringTasks]
  )

  const deleteRecurringTask = useCallback(
    (id: string) => {
      return store.commit(
        events.recurringTaskDeleted({
          id,
          deletedAt: new Date(),
        })
      )
    },
    [store]
  )

  const enableRecurringTask = useCallback(
    (id: string) => {
      // Find the task to get its interval
      const task = recurringTasks.find(t => t.id === id)
      if (!task) return Promise.resolve()

      const now = new Date()
      const nextExecutionAt = new Date(calculateNextExecution(now.getTime(), task.intervalHours))

      return store.commit(
        events.recurringTaskEnabled({
          id,
          enabledAt: now,
          nextExecutionAt,
        })
      )
    },
    [store, recurringTasks]
  )

  const disableRecurringTask = useCallback(
    (id: string) => {
      return store.commit(
        events.recurringTaskDisabled({
          id,
          disabledAt: new Date(),
        })
      )
    },
    [store]
  )

  const toggleRecurringTask = useCallback(
    (id: string, enabled: boolean) => {
      return enabled ? enableRecurringTask(id) : disableRecurringTask(id)
    },
    [enableRecurringTask, disableRecurringTask]
  )

  return {
    recurringTasks,
    createRecurringTask,
    updateRecurringTask,
    deleteRecurringTask,
    enableRecurringTask,
    disableRecurringTask,
    toggleRecurringTask,
  }
}

export function useRecurringTask(id: string) {
  const task = useQuery(getRecurringTaskById$(id))?.[0] as RecurringTask | undefined

  return {
    task,
  }
}
