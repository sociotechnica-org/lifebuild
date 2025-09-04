import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { ProcessedTaskTracker } from '../processed-task-tracker.js'

const TEST_DATA_PATH = './test-data'

describe('ProcessedTaskTracker', () => {
  let tracker: ProcessedTaskTracker

  beforeEach(async () => {
    // Clean up test directory
    if (fs.existsSync(TEST_DATA_PATH)) {
      fs.rmSync(TEST_DATA_PATH, { recursive: true, force: true })
    }

    tracker = new ProcessedTaskTracker(TEST_DATA_PATH)
    await tracker.initialize()
  })

  afterEach(async () => {
    await tracker.close()

    // Clean up test directory
    if (fs.existsSync(TEST_DATA_PATH)) {
      fs.rmSync(TEST_DATA_PATH, { recursive: true, force: true })
    }
  })

  describe('Database initialization', () => {
    it('should create database file and tables', async () => {
      const dbPath = path.join(TEST_DATA_PATH, 'processed-task-executions.db')
      expect(fs.existsSync(dbPath)).toBe(true)
    })

    it('should create directory if it does not exist', async () => {
      const nonExistentPath = './non-existent-test-dir'
      const newTracker = new ProcessedTaskTracker(nonExistentPath)

      await newTracker.initialize()

      expect(fs.existsSync(nonExistentPath)).toBe(true)

      // Clean up
      await newTracker.close()
      fs.rmSync(nonExistentPath, { recursive: true, force: true })
    })
  })

  describe('Task execution tracking', () => {
    it('should mark task execution as processed', async () => {
      const taskId = 'task-123'
      const scheduledTime = new Date('2024-01-15T10:00:00Z')
      const storeId = 'store-456'

      const marked = await tracker.markTaskExecutionProcessed(taskId, scheduledTime, storeId)
      expect(marked).toBe(true)

      const isProcessed = await tracker.isTaskExecutionProcessed(taskId, scheduledTime, storeId)
      expect(isProcessed).toBe(true)
    })

    it('should return false when marking already processed execution', async () => {
      const taskId = 'task-123'
      const scheduledTime = new Date('2024-01-15T10:00:00Z')
      const storeId = 'store-456'

      // Mark first time
      const firstMark = await tracker.markTaskExecutionProcessed(taskId, scheduledTime, storeId)
      expect(firstMark).toBe(true)

      // Mark second time - should return false (atomic deduplication)
      const secondMark = await tracker.markTaskExecutionProcessed(taskId, scheduledTime, storeId)
      expect(secondMark).toBe(false)
    })

    it('should return false for non-processed execution', async () => {
      const taskId = 'task-never-processed'
      const scheduledTime = new Date('2024-01-15T10:00:00Z')
      const storeId = 'store-456'

      const isProcessed = await tracker.isTaskExecutionProcessed(taskId, scheduledTime, storeId)
      expect(isProcessed).toBe(false)
    })

    it('should handle different scheduled times for same task', async () => {
      const taskId = 'task-123'
      const time1 = new Date('2024-01-15T10:00:00Z')
      const time2 = new Date('2024-01-15T11:00:00Z')
      const storeId = 'store-456'

      // Mark execution at time1
      await tracker.markTaskExecutionProcessed(taskId, time1, storeId)

      // time1 should be processed, time2 should not
      expect(await tracker.isTaskExecutionProcessed(taskId, time1, storeId)).toBe(true)
      expect(await tracker.isTaskExecutionProcessed(taskId, time2, storeId)).toBe(false)

      // Should be able to mark time2
      const marked = await tracker.markTaskExecutionProcessed(taskId, time2, storeId)
      expect(marked).toBe(true)
    })

    it('should handle different stores for same task and time', async () => {
      const taskId = 'task-123'
      const scheduledTime = new Date('2024-01-15T10:00:00Z')
      const store1 = 'store-456'
      const store2 = 'store-789'

      // Mark execution for store1
      await tracker.markTaskExecutionProcessed(taskId, scheduledTime, store1)

      // store1 should be processed, store2 should not
      expect(await tracker.isTaskExecutionProcessed(taskId, scheduledTime, store1)).toBe(true)
      expect(await tracker.isTaskExecutionProcessed(taskId, scheduledTime, store2)).toBe(false)

      // Should be able to mark store2
      const marked = await tracker.markTaskExecutionProcessed(taskId, scheduledTime, store2)
      expect(marked).toBe(true)
    })
  })

  describe('Statistics', () => {
    it('should return zero count for empty database', async () => {
      const count = await tracker.getProcessedCount()
      expect(count).toBe(0)
    })

    it('should return correct total count', async () => {
      const tasks = [
        { taskId: 'task-1', scheduledTime: new Date('2024-01-15T10:00:00Z'), storeId: 'store-1' },
        { taskId: 'task-2', scheduledTime: new Date('2024-01-15T11:00:00Z'), storeId: 'store-1' },
        { taskId: 'task-1', scheduledTime: new Date('2024-01-15T10:00:00Z'), storeId: 'store-2' },
      ]

      for (const task of tasks) {
        await tracker.markTaskExecutionProcessed(task.taskId, task.scheduledTime, task.storeId)
      }

      const count = await tracker.getProcessedCount()
      expect(count).toBe(3)
    })

    it('should return correct count per store', async () => {
      const tasks = [
        { taskId: 'task-1', scheduledTime: new Date('2024-01-15T10:00:00Z'), storeId: 'store-1' },
        { taskId: 'task-2', scheduledTime: new Date('2024-01-15T11:00:00Z'), storeId: 'store-1' },
        { taskId: 'task-1', scheduledTime: new Date('2024-01-15T10:00:00Z'), storeId: 'store-2' },
      ]

      for (const task of tasks) {
        await tracker.markTaskExecutionProcessed(task.taskId, task.scheduledTime, task.storeId)
      }

      const store1Count = await tracker.getProcessedCount('store-1')
      const store2Count = await tracker.getProcessedCount('store-2')

      expect(store1Count).toBe(2)
      expect(store2Count).toBe(1)
    })
  })

  describe('Cleanup', () => {
    it('should clean up old executions', async () => {
      // Add some old executions by manually setting dates
      const taskId = 'old-task'
      const scheduledTime = new Date('2024-01-15T10:00:00Z')
      const storeId = 'store-1'

      await tracker.markTaskExecutionProcessed(taskId, scheduledTime, storeId)

      // Verify it exists
      expect(await tracker.getProcessedCount()).toBe(1)

      // Clean up executions older than 0 days (should remove everything)
      const cleaned = await tracker.cleanupOldExecutions(0)
      expect(cleaned).toBe(1)

      // Verify it's gone
      expect(await tracker.getProcessedCount()).toBe(0)
    })

    it('should not clean up recent executions', async () => {
      const taskId = 'recent-task'
      const scheduledTime = new Date()
      const storeId = 'store-1'

      await tracker.markTaskExecutionProcessed(taskId, scheduledTime, storeId)

      // Clean up executions older than 30 days (should not remove recent ones)
      const cleaned = await tracker.cleanupOldExecutions(30)
      expect(cleaned).toBe(0)

      // Verify it still exists
      expect(await tracker.getProcessedCount()).toBe(1)
    })
  })

  describe('Error handling', () => {
    it('should throw error when querying uninitialized database', async () => {
      const uninitializedTracker = new ProcessedTaskTracker(TEST_DATA_PATH)

      await expect(
        uninitializedTracker.isTaskExecutionProcessed('task', new Date(), 'store')
      ).rejects.toThrow('Database not initialized')
    })

    it('should throw error when marking in uninitialized database', async () => {
      const uninitializedTracker = new ProcessedTaskTracker(TEST_DATA_PATH)

      await expect(
        uninitializedTracker.markTaskExecutionProcessed('task', new Date(), 'store')
      ).rejects.toThrow('Database not initialized')
    })
  })

  describe('Concurrent access', () => {
    it('should handle concurrent marking of same execution', async () => {
      const taskId = 'concurrent-task'
      const scheduledTime = new Date('2024-01-15T10:00:00Z')
      const storeId = 'store-1'

      // Start multiple marking operations concurrently
      const promises = Array(5)
        .fill(null)
        .map(() => tracker.markTaskExecutionProcessed(taskId, scheduledTime, storeId))

      const results = await Promise.all(promises)

      // Only one should succeed (return true), others should return false
      const successes = results.filter(r => r).length
      const failures = results.filter(r => !r).length

      expect(successes).toBe(1)
      expect(failures).toBe(4)

      // Task should be marked as processed
      const isProcessed = await tracker.isTaskExecutionProcessed(taskId, scheduledTime, storeId)
      expect(isProcessed).toBe(true)
    })
  })
})
