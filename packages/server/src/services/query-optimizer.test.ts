import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { QueryOptimizer, QueryPatterns } from './query-optimizer.js'
import type { Store } from '@livestore/livestore'

describe('QueryOptimizer', () => {
  let optimizer: QueryOptimizer
  let mockStore: Store

  beforeEach(() => {
    vi.useFakeTimers()

    // Mock Store
    mockStore = {
      query: vi.fn(),
    } as unknown as Store

    optimizer = new QueryOptimizer(mockStore, {
      batchTimeout: 10,
      defaultCacheTTL: 30000,
      maxCacheSize: 100,
    })
  })

  afterEach(() => {
    optimizer.destroy()
    vi.useRealTimers()
  })

  describe('Basic querying', () => {
    it('should execute single query immediately for high priority', async () => {
      const mockResult = [{ id: 1, name: 'test' }]
      mockStore.query = vi.fn().mockReturnValue(mockResult)

      const query = { table: 'users', operation: 'select' }
      const result = await optimizer.query(query, { priority: 'high' })

      expect(result).toEqual(mockResult)
      expect(mockStore.query).toHaveBeenCalledWith(query)
      expect(mockStore.query).toHaveBeenCalledTimes(1)
    })

    it('should batch normal priority queries', async () => {
      const mockResult1 = [{ id: 1 }]
      const mockResult2 = [{ id: 2 }]

      mockStore.query = vi.fn().mockReturnValueOnce(mockResult1).mockReturnValueOnce(mockResult2)

      const query1 = { table: 'users', operation: 'select' }
      const query2 = { table: 'users', operation: 'select' }

      const promise1 = optimizer.query(query1)
      const promise2 = optimizer.query(query2)

      // Advance timers to trigger batch execution
      await vi.advanceTimersByTimeAsync(15)

      const [result1, result2] = await Promise.all([promise1, promise2])

      expect(result1).toEqual(mockResult1)
      expect(result2).toEqual(mockResult2)
      expect(mockStore.query).toHaveBeenCalledTimes(2)
    })

    it('should cache query results', async () => {
      const mockResult = [{ id: 1, name: 'cached' }]
      mockStore.query = vi.fn().mockReturnValue(mockResult)

      const query = { table: 'users' }
      const cacheKey = 'test-cache-key'

      // First call should execute query
      const result1 = await optimizer.query(query, {
        cacheKey,
        priority: 'high', // To avoid batching
      })

      // Second call should use cache
      const result2 = await optimizer.query(query, {
        cacheKey,
        priority: 'high',
      })

      expect(result1).toEqual(mockResult)
      expect(result2).toEqual(mockResult)
      expect(mockStore.query).toHaveBeenCalledTimes(1) // Only called once
    })

    it('should respect cache TTL', async () => {
      const mockResult = [{ id: 1 }]
      mockStore.query = vi.fn().mockReturnValue(mockResult)

      const query = { table: 'users' }
      const shortTTL = 1000 // 1 second

      // First call
      await optimizer.query(query, {
        cacheKey: 'ttl-test',
        cacheTTL: shortTTL,
        priority: 'high',
      })

      // Advance time past TTL
      vi.advanceTimersByTime(1500)

      // Second call should execute query again
      await optimizer.query(query, {
        cacheKey: 'ttl-test',
        cacheTTL: shortTTL,
        priority: 'high',
      })

      expect(mockStore.query).toHaveBeenCalledTimes(2)
    })
  })

  describe('Batch processing', () => {
    it('should handle batch execution errors gracefully', async () => {
      const error = new Error('Query failed')
      mockStore.query = vi.fn().mockImplementation(() => {
        throw error
      })

      const query = { table: 'users' }
      const promise = optimizer.query(query)

      await vi.advanceTimersByTimeAsync(15)

      await expect(promise).rejects.toThrow('Query failed')
    })

    it('should handle mixed success and failure in batches', async () => {
      let callCount = 0
      mockStore.query = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return [{ id: 1 }] // Success
        } else {
          throw new Error('Second query failed') // Failure
        }
      })

      const query1 = { table: 'users', id: 1 }
      const query2 = { table: 'users', id: 2 }

      const promise1 = optimizer.query(query1)
      const promise2 = optimizer.query(query2)

      await vi.advanceTimersByTimeAsync(15)

      const result1 = await promise1
      expect(result1).toEqual([{ id: 1 }])

      await expect(promise2).rejects.toThrow('Second query failed')
    })
  })

  describe('Cache management', () => {
    it('should evict oldest entries when cache is full', async () => {
      const smallOptimizer = new QueryOptimizer(mockStore, {
        maxCacheSize: 2,
        defaultCacheTTL: 60000,
      })

      mockStore.query = vi
        .fn()
        .mockReturnValueOnce([{ id: 1 }])
        .mockReturnValueOnce([{ id: 2 }])
        .mockReturnValueOnce([{ id: 3 }])

      // Fill cache to capacity
      await smallOptimizer.query({}, { cacheKey: 'key1', priority: 'high' })
      await smallOptimizer.query({}, { cacheKey: 'key2', priority: 'high' })

      // Add third item (should evict oldest)
      await smallOptimizer.query({}, { cacheKey: 'key3', priority: 'high' })

      // key1 should be evicted, key2 and key3 should remain
      const stats = smallOptimizer.getCacheStats()
      expect(stats.size).toBe(2)
      expect(stats.entries.map(e => e.key)).toContain('key2')
      expect(stats.entries.map(e => e.key)).toContain('key3')

      smallOptimizer.destroy()
    })

    it('should clean up expired entries periodically', async () => {
      const shortTTL = 100

      mockStore.query = vi.fn().mockReturnValue([{ id: 1 }])

      await optimizer.query(
        {},
        {
          cacheKey: 'expire-test',
          cacheTTL: shortTTL,
          priority: 'high',
        }
      )

      expect(optimizer.getCacheStats().size).toBe(1)

      // Advance time past TTL
      vi.advanceTimersByTime(shortTTL + 50)

      // Trigger cleanup (normally happens every minute)
      optimizer['cleanupCache']()

      expect(optimizer.getCacheStats().size).toBe(0)
    })

    it('should provide accurate cache statistics', async () => {
      mockStore.query = vi.fn().mockReturnValue([{ id: 1 }])

      await optimizer.query({}, { cacheKey: 'stats-test', priority: 'high' })

      const stats = optimizer.getCacheStats()
      expect(stats.size).toBe(1)
      expect(stats.maxSize).toBe(100)
      expect(stats.entries).toHaveLength(1)
      expect(stats.entries[0].key).toBe('stats-test')
      expect(stats.entries[0].age).toBeGreaterThanOrEqual(0)
      expect(stats.entries[0].ttl).toBe(30000)
    })
  })

  describe('Query patterns', () => {
    let queryPatterns: QueryPatterns
    let mockTables: any

    beforeEach(() => {
      queryPatterns = new QueryPatterns(optimizer)

      mockTables = {
        conversations: {
          select: () => ({
            where: vi.fn().mockReturnThis(),
          }),
        },
        workers: {
          select: () => ({
            where: vi.fn().mockReturnThis(),
          }),
        },
        chatMessages: {
          select: () => ({
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
          }),
        },
      }
    })

    it('should get conversation with context efficiently', async () => {
      const conversationId = 'conv-123'
      const mockConversation = {
        id: conversationId,
        workerId: 'worker-456',
        name: 'Test Conversation',
      }
      const mockWorker = {
        id: 'worker-456',
        name: 'Test Worker',
        systemPrompt: 'You are helpful',
      }
      const mockChatHistory = [
        { id: 'msg-1', message: 'Hello', role: 'user' },
        { id: 'msg-2', message: 'Hi there!', role: 'assistant' },
      ]

      // Mock the optimizer's queryAll method
      optimizer.queryAll = vi.fn().mockResolvedValueOnce([
        [mockConversation], // conversation query result
        mockChatHistory, // chat history query result
      ])

      // Mock the single query for worker
      optimizer.query = vi.fn().mockResolvedValue([mockWorker])

      const result = await queryPatterns.getConversationWithContext(conversationId, mockTables)

      expect(result.conversation).toEqual(mockConversation)
      expect(result.worker).toEqual(mockWorker)
      expect(result.chatHistory).toEqual(mockChatHistory)
    })

    it('should handle conversation without worker', async () => {
      const conversationId = 'conv-no-worker'
      const mockConversation = {
        id: conversationId,
        name: 'Conversation without worker',
        // No workerId
      }
      const mockChatHistory: any[] = []

      optimizer.queryAll = vi.fn().mockResolvedValue([[mockConversation], mockChatHistory])

      const result = await queryPatterns.getConversationWithContext(conversationId, mockTables)

      expect(result.conversation).toEqual(mockConversation)
      expect(result.worker).toBeUndefined()
      expect(result.chatHistory).toEqual(mockChatHistory)
    })

    it('should handle multiple conversations efficiently', async () => {
      const conversationIds = ['conv-1', 'conv-2']

      // Mock individual calls
      queryPatterns.getConversationWithContext = vi
        .fn()
        .mockResolvedValueOnce({ conversation: { id: 'conv-1' }, chatHistory: [] })
        .mockResolvedValueOnce({ conversation: { id: 'conv-2' }, chatHistory: [] })

      const results = await queryPatterns.getMultipleConversationsWithContext(
        conversationIds,
        mockTables
      )

      expect(results).toHaveLength(2)
      expect(results[0].conversation.id).toBe('conv-1')
      expect(results[1].conversation.id).toBe('conv-2')
    })
  })

  describe('Priority handling', () => {
    it('should handle mixed priority queries correctly', async () => {
      const highResult = [{ priority: 'high' }]
      const normalResult = [{ priority: 'normal' }]
      const lowResult = [{ priority: 'low' }]

      mockStore.query = vi
        .fn()
        .mockReturnValueOnce(highResult)
        .mockReturnValueOnce(normalResult)
        .mockReturnValueOnce(lowResult)

      const queries = [
        {
          query: { table: 'high' },
          priority: 'high' as const,
          cacheKey: 'high-priority',
        },
        {
          query: { table: 'normal' },
          priority: 'normal' as const,
          cacheKey: 'normal-priority',
        },
        {
          query: { table: 'low' },
          priority: 'low' as const,
          cacheKey: 'low-priority',
        },
      ]

      const resultsPromise = optimizer.queryWithPriority(queries)

      // Advance timers for batching
      await vi.advanceTimersByTimeAsync(15)

      const results = await resultsPromise

      expect(results).toHaveLength(3)
      expect(results[0]).toEqual(highResult) // High priority executed first
      expect(mockStore.query).toHaveBeenCalledTimes(3)
    })
  })

  describe('Resource cleanup', () => {
    it('should clean up all resources on destroy', () => {
      const stats = optimizer.getCacheStats()
      expect(stats.size).toBe(0) // Start clean

      // Add some data
      optimizer['setCache']('test-key', [{ id: 1 }])
      expect(optimizer.getCacheStats().size).toBe(1)

      // Destroy should clean everything
      optimizer.destroy()

      expect(optimizer.getCacheStats().size).toBe(0)
    })

    it('should handle destroy being called multiple times', () => {
      expect(() => {
        optimizer.destroy()
        optimizer.destroy()
      }).not.toThrow()
    })
  })
})
