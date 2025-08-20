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

  return {
    recurringTasks,
    createRecurringTask,
  }
}

export function useRecurringTask(id: string) {
  const task = useQuery(getRecurringTaskById$(id))?.[0] as RecurringTask | undefined

  return {
    task,
  }
}
