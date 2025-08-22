import { useCallback } from 'react'
import { useQuery, useStore } from '@livestore/react'
import {
  getRecurringTasks$,
  getRecurringTaskById$,
  getTaskExecutions$,
  getLatestExecution$,
} from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import { calculateNextExecution } from '@work-squared/shared'
import type { RecurringTask, TaskExecution } from '@work-squared/shared/schema'

export interface CreateRecurringTaskParams {
  name: string
  description?: string
  prompt: string
  intervalHours: number
  projectId?: string
}

export interface UpdateRecurringTaskParams {
  name?: string
  description?: string | null
  prompt?: string
  intervalHours?: number
  projectId?: string | null
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

  const triggerRecurringTask = useCallback(
    async (id: string) => {
      // Find the task to get its details
      const task = recurringTasks.find(t => t.id === id)
      if (!task) return

      const now = new Date()

      // First emit the manual trigger event
      await store.commit(
        events.recurringTaskExecute({
          taskId: id,
          triggeredAt: now,
        })
      )

      // Create execution record
      const executionId = crypto.randomUUID()
      await store.commit(
        events.taskExecutionStarted({
          id: executionId,
          recurringTaskId: id,
          startedAt: now,
        })
      )

      // Mock execution - wait 2 seconds then complete
      setTimeout(async () => {
        const completedAt = new Date()
        const nextExecutionAt = new Date(
          calculateNextExecution(completedAt.getTime(), task.intervalHours)
        )

        // Mark execution as completed
        await store.commit(
          events.taskExecutionCompleted({
            id: executionId,
            completedAt,
            output: 'Mock execution completed successfully',
            createdTaskIds: [],
          })
        )

        // Update the task's next execution time
        await store.commit(
          events.recurringTaskUpdated({
            id,
            updates: {
              name: undefined,
              description: undefined,
              prompt: undefined,
              intervalHours: undefined,
              projectId: undefined,
            },
            updatedAt: completedAt,
            nextExecutionAt,
          })
        )
      }, 2000)
    },
    [store, recurringTasks]
  )

  return {
    recurringTasks,
    createRecurringTask,
    updateRecurringTask,
    deleteRecurringTask,
    enableRecurringTask,
    disableRecurringTask,
    toggleRecurringTask,
    triggerRecurringTask,
  }
}

export function useRecurringTask(id: string) {
  const task = useQuery(getRecurringTaskById$(id))?.[0] as RecurringTask | undefined
  const executions = useQuery(getTaskExecutions$(id)) ?? []
  const latestExecution = useQuery(getLatestExecution$(id))?.[0] as TaskExecution | undefined

  return {
    task,
    executions,
    latestExecution,
  }
}
