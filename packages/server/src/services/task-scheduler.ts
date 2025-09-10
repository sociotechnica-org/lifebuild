import type { Store } from '@livestore/livestore'
import { AgenticLoop } from './agentic-loop/agentic-loop.js'
import { BraintrustProvider } from './agentic-loop/braintrust-provider.js'
import type { RecurringTask, TaskExecution } from '@work-squared/shared/schema'
import {
  getRecurringTasks$,
  getCompletedExecutionsInWindow$,
  getRunningExecutionsInWindow$,
} from '@work-squared/shared/queries'
import * as events from '@work-squared/shared/events'
import { DEFAULT_MODEL } from '@work-squared/shared'
import { calculateNextExecution } from '@work-squared/shared/utils/scheduling'

export class TaskScheduler {
  private llmProvider: BraintrustProvider

  constructor() {
    // Initialize Braintrust provider with environment variables
    const apiKey = process.env.BRAINTRUST_API_KEY
    const projectId = process.env.BRAINTRUST_PROJECT_ID

    if (!apiKey || !projectId) {
      throw new Error(
        'BRAINTRUST_API_KEY and BRAINTRUST_PROJECT_ID environment variables are required'
      )
    }

    this.llmProvider = new BraintrustProvider(apiKey, projectId)
  }

  async initialize(): Promise<void> {
    // No initialization needed
  }

  async close(): Promise<void> {
    // No cleanup needed
  }

  /**
   * Check for due tasks in a store and execute them
   */
  async checkAndExecuteTasks(storeId: string, store: Store): Promise<void> {
    console.log(`🔍 Checking for due tasks in store: ${storeId}`)

    try {
      // Wait a moment for sync to complete (skip in tests)
      if (process.env.NODE_ENV !== 'test') {
        console.log(`  ⏳ Waiting 3 seconds for sync to complete...`)
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      // Get due tasks
      const dueTasks = await this.getDueTasks(store)

      if (dueTasks.length === 0) {
        console.log(`  No due tasks found in store: ${storeId}`)
        return
      }

      console.log(`  Found ${dueTasks.length} potentially due tasks in store: ${storeId}`)

      // Process each due task
      for (const task of dueTasks) {
        try {
          await this.processTask(task, store, storeId)
        } catch (error) {
          console.error(`❌ Failed to process task ${task.id}:`, error)
          // Continue with other tasks even if one fails
        }
      }
    } catch (error) {
      console.error(`❌ Error checking tasks in store ${storeId}:`, error)
    }
  }

  /**
   * Process a single task - check if it needs execution based on completion status
   */
  private async processTask(task: RecurringTask, store: Store, storeId: string): Promise<void> {
    if (!task.nextExecutionAt) {
      console.log(`  ⏭️  Skipping task ${task.id} - no next execution time`)
      return
    }

    // Check if this task execution time has already been completed or started
    const scheduledTime = task.nextExecutionAt
    const hasCompletedExecution = await this.hasCompletedExecution(store, task.id, scheduledTime)

    if (hasCompletedExecution) {
      console.log(
        `  🔒 Task ${task.id} already completed for scheduled time ${scheduledTime.toISOString()}`
      )
      return
    }

    // Additional check: ensure no concurrent execution is already in progress
    // (provides extra safety even though Render prevents concurrent cron instances)
    const runningExecutionId = await this.hasRunningExecution(store, task.id, scheduledTime)
    if (runningExecutionId) {
      console.log(
        `  🔒 Task ${task.id} already running for scheduled time ${scheduledTime.toISOString()} (execution: ${runningExecutionId})`
      )
      return
    }

    console.log(`  🎯 Executing task: ${task.name} (${task.id})`)

    // Generate execution ID and start time once for the entire task execution
    const executionId = this.generateExecutionId()
    const startTime = new Date()

    try {
      await this.executeTask(task, store, storeId, executionId, startTime)
      console.log(`  ✅ Task ${task.id} completed successfully`)
    } catch (error) {
      console.error(`  ❌ Task ${task.id} execution failed:`, error)

      // Emit failure event with the same execution ID and start time
      await store.commit(
        events.taskExecutionFailed({
          id: executionId,
          failedAt: new Date(),
          error: `Error: ${error instanceof Error ? error.message : String(error)}`,
        })
      )
    }
  }

  /**
   * Execute a single task using the existing AgenticLoop
   */
  private async executeTask(
    task: RecurringTask,
    store: Store,
    storeId: string,
    executionId: string,
    startTime: Date
  ): Promise<void> {
    // Emit start event
    await store.commit(
      events.taskExecutionStarted({
        id: executionId,
        recurringTaskId: task.id,
        startedAt: startTime,
      })
    )

    try {
      // Create AgenticLoop with store context
      const agenticLoop = new AgenticLoop(store, this.llmProvider)

      // Execute the task prompt
      await agenticLoop.run(task.prompt, {
        boardContext: { id: storeId, name: storeId },
        workerContext: {
          name: `Recurring Task: ${task.name}`,
          systemPrompt: this.buildTaskSystemPrompt(task),
        },
        model: DEFAULT_MODEL,
        maxIterations: 10,
      })

      console.log(`  🔄 AgenticLoop completed for task ${task.id}, processing completion...`)

      // Small delay to ensure AgenticLoop database operations are fully committed
      await new Promise(resolve => setTimeout(resolve, 100))

      const completedAt = new Date()

      // Calculate next execution time
      const nextExecutionAt = new Date(
        calculateNextExecution(completedAt.getTime(), task.intervalHours)
      )

      console.log(`  📅 Next execution calculated for ${nextExecutionAt.toISOString()}`)

      // Batch both completion and task update events for atomicity
      console.log(`  🎉 Emitting batched completion events for execution ${executionId}`)
      await store.commit(
        events.taskExecutionCompleted({
          id: executionId,
          completedAt,
          output: 'Task completed successfully via AgenticLoop',
        }),
        events.recurringTaskUpdated({
          id: task.id,
          updates: {
            name: undefined,
            description: undefined,
            projectId: undefined,
            assigneeIds: undefined,
            prompt: undefined,
            intervalHours: undefined,
          },
          updatedAt: completedAt,
          nextExecutionAt,
        })
      )
      console.log(`  ✅ Batched completion events emitted successfully`)
    } catch (error) {
      console.error(`  ❌ Error in executeTask after AgenticLoop: ${error}`)
      // Re-throw so the caller can handle it
      throw error
    }
  }

  /**
   * Get tasks that are due for execution (including overdue tasks)
   */
  private async getDueTasks(store: Store): Promise<RecurringTask[]> {
    const now = new Date()
    // Look back 24 hours to catch any missed executions
    const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    console.log(
      `  🔍 Looking for tasks with nextExecutionAt between ${windowStart.toISOString()} and ${now.toISOString()}`
    )

    // Get all recurring tasks
    const allTasks = store.query(getRecurringTasks$) as RecurringTask[]
    const allEnabledTasks = allTasks.filter(task => task.enabled)

    console.log(`  📊 Total recurring tasks in store: ${allTasks.length}`)
    console.log(`  📊 Enabled recurring tasks: ${allEnabledTasks.length}`)

    allEnabledTasks.forEach(task => {
      console.log(`    Task: ${task.name} (${task.id})`)
      console.log(`      nextExecutionAt: ${task.nextExecutionAt?.toISOString() || 'null'}`)
      console.log(`      enabled: ${task.enabled}`)
      console.log(`      intervalHours: ${task.intervalHours}`)
      if (task.nextExecutionAt) {
        const isOverdue = task.nextExecutionAt <= now
        const inWindow = task.nextExecutionAt >= windowStart && task.nextExecutionAt <= now
        console.log(`      is overdue: ${isOverdue}`)
        console.log(`      in execution window: ${inWindow}`)
        if (isOverdue) {
          const minutesOverdue = Math.round(
            (now.getTime() - task.nextExecutionAt.getTime()) / (1000 * 60)
          )
          console.log(`      minutes overdue: ${minutesOverdue}`)
        }
      }
    })

    // Get tasks that are due (including overdue tasks)
    const dueTasks = allEnabledTasks.filter(task => {
      if (!task.nextExecutionAt) return false
      return task.nextExecutionAt >= windowStart && task.nextExecutionAt <= now
    })

    console.log(`  📊 Due tasks found: ${dueTasks.length}`)
    return dueTasks
  }

  /**
   * Build comprehensive system prompt with all task details
   */
  private buildTaskSystemPrompt(task: RecurringTask): string {
    let prompt = `You are executing a recurring task. Task details:
- Name: ${task.name}
- Description: ${task.description || 'No description provided'}
- Recurring Interval: ${task.intervalHours} hours`

    if (task.projectId) {
      prompt += `\n- Project ID: ${task.projectId} (use project tools to look up project details)`
    }

    prompt += '\n\nPlease execute the following prompt and complete the requested task.'

    return prompt
  }

  /**
   * Generate a unique execution ID
   */
  private generateExecutionId(): string {
    // Use crypto.randomUUID for better uniqueness
    return `exec_${crypto.randomUUID()}`
  }

  /**
   * Check if a task execution has already been completed for the given scheduled time
   */
  private async hasCompletedExecution(
    store: Store,
    taskId: string,
    scheduledTime: Date
  ): Promise<boolean> {
    // Query for task executions that were completed for this recurring task around the scheduled time
    // We use a small window (±5 minutes) to account for slight timing differences
    const windowMs = 5 * 60 * 1000 // 5 minutes
    const windowStart = new Date(scheduledTime.getTime() - windowMs)
    const windowEnd = new Date(scheduledTime.getTime() + windowMs)

    const completedExecutions = store.query(
      getCompletedExecutionsInWindow$(taskId, windowStart, windowEnd)
    ) as TaskExecution[]

    return completedExecutions.length > 0
  }

  /**
   * Check if a task execution is currently running for the given scheduled time
   * Returns the execution ID if found, null otherwise
   */
  private async hasRunningExecution(
    store: Store,
    taskId: string,
    scheduledTime: Date
  ): Promise<string | null> {
    // Query for task executions that are currently running for this recurring task around the scheduled time
    // We use a small window (±5 minutes) to account for slight timing differences
    const windowMs = 5 * 60 * 1000 // 5 minutes
    const windowStart = new Date(scheduledTime.getTime() - windowMs)
    const windowEnd = new Date(scheduledTime.getTime() + windowMs)

    const runningExecutions = store.query(
      getRunningExecutionsInWindow$(taskId, windowStart, windowEnd)
    ) as TaskExecution[]

    return runningExecutions.length > 0 ? runningExecutions[0].id : null
  }
}
