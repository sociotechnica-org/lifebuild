import type { Store } from '@livestore/livestore'
import { queryDb } from '@livestore/livestore'
import { AgenticLoop } from './agentic-loop/agentic-loop.js'
import { BraintrustProvider } from './agentic-loop/braintrust-provider.js'
import { ProcessedTaskTracker } from './processed-task-tracker.js'
import { tables } from '@work-squared/shared/schema'
import type { RecurringTask, TaskExecution } from '@work-squared/shared/schema'
import { DEFAULT_MODEL } from '@work-squared/shared'
import { calculateNextExecution } from '@work-squared/shared/utils/scheduling'

export class TaskScheduler {
  private taskTracker: ProcessedTaskTracker
  private llmProvider: BraintrustProvider

  constructor(taskTracker?: ProcessedTaskTracker) {
    this.taskTracker = taskTracker || new ProcessedTaskTracker()

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
    await this.taskTracker.initialize()
  }

  async close(): Promise<void> {
    await this.taskTracker.close()
  }

  /**
   * Check for due tasks in a store and execute them
   */
  async checkAndExecuteTasks(storeId: string, store: Store): Promise<void> {
    console.log(`🔍 Checking for due tasks in store: ${storeId}`)

    try {
      // Get due tasks with windowing (last 10 minutes to catch missed executions)
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
   * Process a single task - check deduplication and execute if needed
   */
  private async processTask(task: RecurringTask, store: Store, storeId: string): Promise<void> {
    if (!task.nextExecutionAt) {
      console.log(`  ⏭️  Skipping task ${task.id} - no next execution time`)
      return
    }

    // Use the scheduled execution time for deduplication
    const scheduledTime = task.nextExecutionAt

    // Try to claim this task execution
    const claimed = await this.taskTracker.markTaskExecutionProcessed(
      task.id,
      scheduledTime,
      storeId
    )

    if (!claimed) {
      console.log(`  🔒 Task ${task.id} already processed by another instance`)
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
      await this.emitExecutionEvent(store, {
        type: 'task_execution.fail',
        args: {
          id: executionId,
          recurringTaskId: task.id,
          startedAt: startTime,
          completedAt: new Date(),
          status: 'failed' as const,
          output: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      })
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
    await this.emitExecutionEvent(store, {
      type: 'task_execution.start',
      args: {
        id: executionId,
        recurringTaskId: task.id,
        startedAt: startTime,
        status: 'running' as const,
      },
    })

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

      const completedAt = new Date()

      // Calculate next execution time
      const nextExecutionAt = new Date(
        calculateNextExecution(completedAt.getTime(), task.intervalHours)
      )

      // Emit success event
      await this.emitExecutionEvent(store, {
        type: 'task_execution.complete',
        args: {
          id: executionId,
          recurringTaskId: task.id,
          startedAt: startTime,
          completedAt,
          status: 'completed' as const,
          output: 'Task completed successfully via AgenticLoop',
        },
      })

      // Update the task's nextExecutionAt for the next scheduled run
      store.commit({
        name: 'v1.RecurringTaskUpdated',
        args: {
          id: task.id,
          updates: {},
          updatedAt: completedAt,
          nextExecutionAt,
        },
      })
    } catch (error) {
      // Re-throw so the caller can handle it
      throw error
    }
  }

  /**
   * Get tasks that are due for execution (with 10-minute window for missed executions)
   */
  private async getDueTasks(store: Store): Promise<RecurringTask[]> {
    const now = new Date()
    const windowStart = new Date(now.getTime() - 10 * 60 * 1000) // 10 minutes ago

    const allTasks = store.query(
      queryDb(
        tables.recurringTasks
          .select()
          .where('enabled', '=', true)
          .where('nextExecutionAt', '>=', windowStart)
          .where('nextExecutionAt', '<=', now)
      )
    )

    return allTasks as RecurringTask[]
  }

  /**
   * Emit execution event to LiveStore
   */
  private async emitExecutionEvent(
    store: Store,
    event: {
      type: string
      args: Partial<TaskExecution>
    }
  ): Promise<void> {
    try {
      store.commit({
        name: event.type,
        args: event.args,
      })
    } catch (error) {
      console.error(`Failed to emit event ${event.type}:`, error)
      // Don't throw - execution events are best-effort
    }
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
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get statistics about task processing
   */
  async getStats(storeId?: string): Promise<{
    processedExecutions: number
    storeId?: string
  }> {
    const processedExecutions = await this.taskTracker.getProcessedCount(storeId)
    return {
      processedExecutions,
      ...(storeId && { storeId }),
    }
  }

  /**
   * Clean up old execution records
   */
  async cleanup(olderThanDays: number = 30): Promise<number> {
    return await this.taskTracker.cleanupOldExecutions(olderThanDays)
  }
}
