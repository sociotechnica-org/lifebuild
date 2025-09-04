import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest'
import fs from 'fs'
import { TaskScheduler } from '../task-scheduler.js'
import { ProcessedTaskTracker } from '../processed-task-tracker.js'
import type { RecurringTask } from '@work-squared/shared/schema'

const TEST_DATA_PATH = './test-data-scheduler'

// Mock the AgenticLoop and BraintrustProvider
vi.mock('../agentic-loop/agentic-loop.js', () => ({
  AgenticLoop: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue(undefined),
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
  let mockTracker: ProcessedTaskTracker

  beforeEach(async () => {
    // Clean up test directory
    if (fs.existsSync(TEST_DATA_PATH)) {
      fs.rmSync(TEST_DATA_PATH, { recursive: true, force: true })
    }

    // Create mock store
    mockStore = {
      query: vi.fn(),
      mutate: vi.fn().mockResolvedValue(undefined),
      commit: vi.fn().mockReturnValue(undefined),
    }

    // Create real ProcessedTaskTracker for integration testing
    mockTracker = new ProcessedTaskTracker(TEST_DATA_PATH)
    await mockTracker.initialize()

    // Create scheduler with mocked dependencies
    scheduler = new TaskScheduler(mockTracker)
    await scheduler.initialize()
  })

  afterEach(async () => {
    if (scheduler) {
      await scheduler.close()
    }
    if (mockTracker) {
      await mockTracker.close()
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
      mockStore.query.mockResolvedValue([]) // No due tasks

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
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStore.query.mockResolvedValue([dueTask])

      await scheduler.checkAndExecuteTasks('test-store', mockStore)

      // Should emit start and complete events
      expect(mockStore.commit).toHaveBeenCalledTimes(2)

      // Check that events were emitted with correct structure
      const calls = (mockStore.commit as MockedFunction<any>).mock.calls
      expect(calls[0][0]).toHaveProperty('name', 'task_execution.start')
      expect(calls[1][0]).toHaveProperty('name', 'task_execution.complete')
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
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStore.query.mockResolvedValue([taskWithoutExecution])

      await scheduler.checkAndExecuteTasks('test-store', mockStore)

      expect(mockStore.commit).not.toHaveBeenCalled()
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
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStore.query.mockResolvedValue([faultyTask])

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
      expect(calls[0][0]).toHaveProperty('name', 'task_execution.start')
      expect(calls[1][0]).toHaveProperty('name', 'task_execution.fail')
      expect((calls[1][0] as any).args).toHaveProperty('status', 'failed')
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
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStore.query.mockResolvedValue([dueTask])

      // Run first time
      await scheduler.checkAndExecuteTasks('test-store', mockStore)
      expect(mockStore.commit).toHaveBeenCalledTimes(2) // start + complete

      // Clear mocks and run again
      vi.clearAllMocks()
      mockStore.query.mockResolvedValue([dueTask]) // Same task still "due"

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
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const task2 = { ...task1, nextExecutionAt: time2 }

      // Execute first time slot
      mockStore.query.mockResolvedValue([task1])
      await scheduler.checkAndExecuteTasks('test-store', mockStore)
      expect(mockStore.commit).toHaveBeenCalledTimes(2)

      // Clear mocks and execute second time slot
      vi.clearAllMocks()
      mockStore.query.mockResolvedValue([task2])
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
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStore.query.mockResolvedValue([dueTask])

      // Execute in store-1
      await scheduler.checkAndExecuteTasks('store-1', mockStore)
      expect(mockStore.commit).toHaveBeenCalledTimes(2)

      // Clear mocks and execute in store-2
      vi.clearAllMocks()
      mockStore.query.mockResolvedValue([dueTask])
      await scheduler.checkAndExecuteTasks('store-2', mockStore)
      expect(mockStore.commit).toHaveBeenCalledTimes(2) // Should execute again
    })
  })

  describe('Query filtering', () => {
    it('should query tasks with correct time window', async () => {
      mockStore.query.mockResolvedValue([])

      await scheduler.checkAndExecuteTasks('test-store', mockStore)

      expect(mockStore.query).toHaveBeenCalledWith(expect.any(Object))

      // Verify the query object was passed (now using queryDb instead of raw function)
      const queryObj = (mockStore.query as MockedFunction<any>).mock.calls[0][0] as any
      expect(queryObj).toHaveProperty('_tag', 'def')
      expect(queryObj.label).toContain('recurringTasks')
      expect(queryObj.label).toContain('enabled = ?')
      expect(queryObj.label).toContain('nextExecutionAt')
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
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStore.query.mockResolvedValue([dueTask])
      await scheduler.checkAndExecuteTasks('test-store', mockStore)

      const stats = await scheduler.getStats()
      expect(stats.processedExecutions).toBe(1)
    })

    it('should return store-specific stats', async () => {
      const stats = await scheduler.getStats('specific-store')
      expect(stats).toHaveProperty('processedExecutions')
      expect(stats).toHaveProperty('storeId', 'specific-store')
    })
  })

  describe('Cleanup', () => {
    it('should clean up old execution records', async () => {
      // First process a task to create a record
      const dueTask: RecurringTask = {
        id: 'cleanup-task',
        name: 'Cleanup Test',
        description: 'Test cleanup',
        prompt: 'Will be cleaned up',
        intervalHours: 24,
        lastExecutedAt: null,
        nextExecutionAt: new Date(Date.now() - 60000),
        enabled: true,
        projectId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStore.query.mockResolvedValue([dueTask])
      await scheduler.checkAndExecuteTasks('test-store', mockStore)

      // Verify record exists
      const statsBefore = await scheduler.getStats()
      expect(statsBefore.processedExecutions).toBe(1)

      // Clean up (0 days = everything)
      const cleaned = await scheduler.cleanup(0)
      expect(cleaned).toBe(1)

      // Verify record is gone
      const statsAfter = await scheduler.getStats()
      expect(statsAfter.processedExecutions).toBe(0)
    })
  })
})
