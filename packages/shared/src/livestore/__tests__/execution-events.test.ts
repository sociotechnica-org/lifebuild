import { describe, it, expect, vi } from 'vitest'
import { events } from '../schema'

// Mock store for testing events
const createMockStore = () => {
  const committedEvents: any[] = []
  const storedData = new Map<string, any[]>()

  return {
    commit: vi.fn(async (event: any) => {
      committedEvents.push(event)

      // Mock materializer behavior
      if (event.name === 'v1.RecurringTaskCreated') {
        const tasks = storedData.get('recurringTasks') || []
        tasks.push({
          id: event.args.id,
          name: event.args.name,
          description: event.args.description,
          prompt: event.args.prompt,
          intervalHours: event.args.intervalHours,
          enabled: event.args.enabled,
          projectId: event.args.projectId,
          lastExecutedAt: null,
          nextExecutionAt: event.args.nextExecutionAt,
          createdAt: event.args.createdAt,
          updatedAt: event.args.createdAt,
        })
        storedData.set('recurringTasks', tasks)
      }

      if (event.name === 'v1.TaskExecutionStarted') {
        const executions = storedData.get('taskExecutions') || []
        executions.push({
          id: event.args.id,
          recurringTaskId: event.args.recurringTaskId,
          startedAt: event.args.startedAt,
          completedAt: null,
          status: 'running',
          output: null,
          createdTaskIds: '[]',
        })
        storedData.set('taskExecutions', executions)

        // Update lastExecutedAt on recurring task
        const tasks = storedData.get('recurringTasks') || []
        const task = tasks.find((t: any) => t.id === event.args.recurringTaskId)
        if (task) {
          task.lastExecutedAt = event.args.startedAt
        }
      }

      if (event.name === 'v1.TaskExecutionCompleted') {
        const executions = storedData.get('taskExecutions') || []
        const execution = executions.find((e: any) => e.id === event.args.id)
        if (execution) {
          execution.completedAt = event.args.completedAt
          execution.status = 'completed'
          execution.output = event.args.output || null
          execution.createdTaskIds = event.args.createdTaskIds
            ? JSON.stringify(event.args.createdTaskIds)
            : '[]'
        }
      }

      if (event.name === 'v1.TaskExecutionFailed') {
        const executions = storedData.get('taskExecutions') || []
        const execution = executions.find((e: any) => e.id === event.args.id)
        if (execution) {
          execution.completedAt = event.args.failedAt
          execution.status = 'failed'
          execution.output = event.args.error || null
        }
      }
    }),

    query: vi.fn(async (queryFunc: any) => {
      // Mock query responses based on what's being queried
      if (queryFunc.toString().includes('taskExecutions')) {
        return storedData.get('taskExecutions') || []
      }
      if (queryFunc.toString().includes('recurringTasks')) {
        return storedData.get('recurringTasks') || []
      }
      return []
    }),

    getCommittedEvents: () => committedEvents,
    getStoredData: () => storedData,
  }
}

describe('Task Execution Events', () => {
  describe('taskExecutionStarted', () => {
    it('should create an execution record with running status', async () => {
      const store = createMockStore()
      const recurringTaskId = 'task-1'
      const executionId = 'exec-1'
      const startedAt = new Date('2024-01-01T12:00:00Z')

      // First create a recurring task
      await store.commit(
        events.recurringTaskCreated({
          id: recurringTaskId,
          name: 'Test Task',
          description: 'Test description',
          prompt: 'Test prompt',
          intervalHours: 24,
          enabled: true,
          projectId: undefined,
          nextExecutionAt: new Date('2024-01-02T12:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
        })
      )

      // Start execution
      await store.commit(
        events.taskExecutionStarted({
          id: executionId,
          recurringTaskId,
          startedAt,
        })
      )

      const executions = store.getStoredData().get('taskExecutions')
      expect(executions).toHaveLength(1)
      expect(executions![0]).toMatchObject({
        id: executionId,
        recurringTaskId,
        startedAt,
        completedAt: null,
        status: 'running',
        output: null,
        createdTaskIds: '[]',
      })

      // Check that lastExecutedAt was updated
      const tasks = store.getStoredData().get('recurringTasks')
      expect(tasks![0].lastExecutedAt).toEqual(startedAt)
    })
  })

  describe('taskExecutionCompleted', () => {
    it('should update execution record with completed status', async () => {
      const store = createMockStore()
      const recurringTaskId = 'task-1'
      const executionId = 'exec-1'
      const startedAt = new Date('2024-01-01T12:00:00Z')
      const completedAt = new Date('2024-01-01T12:00:30Z')

      // Setup: Create recurring task and start execution
      await store.commit(
        events.recurringTaskCreated({
          id: recurringTaskId,
          name: 'Test Task',
          description: undefined,
          prompt: 'Test prompt',
          intervalHours: 24,
          enabled: true,
          projectId: undefined,
          nextExecutionAt: new Date('2024-01-02T12:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
        })
      )

      await store.commit(
        events.taskExecutionStarted({
          id: executionId,
          recurringTaskId,
          startedAt,
        })
      )

      // Complete execution
      await store.commit(
        events.taskExecutionCompleted({
          id: executionId,
          completedAt,
          output: 'Execution completed successfully',
          createdTaskIds: ['task-a', 'task-b'],
        })
      )

      const executions = store.getStoredData().get('taskExecutions')
      expect(executions![0]).toMatchObject({
        id: executionId,
        status: 'completed',
        completedAt,
        output: 'Execution completed successfully',
        createdTaskIds: '["task-a","task-b"]',
      })
    })
  })

  describe('taskExecutionFailed', () => {
    it('should update execution record with failed status', async () => {
      const store = createMockStore()
      const recurringTaskId = 'task-1'
      const executionId = 'exec-1'
      const startedAt = new Date('2024-01-01T12:00:00Z')
      const failedAt = new Date('2024-01-01T12:00:10Z')

      // Setup: Create recurring task and start execution
      await store.commit(
        events.recurringTaskCreated({
          id: recurringTaskId,
          name: 'Test Task',
          description: undefined,
          prompt: 'Test prompt',
          intervalHours: 24,
          enabled: true,
          projectId: undefined,
          nextExecutionAt: new Date('2024-01-02T12:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
        })
      )

      await store.commit(
        events.taskExecutionStarted({
          id: executionId,
          recurringTaskId,
          startedAt,
        })
      )

      // Fail execution
      await store.commit(
        events.taskExecutionFailed({
          id: executionId,
          failedAt,
          error: 'Something went wrong',
        })
      )

      const executions = store.getStoredData().get('taskExecutions')
      expect(executions![0]).toMatchObject({
        id: executionId,
        status: 'failed',
        completedAt: failedAt,
        output: 'Something went wrong',
      })
    })
  })

  describe('recurringTaskExecute', () => {
    it('should trigger manual execution', async () => {
      const store = createMockStore()
      const taskId = 'task-1'
      const triggeredAt = new Date('2024-01-01T12:00:00Z')

      // Create a recurring task first
      await store.commit(
        events.recurringTaskCreated({
          id: taskId,
          name: 'Test Task',
          description: undefined,
          prompt: 'Test prompt',
          intervalHours: 24,
          enabled: true,
          projectId: undefined,
          nextExecutionAt: new Date('2024-01-02T12:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
        })
      )

      // Trigger manual execution
      await store.commit(
        events.recurringTaskExecute({
          taskId,
          triggeredAt,
        })
      )

      // Check that event was committed
      const committedEvents = store.getCommittedEvents()
      const triggerEvent = committedEvents.find((e: any) => e.name === 'v1.RecurringTaskExecute')
      expect(triggerEvent).toBeDefined()
      expect(triggerEvent.args).toMatchObject({
        taskId,
        triggeredAt,
      })
    })
  })
})
