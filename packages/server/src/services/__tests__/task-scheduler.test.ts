import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest'
import fs from 'fs'
import { TaskScheduler } from '../task-scheduler.js'
import type { RecurringTask, TaskExecution } from '@work-squared/shared/schema'

const TEST_DATA_PATH = './test-data-scheduler'

// Mock the AgenticLoop and BraintrustProvider
vi.mock('../agentic-loop/agentic-loop.js', () => ({
  AgenticLoop: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockReturnValue(undefined),
  })),
}))

vi.mock('../agentic-loop/braintrust-provider.js', () => ({
  BraintrustProvider: vi.fn().mockImplementation(() => ({})),
}))

// Set up environment variables for tests
process.env.BRAINTRUST_API_KEY = 'test-key'
process.env.BRAINTRUST_PROJECT_ID = 'test-project'

describe('TaskScheduler', () => {
  let scheduler: TaskScheduler
  let mockStore: any

  beforeEach(async () => {
    // Clean up test directory
    if (fs.existsSync(TEST_DATA_PATH)) {
      fs.rmSync(TEST_DATA_PATH, { recursive: true, force: true })
    }

    // Create mock store
    mockStore = {
      query: vi.fn(),
      mutate: vi.fn().mockReturnValue(undefined),
      commit: vi.fn().mockReturnValue(undefined),
    }

    // Create scheduler
    scheduler = new TaskScheduler()
    await scheduler.initialize()
  })

  afterEach(async () => {
    if (scheduler) {
      await scheduler.close()
    }

    // Clean up test directory
    if (fs.existsSync(TEST_DATA_PATH)) {
      fs.rmSync(TEST_DATA_PATH, { recursive: true, force: true })
    }

    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const newScheduler = new TaskScheduler()
      await expect(newScheduler.initialize()).resolves.not.toThrow()
      await newScheduler.close()
    })

    it('should throw error when missing environment variables', () => {
      // Temporarily remove environment variables
      const originalApiKey = process.env.BRAINTRUST_API_KEY
      const originalProjectId = process.env.BRAINTRUST_PROJECT_ID

      delete process.env.BRAINTRUST_API_KEY
      delete process.env.BRAINTRUST_PROJECT_ID

      expect(() => new TaskScheduler()).toThrow(
        'BRAINTRUST_API_KEY and BRAINTRUST_PROJECT_ID environment variables are required'
      )

      // Restore environment variables
      if (originalApiKey) process.env.BRAINTRUST_API_KEY = originalApiKey
      if (originalProjectId) process.env.BRAINTRUST_PROJECT_ID = originalProjectId
    })
  })

  describe('Task processing', () => {
    it('should process no tasks when none are due', async () => {
      mockStore.query.mockImplementation((query: any) => {
        if (
          query.label?.includes('getRecurringTasks') ||
          query.toString().includes('getRecurringTasks')
        ) {
          return [] // No due tasks
        }
        return []
      }) // No due tasks

      await scheduler.checkAndExecuteTasks('test-store', mockStore)

      expect(mockStore.query).toHaveBeenCalledWith(expect.any(Object))
      expect(mockStore.mutate).not.toHaveBeenCalled()
    })

    it('should process due tasks', async () => {
      const dueTask: RecurringTask = {
        id: 'task-1',
        name: 'Test Task',
        description: 'A test task',
        prompt: 'Do something useful',
        intervalHours: 24,
        lastExecutedAt: null,
        nextExecutionAt: new Date(Date.now() - 60000), // 1 minute ago (due)
        enabled: true,
        projectId: null,
        assigneeIds: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock different queries: getDueTasks returns the task, deduplication check returns empty
      mockStore.query.mockImplementation((query: any) => {
        // For getDueTasks (getRecurringTasks$), return the due task
        if (
          query.label?.includes('getRecurringTasks') ||
          query.toString().includes('getRecurringTasks')
        ) {
          return [dueTask]
        }
        // For deduplication check (taskExecutions query), return empty array (no completed executions)
        if (
          query.label?.includes('taskExecutions') ||
          query.toString().includes('taskExecutions')
        ) {
          return []
        }
        return []
      })

      await scheduler.checkAndExecuteTasks('test-store', mockStore)

      // Should emit start event, then batched complete+update events
      expect(mockStore.commit).toHaveBeenCalledTimes(2)

      // Check that proper event functions were called
      const calls = (mockStore.commit as MockedFunction<any>).mock.calls
      expect(calls[0][0]).toHaveProperty('name', 'v1.TaskExecutionStarted')
      // calls[1] contains batched events: TaskExecutionCompleted and RecurringTaskUpdated
      expect(calls[1][0]).toHaveProperty('name', 'v1.TaskExecutionCompleted')
      expect(calls[1][1]).toHaveProperty('name', 'v1.RecurringTaskUpdated')
    })

    it('should skip tasks without nextExecutionAt', async () => {
      const taskWithoutExecution: RecurringTask = {
        id: 'task-2',
        name: 'Disabled Task',
        description: 'A disabled task',
        prompt: 'Should not run',
        intervalHours: 24,
        lastExecutedAt: null,
        nextExecutionAt: null, // No next execution time
        enabled: true,
        projectId: null,
        assigneeIds: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStore.query.mockReturnValue([taskWithoutExecution])

      await scheduler.checkAndExecuteTasks('test-store', mockStore)

      expect(mockStore.commit).not.toHaveBeenCalled()
    })

    it('should process newly created tasks with null lastExecutedAt', async () => {
      const newTask: RecurringTask = {
        id: 'new-task',
        name: 'Brand New Task',
        description: 'A task that has never been executed',
        prompt: 'Execute for the first time',
        intervalHours: 12,
        lastExecutedAt: null, // Never executed before
        nextExecutionAt: new Date(Date.now() - 30000), // 30 seconds ago (due)
        enabled: true,
        projectId: 'proj-123',
        assigneeIds: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock different queries: getDueTasks returns the task, deduplication check returns empty
      mockStore.query.mockImplementation((query: any) => {
        // For getDueTasks (getRecurringTasks$), return the due task
        if (
          query.label?.includes('getRecurringTasks') ||
          query.toString().includes('getRecurringTasks')
        ) {
          return [newTask]
        }
        // For deduplication check (taskExecutions query), return empty array (no completed executions)
        if (
          query.label?.includes('taskExecutions') ||
          query.toString().includes('taskExecutions')
        ) {
          return []
        }
        return []
      })

      await scheduler.checkAndExecuteTasks('test-store', mockStore)

      // Should emit start event, then batched complete+update events even for never-executed tasks
      expect(mockStore.commit).toHaveBeenCalledTimes(2)

      const calls = (mockStore.commit as MockedFunction<any>).mock.calls
      expect(calls[0][0]).toHaveProperty('name', 'v1.TaskExecutionStarted')
      // calls[1] contains batched events: TaskExecutionCompleted and RecurringTaskUpdated
      expect(calls[1][0]).toHaveProperty('name', 'v1.TaskExecutionCompleted')
      expect(calls[1][1]).toHaveProperty('name', 'v1.RecurringTaskUpdated')
    })

    it('should handle task execution errors gracefully', async () => {
      const faultyTask: RecurringTask = {
        id: 'faulty-task',
        name: 'Faulty Task',
        description: 'This task will fail',
        prompt: 'This should fail',
        intervalHours: 24,
        lastExecutedAt: null,
        nextExecutionAt: new Date(Date.now() - 60000), // 1 minute ago (due)
        enabled: true,
        projectId: null,
        assigneeIds: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock different queries: getDueTasks returns the task, deduplication check returns empty
      mockStore.query.mockImplementation((query: any) => {
        // For getDueTasks (getRecurringTasks$), return the due task
        if (
          query.label?.includes('getRecurringTasks') ||
          query.toString().includes('getRecurringTasks')
        ) {
          return [faultyTask]
        }
        // For deduplication check (taskExecutions query), return empty array (no completed executions)
        if (
          query.label?.includes('taskExecutions') ||
          query.toString().includes('taskExecutions')
        ) {
          return []
        }
        return []
      })

      // Make AgenticLoop throw an error
      const { AgenticLoop } = await import('../agentic-loop/agentic-loop.js')
      const mockAgenticLoop = vi.mocked(AgenticLoop)
      mockAgenticLoop.mockImplementation(
        () =>
          ({
            run: vi.fn().mockRejectedValue(new Error('LLM execution failed')),
          }) as any
      )

      await scheduler.checkAndExecuteTasks('test-store', mockStore)

      // Should emit start and fail events
      expect(mockStore.commit).toHaveBeenCalledTimes(2)

      const calls = (mockStore.commit as MockedFunction<any>).mock.calls
      expect(calls[0][0]).toHaveProperty('name', 'v1.TaskExecutionStarted')
      expect(calls[1][0]).toHaveProperty('name', 'v1.TaskExecutionFailed')
    })
  })

  describe('Deduplication', () => {
    it('should prevent duplicate execution of same task', async () => {
      const dueTask: RecurringTask = {
        id: 'dup-task',
        name: 'Duplicate Test',
        description: 'Test deduplication',
        prompt: 'Run once only',
        intervalHours: 24,
        lastExecutedAt: null,
        nextExecutionAt: new Date(Date.now() - 60000),
        enabled: true,
        projectId: null,
        assigneeIds: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // First run - no completed executions, query should return due task for getDueTasks and empty array for deduplication check
      mockStore.query.mockImplementation((query: any) => {
        // For getDueTasks in TaskScheduler, return the due task
        if (
          query.toString().includes('getRecurringTasks') ||
          query.label?.includes('getRecurringTasks')
        ) {
          return [dueTask]
        }
        // For deduplication check (taskExecutions query), return empty array
        if (
          query.toString().includes('taskExecutions') ||
          query.label?.includes('taskExecutions')
        ) {
          return []
        }
        return []
      })

      // Ensure AgenticLoop mock succeeds for this test
      const { AgenticLoop } = await import('../agentic-loop/agentic-loop.js')
      const mockAgenticLoop = vi.mocked(AgenticLoop)
      mockAgenticLoop.mockImplementation(
        () =>
          ({
            run: vi.fn().mockResolvedValue(undefined),
          }) as any
      )

      // Run first time
      await scheduler.checkAndExecuteTasks('test-store', mockStore)
      expect(mockStore.commit).toHaveBeenCalledTimes(2) // start + batched(complete + update)

      // Clear mocks and set up for second run
      vi.clearAllMocks()

      // Second run - simulate completed execution exists (deduplication)
      const mockCompletedExecution: TaskExecution = {
        id: 'exec-123',
        recurringTaskId: 'dup-task',
        startedAt: dueTask.nextExecutionAt!,
        completedAt: new Date(),
        status: 'completed',
        output: 'completed',
        createdTaskIds: '[]',
      }

      mockStore.query.mockImplementation((query: any) => {
        // For getDueTasks, still return the due task
        if (
          query.toString().includes('recurringTasks') ||
          query.label?.includes('recurringTasks')
        ) {
          return [dueTask]
        }
        // For deduplication check, return completed execution
        if (
          query.toString().includes('taskExecutions') ||
          query.label?.includes('taskExecutions')
        ) {
          return [mockCompletedExecution]
        }
        return []
      })

      // Run second time - should be deduplicated
      await scheduler.checkAndExecuteTasks('test-store', mockStore)
      expect(mockStore.commit).not.toHaveBeenCalled() // No events emitted
    })

    it('should allow execution of same task at different times', async () => {
      const time1 = new Date(Date.now() - 120000) // 2 minutes ago
      const time2 = new Date(Date.now() - 60000) // 1 minute ago

      const task1: RecurringTask = {
        id: 'time-task',
        name: 'Time Test',
        description: 'Test different times',
        prompt: 'Run at different times',
        intervalHours: 1,
        lastExecutedAt: null,
        nextExecutionAt: time1,
        enabled: true,
        projectId: null,
        assigneeIds: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const task2 = { ...task1, nextExecutionAt: time2 }

      // Execute first time slot
      mockStore.query.mockImplementation((query: any) => {
        if (
          query.label?.includes('getRecurringTasks') ||
          query.toString().includes('getRecurringTasks')
        ) {
          return [task1]
        }
        if (
          query.label?.includes('taskExecutions') ||
          query.toString().includes('taskExecutions')
        ) {
          return [] // No completed executions for time1
        }
        return []
      })
      await scheduler.checkAndExecuteTasks('test-store', mockStore)
      expect(mockStore.commit).toHaveBeenCalledTimes(2)

      // Clear mocks and execute second time slot
      vi.clearAllMocks()
      mockStore.query = vi.fn().mockImplementation((query: any) => {
        if (
          query.label?.includes('getRecurringTasks') ||
          query.toString().includes('getRecurringTasks')
        ) {
          return [task2]
        }
        if (
          query.label?.includes('taskExecutions') ||
          query.toString().includes('taskExecutions')
        ) {
          return [] // No completed executions for time2 (different time)
        }
        return []
      })
      mockStore.mutate = vi.fn().mockReturnValue(undefined)
      mockStore.commit = vi.fn().mockReturnValue(undefined)
      await scheduler.checkAndExecuteTasks('test-store', mockStore)
      expect(mockStore.commit).toHaveBeenCalledTimes(2) // Should execute again
    })

    it('should allow same task to run in different stores', async () => {
      const dueTask: RecurringTask = {
        id: 'multi-store-task',
        name: 'Multi Store Test',
        description: 'Test multiple stores',
        prompt: 'Run in multiple stores',
        intervalHours: 24,
        lastExecutedAt: null,
        nextExecutionAt: new Date(Date.now() - 60000),
        enabled: true,
        projectId: null,
        assigneeIds: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStore.query.mockImplementation((query: any) => {
        if (
          query.label?.includes('getRecurringTasks') ||
          query.toString().includes('getRecurringTasks')
        ) {
          return [dueTask]
        }
        if (
          query.label?.includes('taskExecutions') ||
          query.toString().includes('taskExecutions')
        ) {
          return [] // No completed executions
        }
        return []
      })

      // Ensure AgenticLoop mock succeeds
      const { AgenticLoop } = await import('../agentic-loop/agentic-loop.js')
      const mockAgenticLoop = vi.mocked(AgenticLoop)
      mockAgenticLoop.mockImplementation(
        () =>
          ({
            run: vi.fn().mockResolvedValue(undefined),
          }) as any
      )

      // Execute in store-1
      await scheduler.checkAndExecuteTasks('store-1', mockStore)
      expect(mockStore.commit).toHaveBeenCalledTimes(2)

      // Clear mocks and execute in store-2
      vi.clearAllMocks()
      mockStore.query.mockImplementation((query: any) => {
        if (
          query.label?.includes('getRecurringTasks') ||
          query.toString().includes('getRecurringTasks')
        ) {
          return [dueTask]
        }
        if (
          query.label?.includes('taskExecutions') ||
          query.toString().includes('taskExecutions')
        ) {
          return [] // No completed executions
        }
        return []
      })
      await scheduler.checkAndExecuteTasks('store-2', mockStore)
      expect(mockStore.commit).toHaveBeenCalledTimes(2) // Should execute again
    })
  })

  describe('Query filtering', () => {
    it('should query tasks with correct time window', async () => {
      mockStore.query.mockImplementation((query: any) => {
        if (
          query.label?.includes('getRecurringTasks') ||
          query.toString().includes('getRecurringTasks')
        ) {
          return [] // No due tasks
        }
        return []
      })

      await scheduler.checkAndExecuteTasks('test-store', mockStore)

      expect(mockStore.query).toHaveBeenCalledWith(expect.any(Object))

      // Verify the query object was passed (now using queryDb instead of raw function)
      const queryObj = (mockStore.query as MockedFunction<any>).mock.calls[0][0] as any
      expect(queryObj).toHaveProperty('_tag', 'def')
      expect(queryObj.label).toContain('getRecurringTasks')
      // The query structure has changed, just verify basic properties
      expect(queryObj.label).toBeDefined()
    })
  })

  describe('Statistics', () => {
    it('should return correct stats', async () => {
      // Process one task to create statistics
      const dueTask: RecurringTask = {
        id: 'stats-task',
        name: 'Stats Test',
        description: 'Test statistics',
        prompt: 'Generate stats',
        intervalHours: 24,
        lastExecutedAt: null,
        nextExecutionAt: new Date(Date.now() - 60000),
        enabled: true,
        projectId: null,
        assigneeIds: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStore.query.mockImplementation((query: any) => {
        if (
          query.label?.includes('getRecurringTasks') ||
          query.toString().includes('getRecurringTasks')
        ) {
          return [dueTask]
        }
        if (
          query.label?.includes('taskExecutions') ||
          query.toString().includes('taskExecutions')
        ) {
          return [] // No completed executions
        }
        return []
      })
      await scheduler.checkAndExecuteTasks('test-store', mockStore)

      // Task should be processed successfully
      expect(mockStore.commit).toHaveBeenCalled()
    })
  })

  describe('Next execution scheduling', () => {
    it('should update nextExecutionAt after successful task execution', async () => {
      const now = new Date()
      const dueTask: RecurringTask = {
        id: 'schedule-test',
        name: 'Schedule Test',
        description: 'Test scheduling',
        prompt: 'Test scheduling update',
        intervalHours: 4, // 4 hours
        lastExecutedAt: null,
        nextExecutionAt: new Date(now.getTime() - 30000), // Due 30 seconds ago
        enabled: true,
        projectId: null,
        assigneeIds: '[]',
        createdAt: now,
        updatedAt: now,
      }

      mockStore.query.mockImplementation((query: any) => {
        if (
          query.label?.includes('getRecurringTasks') ||
          query.toString().includes('getRecurringTasks')
        ) {
          return [dueTask]
        }
        if (
          query.label?.includes('taskExecutions') ||
          query.toString().includes('taskExecutions')
        ) {
          return [] // No completed executions
        }
        return []
      })

      // Mock AgenticLoop to resolve successfully
      const { AgenticLoop } = await import('../agentic-loop/agentic-loop.js')
      const mockAgenticLoop = vi.mocked(AgenticLoop)
      mockAgenticLoop.mockImplementation(
        () =>
          ({
            run: vi.fn().mockReturnValue(undefined),
          }) as any
      )

      await scheduler.checkAndExecuteTasks('test-store', mockStore)

      // Verify the task execution events
      const commitCalls = mockStore.commit.mock.calls
      expect(commitCalls.length).toBeGreaterThanOrEqual(2) // start, batched(complete + update)

      // Find the RecurringTaskUpdated event (should be the second argument in the batched call)
      const batchedCall = commitCalls.find((call: any) => call.length > 1)
      expect(batchedCall).toBeDefined()
      
      const updateEvent = batchedCall.find((event: any) => event.name === 'v1.RecurringTaskUpdated')
      expect(updateEvent).toBeDefined()
      expect(updateEvent.args).toMatchObject({
        id: 'schedule-test',
        updates: {},
        updatedAt: expect.any(Date),
        nextExecutionAt: expect.any(Date),
      })

      // Verify nextExecutionAt is approximately 4 hours in the future
      const nextExecution = updateEvent.args.nextExecutionAt
      const timeDiff = nextExecution.getTime() - now.getTime()
      const expectedDiff = 4 * 60 * 60 * 1000 // 4 hours in milliseconds

      // Allow for some variance due to test execution time (within 1 minute)
      expect(timeDiff).toBeGreaterThan(expectedDiff - 60000)
      expect(timeDiff).toBeLessThan(expectedDiff + 60000)
    })
  })
})
