import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AsyncQueueProcessor } from './async-queue-processor.js'

describe('AsyncQueueProcessor', () => {
  let processor: AsyncQueueProcessor<string>

  beforeEach(() => {
    processor = new AsyncQueueProcessor<string>()
  })

  afterEach(() => {
    processor.destroy()
  })

  describe('Basic queue processing', () => {
    it('should process tasks sequentially in order', async () => {
      const results: string[] = []
      const delays = [50, 30, 10] // Intentionally out of order delays
      const expectedOrder = ['task-1', 'task-2', 'task-3']

      const promises = expectedOrder.map((id, index) =>
        processor.enqueue(id, async () => {
          await new Promise(resolve => setTimeout(resolve, delays[index]))
          results.push(id)
          return id
        })
      )

      const processedResults = await Promise.all(promises)

      // Results should be in order despite different delays
      expect(results).toEqual(expectedOrder)
      expect(processedResults).toEqual(expectedOrder)
    })

    it('should handle async tasks correctly', async () => {
      let counter = 0

      const task1 = processor.enqueue('task-1', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return ++counter
      })

      const task2 = processor.enqueue('task-2', async () => {
        await new Promise(resolve => setTimeout(resolve, 5))
        return ++counter
      })

      const [result1, result2] = await Promise.all([task1, task2])

      // Should execute in order, not by completion time
      expect(result1).toBe(1)
      expect(result2).toBe(2)
    })
  })

  describe('Error handling', () => {
    it('should handle task errors without stopping the queue', async () => {
      const results: string[] = []

      const task1 = processor.enqueue('task-1', async () => {
        results.push('task-1')
        return 'success-1'
      })

      const task2 = processor.enqueue('task-2', async () => {
        results.push('task-2')
        throw new Error('Task 2 failed')
      })

      const task3 = processor.enqueue('task-3', async () => {
        results.push('task-3')
        return 'success-3'
      })

      const [result1, error, result3] = await Promise.allSettled([task1, task2, task3])

      expect(result1.status).toBe('fulfilled')
      expect((result1 as PromiseFulfilledResult<string>).value).toBe('success-1')

      expect(error.status).toBe('rejected')
      expect((error as PromiseRejectedResult).reason.message).toBe('Task 2 failed')

      expect(result3.status).toBe('fulfilled')
      expect((result3 as PromiseFulfilledResult<string>).value).toBe('success-3')

      // All tasks should have been attempted
      expect(results).toEqual(['task-1', 'task-2', 'task-3'])
    })

    it('should handle non-Error thrown values', async () => {
      const task = processor.enqueue('task-1', async () => {
        throw 'String error'
      })

      await expect(task).rejects.toThrow('String error')
    })
  })

  describe('Queue management', () => {
    it('should provide accurate queue length', async () => {
      expect(processor.getQueueLength()).toBe(0)
      expect(processor.isProcessing()).toBe(false)

      // Add tasks but don't await them
      const promise1 = processor.enqueue('task-1', async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return 'done'
      })

      const promise2 = processor.enqueue('task-2', async () => {
        return 'done'
      })

      // Should show queue length before processing starts
      await new Promise(resolve => setTimeout(resolve, 1))
      expect(processor.isProcessing()).toBe(true)

      await Promise.all([promise1, promise2])

      expect(processor.getQueueLength()).toBe(0)
      expect(processor.isProcessing()).toBe(false)
    })

    it('should clear all queued tasks', async () => {
      const task1 = processor.enqueue('task-1', async () => 'result-1')
      const task2 = processor.enqueue('task-2', async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return 'result-2'
      })

      // Let first task start processing
      await new Promise(resolve => setTimeout(resolve, 10))

      processor.clear()

      // First task should complete normally
      await expect(task1).resolves.toBe('result-1')

      // Second task should be rejected
      await expect(task2).rejects.toThrow('Queue cleared')

      expect(processor.getQueueLength()).toBe(0)
    })
  })

  describe('Destruction and lifecycle', () => {
    it('should reject new tasks after destruction', async () => {
      processor.destroy()

      expect(processor.isDestroyed()).toBe(true)

      const task = processor.enqueue('task-1', async () => 'result')
      await expect(task).rejects.toThrow('Queue processor has been destroyed')
    })

    it('should reject all pending tasks on destruction', async () => {
      const task1 = processor.enqueue('task-1', async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return 'result-1'
      })

      const task2 = processor.enqueue('task-2', async () => 'result-2')

      // Let processing start
      await new Promise(resolve => setTimeout(resolve, 10))

      processor.destroy()

      // All tasks should be rejected
      await expect(task1).rejects.toThrow()
      await expect(task2).rejects.toThrow('Queue cleared')

      expect(processor.isDestroyed()).toBe(true)
      expect(processor.getQueueLength()).toBe(0)
    })

    it('should handle multiple destroy calls gracefully', () => {
      expect(() => {
        processor.destroy()
        processor.destroy()
      }).not.toThrow()

      expect(processor.isDestroyed()).toBe(true)
    })
  })

  describe('Concurrent enqueueing', () => {
    it('should handle many concurrent tasks', async () => {
      const taskCount = 50
      const results: number[] = []

      const promises = Array.from({ length: taskCount }, (_, i) =>
        processor.enqueue(`task-${i}`, async () => {
          // Small random delay to test ordering
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
          results.push(i)
          return i
        })
      )

      const processedResults = await Promise.all(promises)

      // Should complete in order despite random delays
      expect(results).toEqual(Array.from({ length: taskCount }, (_, i) => i))
      expect(processedResults).toEqual(Array.from({ length: taskCount }, (_, i) => i))
    })
  })
})
