import { useEffect, useRef } from 'react'
import { useQuery } from '@livestore/react'
import { getRecurringTasks$ } from '@work-squared/shared/queries'
import { useRecurringTasks } from '../../hooks/useRecurringTasks.js'

/**
 * TaskScheduler component that checks for due recurring tasks and executes them automatically.
 * This is a frontend implementation for Phase 3, simulating automatic execution.
 */
export const TaskScheduler: React.FC = () => {
  const recurringTasks = useQuery(getRecurringTasks$) ?? []
  const { executeRecurringTask } = useRecurringTasks()
  const executingTasks = useRef<Set<string>>(new Set())
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const checkAndExecuteTasks = async () => {
      const now = Date.now()

      // Find enabled tasks that are due for execution
      const dueTasks = recurringTasks.filter(task => {
        if (!task.enabled) return false
        if (!task.nextExecutionAt) return false
        if (executingTasks.current.has(task.id)) return false // Already executing

        // Check if task is due (nextExecutionAt is in the past)
        return task.nextExecutionAt.getTime() <= now
      })

      // Execute due tasks
      for (const task of dueTasks) {
        console.log(`Executing scheduled task: ${task.name}`)
        executingTasks.current.add(task.id)

        try {
          await executeRecurringTask(task.id, 'automatic')
        } catch (error) {
          console.error(`Failed to execute task ${task.name}:`, error)
        } finally {
          // Remove from executing set after a delay to prevent rapid re-execution
          setTimeout(() => {
            executingTasks.current.delete(task.id)
          }, 5000)
        }
      }
    }

    // Check every 30 seconds for due tasks
    checkAndExecuteTasks() // Check immediately
    checkIntervalRef.current = setInterval(checkAndExecuteTasks, 30000)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [recurringTasks, executeRecurringTask])

  // This component doesn't render anything
  return null
}
