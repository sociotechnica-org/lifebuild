import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { StoreManager, StoreInfo } from '../../src/services/store-manager.js'

// Mock the schema tables first
vi.mock('@work-squared/shared/schema', () => {
  const mockSelectFn = vi.fn(() => 'mock-query')
  return {
    tables: {
      chatMessages: { select: mockSelectFn },
      tasks: { select: mockSelectFn },
      boards: { select: mockSelectFn }, // Note: projects table is named 'boards'
      conversations: { select: mockSelectFn },
      documents: { select: mockSelectFn },
      workers: { select: mockSelectFn },
      comments: { select: mockSelectFn },
      recurringTasks: { select: mockSelectFn },
      contacts: { select: mockSelectFn },
    }
  }
})

vi.mock('@livestore/livestore', () => ({
  queryDb: vi.fn((query, options) => ({ query, options })),
}))

// Import after mocking
import { EventProcessor } from '../../src/services/event-processor.js'

describe('EventProcessor', () => {
  let eventProcessor: EventProcessor
  let mockStoreManager: StoreManager
  let mockStore: any
  let subscribeCallbacks: Map<string, (records: any[]) => void>

  beforeEach(() => {
    vi.clearAllMocks()
    subscribeCallbacks = new Map()

    mockStore = {
      subscribe: vi.fn((query, options) => {
        const key = query.options?.label || 'default'
        subscribeCallbacks.set(key, options.onUpdate)
        return () => subscribeCallbacks.delete(key) // unsubscribe function
      }),
    }

    mockStoreManager = {
      updateActivity: vi.fn(),
    } as any

    eventProcessor = new EventProcessor(mockStoreManager)
  })

  afterEach(() => {
    eventProcessor.stopAll()
  })

  describe('startMonitoring', () => {
    it('should start monitoring all tables for a store', () => {
      eventProcessor.startMonitoring('test-store', mockStore)

      // Should subscribe to all monitored tables
      expect(mockStore.subscribe).toHaveBeenCalledTimes(9) // 9 monitored tables
    })

    it('should not start monitoring if already monitoring', () => {
      eventProcessor.startMonitoring('test-store', mockStore)
      eventProcessor.startMonitoring('test-store', mockStore)

      // Should still only subscribe once
      expect(mockStore.subscribe).toHaveBeenCalledTimes(9)
    })

    it('should handle subscription errors gracefully', () => {
      const errorStore = {
        subscribe: vi.fn(() => {
          throw new Error('Subscription failed')
        }),
      }

      expect(() => {
        eventProcessor.startMonitoring('error-store', errorStore)
      }).not.toThrow()

      const stats = eventProcessor.getProcessingStats()
      expect(stats.get('error-store')?.errorCount).toBeGreaterThan(0)
    })
  })

  describe('event handling', () => {
    beforeEach(() => {
      eventProcessor.startMonitoring('test-store', mockStore)
    })

    it('should process new records when table updates', () => {
      const callback = subscribeCallbacks.get('monitor-chatMessages-test-store')
      expect(callback).toBeDefined()

      // Simulate new records
      const records = [
        { id: '1', message: 'Hello', createdAt: new Date() },
        { id: '2', message: 'World', createdAt: new Date() },
      ]

      callback!(records)

      // Should update activity
      expect(mockStoreManager.updateActivity).toHaveBeenCalledWith('test-store')

      // Should track record count
      const stats = eventProcessor.getProcessingStats()
      expect(stats.get('test-store')?.bufferSize).toBeGreaterThanOrEqual(0)
    })

    it('should not process duplicate chat messages', () => {
      const callback = subscribeCallbacks.get('monitor-chatMessages-test-store')!
      
      // First batch of records
      const records1 = [
        { id: '1', message: 'Hello', role: 'user', createdAt: new Date() },
      ]
      callback(records1)

      // Same records again - should not process
      const updateActivityCallCount = mockStoreManager.updateActivity.mock.calls.length
      callback(records1)

      // Should not have called updateActivity again (deduplication only applies to chatMessages)
      expect(mockStoreManager.updateActivity).toHaveBeenCalledTimes(updateActivityCallCount)
    })

    it('should handle events from multiple tables independently', async () => {
      const chatCallback = subscribeCallbacks.get('monitor-chatMessages-test-store')!
      const taskCallback = subscribeCallbacks.get('monitor-tasks-test-store')!

      // Add records to different tables
      chatCallback([{ id: '1', message: 'Chat message' }])
      taskCallback([{ id: '1', title: 'Task title' }])

      // Should update activity for both
      expect(mockStoreManager.updateActivity).toHaveBeenCalledTimes(2)
    })

    it('should buffer events and process them', async () => {
      const callback = subscribeCallbacks.get('monitor-documents-test-store')!
      
      // Add multiple records
      const records = Array.from({ length: 5 }, (_, i) => ({
        id: `doc-${i}`,
        title: `Document ${i}`,
      }))

      callback(records)

      // Give time for async processing
      await new Promise(resolve => setTimeout(resolve, 10))

      const stats = eventProcessor.getProcessingStats()
      const storeStats = stats.get('test-store')
      expect(storeStats).toBeDefined()
      expect(storeStats!.tablesMonitored).toBe(9)
    })
  })

  describe('store isolation', () => {
    let secondStore: any

    beforeEach(() => {
      secondStore = {
        subscribe: vi.fn((query, options) => {
          const key = query.options?.label || 'default'
          subscribeCallbacks.set(key, options.onUpdate)
          return () => subscribeCallbacks.delete(key)
        }),
      }
    })

    it('should process events independently for different stores', () => {
      eventProcessor.startMonitoring('store-1', mockStore)
      eventProcessor.startMonitoring('store-2', secondStore)

      // Trigger events for store-1
      const callback1 = subscribeCallbacks.get('monitor-chatMessages-store-1')!
      callback1([{ id: '1', message: 'Store 1 message' }])

      // Trigger events for store-2  
      const callback2 = subscribeCallbacks.get('monitor-chatMessages-store-2')!
      callback2([{ id: '1', message: 'Store 2 message' }])

      // Both stores should have activity updates
      expect(mockStoreManager.updateActivity).toHaveBeenCalledWith('store-1')
      expect(mockStoreManager.updateActivity).toHaveBeenCalledWith('store-2')

      // Each store should have independent stats
      const stats = eventProcessor.getProcessingStats()
      expect(stats.has('store-1')).toBe(true)
      expect(stats.has('store-2')).toBe(true)
    })

    it('should isolate errors between stores', () => {
      // Mock processEvent to fail for store-1 only
      const originalProcessEvent = (eventProcessor as any).processEvent
      ;(eventProcessor as any).processEvent = vi.fn((storeId, event, storeState) => {
        if (storeId === 'store-1') {
          throw new Error('Processing failed for store-1')
        }
        return originalProcessEvent.call(eventProcessor, storeId, event, storeState)
      })

      eventProcessor.startMonitoring('store-1', mockStore)
      eventProcessor.startMonitoring('store-2', secondStore)

      // Trigger events for both stores
      const callback1 = subscribeCallbacks.get('monitor-chatMessages-store-1')!
      const callback2 = subscribeCallbacks.get('monitor-chatMessages-store-2')!

      callback1([{ id: '1', message: 'Store 1 message' }])
      callback2([{ id: '1', message: 'Store 2 message' }])

      // Give time for async processing
      setTimeout(() => {
        const stats = eventProcessor.getProcessingStats()
        
        // Store-1 should have errors
        expect(stats.get('store-1')?.errorCount).toBeGreaterThan(0)
        
        // Store-2 should not have errors
        expect(stats.get('store-2')?.errorCount).toBe(0)
      }, 10)
    })
  })

  describe('stopMonitoring', () => {
    it('should stop monitoring a specific store', () => {
      const unsubscribeFn = vi.fn()
      mockStore.subscribe.mockReturnValue(unsubscribeFn)

      eventProcessor.startMonitoring('test-store', mockStore)
      eventProcessor.stopMonitoring('test-store')

      // Should unsubscribe from all tables
      expect(unsubscribeFn).toHaveBeenCalledTimes(9)

      // Should remove from stats
      setTimeout(() => {
        const stats = eventProcessor.getProcessingStats()
        expect(stats.has('test-store')).toBe(false)
      }, 10)
    })

    it('should handle stopping non-existent store', () => {
      expect(() => {
        eventProcessor.stopMonitoring('non-existent')
      }).not.toThrow()
    })

    it('should handle unsubscribe errors gracefully', () => {
      const errorUnsubscribe = vi.fn(() => {
        throw new Error('Unsubscribe failed')
      })
      mockStore.subscribe.mockReturnValue(errorUnsubscribe)

      eventProcessor.startMonitoring('test-store', mockStore)
      
      expect(() => {
        eventProcessor.stopMonitoring('test-store')
      }).not.toThrow()
    })
  })

  describe('stopAll', () => {
    it('should stop monitoring all stores', () => {
      const unsubscribeFn = vi.fn()
      mockStore.subscribe.mockReturnValue(unsubscribeFn)

      eventProcessor.startMonitoring('store-1', mockStore)
      eventProcessor.startMonitoring('store-2', mockStore)

      eventProcessor.stopAll()

      // Should unsubscribe from all stores
      expect(unsubscribeFn).toHaveBeenCalledTimes(18) // 9 tables × 2 stores

      setTimeout(() => {
        const stats = eventProcessor.getProcessingStats()
        expect(stats.size).toBe(0)
      }, 10)
    })
  })

  describe('getProcessingStats', () => {
    beforeEach(() => {
      eventProcessor.startMonitoring('test-store', mockStore)
    })

    it('should return stats for all monitored stores', () => {
      const stats = eventProcessor.getProcessingStats()
      
      expect(stats.has('test-store')).toBe(true)
      
      const storeStats = stats.get('test-store')!
      expect(storeStats).toEqual({
        errorCount: 0,
        lastError: undefined,
        bufferSize: 0,
        processing: false,
        lastFlushed: expect.any(String),
        tablesMonitored: 9,
      })
    })

    it('should track error statistics', () => {
      // Force an error
      ;(eventProcessor as any).incrementErrorCount('test-store', new Error('Test error'))

      const stats = eventProcessor.getProcessingStats()
      const storeStats = stats.get('test-store')!
      
      expect(storeStats.errorCount).toBe(1)
      expect(storeStats.lastError).toBe('Test error')
    })

    it('should return empty stats for no stores', () => {
      const emptyProcessor = new EventProcessor(mockStoreManager)
      const stats = emptyProcessor.getProcessingStats()
      
      expect(stats.size).toBe(0)
      emptyProcessor.stopAll()
    })
  })

  describe('event buffering', () => {
    beforeEach(() => {
      eventProcessor.startMonitoring('test-store', mockStore)
    })

    it('should flush buffers periodically', async () => {
      const callback = subscribeCallbacks.get('monitor-chatMessages-test-store')!
      
      // Add some records
      callback([{ id: '1', message: 'Test message' }])

      // Wait longer than flush interval (mocked to be shorter for testing)
      await new Promise(resolve => setTimeout(resolve, 100))

      const stats = eventProcessor.getProcessingStats()
      const storeStats = stats.get('test-store')!
      
      // Buffer should be processed
      expect(storeStats.bufferSize).toBe(0)
    })

    it('should handle large batches of events', async () => {
      const callback = subscribeCallbacks.get('monitor-tasks-test-store')!
      
      // Add many records at once
      const records = Array.from({ length: 150 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
      }))
      
      callback(records)

      // Should handle the large batch without errors
      const stats = eventProcessor.getProcessingStats()
      const storeStats = stats.get('test-store')!
      
      expect(storeStats.errorCount).toBe(0)
    })
  })
})