import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EventProcessor } from './event-processor.js'
import type { StoreManager } from './store-manager.js'
import type { Store as LiveStore } from '@livestore/livestore'

// Mock dependencies
vi.mock('./agentic-loop/braintrust-provider.js')
vi.mock('./message-queue-manager.js')
vi.mock('./async-queue-processor.js')

describe('EventProcessor Edge Cases', () => {
  let eventProcessor: EventProcessor
  let mockStoreManager: StoreManager
  let mockStore: LiveStore

  beforeEach(() => {
    // Mock StoreManager
    mockStoreManager = {
      getStore: vi.fn(),
      updateActivity: vi.fn(),
    } as unknown as StoreManager

    // Mock LiveStore
    mockStore = {
      subscribe: vi.fn(),
      query: vi.fn(),
      commit: vi.fn(),
    } as unknown as LiveStore

    // Mock environment variables
    process.env.BRAINTRUST_API_KEY = 'test-api-key'
    process.env.BRAINTRUST_PROJECT_ID = 'test-project-id'

    eventProcessor = new EventProcessor(mockStoreManager)
  })

  afterEach(() => {
    eventProcessor.stopAll()
    vi.clearAllMocks()
    delete process.env.BRAINTRUST_API_KEY
    delete process.env.BRAINTRUST_PROJECT_ID
  })

  describe('Store management edge cases', () => {
    it('should handle duplicate startMonitoring calls gracefully', () => {
      const storeId = 'test-store'
      
      // Mock store.subscribe to prevent actual subscriptions
      mockStore.subscribe = vi.fn().mockReturnValue(() => {})
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Second call should warn about already monitoring
      eventProcessor.startMonitoring(storeId, mockStore)
      
      expect(consoleSpy).toHaveBeenCalledWith(`⚠️ Store ${storeId} is already being monitored`)
      
      consoleSpy.mockRestore()
    })

    it('should handle startMonitoring when store is stopping', () => {
      const storeId = 'test-store'
      
      mockStore.subscribe = vi.fn().mockReturnValue(() => {})
      
      // Start monitoring
      eventProcessor.startMonitoring(storeId, mockStore)
      
      // Stop monitoring (which marks as stopping)
      eventProcessor.stopMonitoring(storeId)
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Try to start again while stopping
      eventProcessor.startMonitoring(storeId, mockStore)
      
      expect(consoleSpy).toHaveBeenCalledWith(`⚠️ Store ${storeId} is currently stopping, cannot start monitoring`)
      
      consoleSpy.mockRestore()
    })

    it('should handle stopMonitoring for non-existent store', () => {
      const storeId = 'non-existent-store'
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      eventProcessor.stopMonitoring(storeId)
      
      expect(consoleSpy).toHaveBeenCalledWith(`⚠️ Store ${storeId} is not being monitored`)
      
      consoleSpy.mockRestore()
    })

    it('should handle subscription errors gracefully', () => {
      const storeId = 'test-store'
      const error = new Error('Subscription failed')
      
      mockStore.subscribe = vi.fn().mockImplementation(() => {
        throw error
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        `❌ Failed to subscribe to chatMessages for store ${storeId}:`,
        error
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Event processing edge cases', () => {
    it('should handle malformed table records', () => {
      const storeId = 'test-store'
      
      const unsubscribeFn = vi.fn()
      const subscribeCallback = vi.fn()
      
      mockStore.subscribe = vi.fn().mockImplementation((query, options) => {
        subscribeCallback.mockImplementation(options.onUpdate)
        return unsubscribeFn
      })
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      const malformedRecords = [
        null,
        undefined,
        { /* missing required fields */ },
        { id: 'test', /* missing other fields */ },
        { message: null }, // null message
      ]
      
      expect(() => {
        subscribeCallback(malformedRecords)
      }).not.toThrow()
    })

    it('should handle empty record updates', () => {
      const storeId = 'test-store'
      
      const subscribeCallback = vi.fn()
      mockStore.subscribe = vi.fn().mockImplementation((query, options) => {
        subscribeCallback.mockImplementation(options.onUpdate)
        return vi.fn()
      })
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      // Empty array should not cause issues
      expect(() => {
        subscribeCallback([])
      }).not.toThrow()
      
      // Should not update activity for empty records
      expect(mockStoreManager.updateActivity).not.toHaveBeenCalled()
    })

    it('should handle extremely long record content', () => {
      const storeId = 'test-store'
      
      const subscribeCallback = vi.fn()
      mockStore.subscribe = vi.fn().mockImplementation((query, options) => {
        subscribeCallback.mockImplementation(options.onUpdate)
        return vi.fn()
      })
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      const longContent = 'x'.repeat(10000) // Very long content
      const records = [{
        id: 'test',
        message: longContent,
        role: 'user',
        conversationId: 'conv-1',
        createdAt: new Date()
      }]
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      subscribeCallback(records)
      
      // Should truncate the content in logs
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/📨.*x{50}\.\.\./)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Chat message processing edge cases', () => {
    beforeEach(() => {
      // Mock getStore to return our mock store
      mockStoreManager.getStore = vi.fn().mockReturnValue(mockStore)
      
      // Mock store.query to return empty results by default
      mockStore.query = vi.fn().mockReturnValue([])
    })

    it('should handle user messages without LLM provider', () => {
      const storeId = 'test-store'
      
      // Create EventProcessor without LLM credentials
      delete process.env.BRAINTRUST_API_KEY
      const eventProcessorNoLLM = new EventProcessor(mockStoreManager)
      
      const subscribeCallback = vi.fn()
      mockStore.subscribe = vi.fn().mockImplementation((query, options) => {
        subscribeCallback.mockImplementation(options.onUpdate)
        return vi.fn()
      })
      
      eventProcessorNoLLM.startMonitoring(storeId, mockStore)
      
      const userMessage = {
        id: 'msg-1',
        role: 'user',
        message: 'Hello',
        conversationId: 'conv-1',
        createdAt: new Date()
      }
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      subscribeCallback([userMessage])
      
      expect(consoleSpy).toHaveBeenCalledWith(
        `⚠️ Skipping chat message processing for ${storeId}: LLM not configured`
      )
      
      consoleSpy.mockRestore()
      eventProcessorNoLLM.stopAll()
    })

    it('should handle missing conversation data gracefully', () => {
      const storeId = 'test-store'
      
      const subscribeCallback = vi.fn()
      mockStore.subscribe = vi.fn().mockImplementation((query, options) => {
        subscribeCallback.mockImplementation(options.onUpdate)
        return vi.fn()
      })
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      // Mock store.query to return empty array (no conversation found)
      mockStore.query = vi.fn().mockReturnValue([])
      
      const userMessage = {
        id: 'msg-1',
        role: 'user',
        message: 'Hello',
        conversationId: 'non-existent-conv',
        createdAt: new Date()
      }
      
      // Should not throw error even with missing conversation
      expect(() => {
        subscribeCallback([userMessage])
      }).not.toThrow()
    })

    it('should handle missing worker data gracefully', () => {
      const storeId = 'test-store'
      
      const subscribeCallback = vi.fn()
      mockStore.subscribe = vi.fn().mockImplementation((query, options) => {
        subscribeCallback.mockImplementation(options.onUpdate)
        return vi.fn()
      })
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      // Mock conversation with workerId but no worker found
      const conversation = {
        id: 'conv-1',
        workerId: 'non-existent-worker',
        model: 'gpt-4',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      mockStore.query = vi.fn()
        .mockReturnValueOnce([conversation]) // First call for conversation
        .mockReturnValueOnce([]) // Second call for worker (empty)
        .mockReturnValueOnce([]) // Third call for chat history
      
      const userMessage = {
        id: 'msg-1',
        role: 'user',
        message: 'Hello',
        conversationId: 'conv-1',
        createdAt: new Date()
      }
      
      expect(() => {
        subscribeCallback([userMessage])
      }).not.toThrow()
    })

    it('should handle conversation queue overflow', () => {
      const storeId = 'test-store'
      
      const subscribeCallback = vi.fn()
      mockStore.subscribe = vi.fn().mockImplementation((query, options) => {
        subscribeCallback.mockImplementation(options.onUpdate)
        return vi.fn()
      })
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      // Mock MessageQueueManager to throw overflow error
      const mockMessageQueue = {
        enqueue: vi.fn().mockImplementation(() => {
          throw new Error('Message queue overflow for conversation conv-1: 100 messages')
        }),
        hasMessages: vi.fn().mockReturnValue(false),
        getQueueLength: vi.fn().mockReturnValue(100),
      }
      
      // Mock the store state to have an active conversation and mock queue
      const storeStates = eventProcessor['storeStates']
      const storeState = storeStates.get(storeId)
      if (storeState) {
        storeState.activeConversations.add('conv-1')
        storeState.messageQueue = mockMessageQueue as any
      }
      
      const userMessage = {
        id: 'msg-1',
        role: 'user',
        message: 'Hello',
        conversationId: 'conv-1',
        createdAt: new Date()
      }
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      subscribeCallback([userMessage])
      
      expect(consoleSpy).toHaveBeenCalledWith(
        `❌ Failed to queue message for conversation conv-1:`,
        expect.any(Error)
      )
      
      // Should commit error message to store
      expect(mockStore.commit).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv-1',
          message: 'Message queue is full. Please wait before sending more messages.',
          role: 'assistant',
          modelId: 'error'
        })
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Error handling and recovery', () => {
    it('should track error counts correctly', () => {
      const storeId = 'test-store'
      
      mockStore.subscribe = vi.fn().mockImplementation(() => {
        throw new Error('Subscription error')
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      const stats = eventProcessor.getProcessingStats()
      const storeStats = stats.get(storeId)
      
      expect(storeStats?.errorCount).toBeGreaterThan(0)
      expect(storeStats?.lastError).toContain('Subscription error')
      
      consoleSpy.mockRestore()
    })

    it('should continue processing events even when one fails', () => {
      const storeId = 'test-store'
      
      const subscribeCallback = vi.fn()
      mockStore.subscribe = vi.fn().mockImplementation((query, options) => {
        subscribeCallback.mockImplementation(options.onUpdate)
        return vi.fn()
      })
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      const records = [
        { id: 'valid', message: 'Valid message', createdAt: new Date() },
        null, // This will cause an error
        { id: 'valid2', message: 'Another valid message', createdAt: new Date() },
      ]
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // Should not throw despite null record
      expect(() => {
        subscribeCallback(records)
      }).not.toThrow()
      
      // Should log valid records
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/📨.*Valid message/)
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/📨.*Another valid message/)
      )
      
      consoleSpy.mockRestore()
    })

    it('should handle store stopping during event processing', () => {
      const storeId = 'test-store'
      
      const subscribeCallback = vi.fn()
      mockStore.subscribe = vi.fn().mockImplementation((query, options) => {
        subscribeCallback.mockImplementation(options.onUpdate)
        return vi.fn()
      })
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      // Get the store state and mark as stopping
      const storeStates = eventProcessor['storeStates']
      const storeState = storeStates.get(storeId)
      if (storeState) {
        storeState.stopping = true
      }
      
      const records = [
        { id: 'test', message: 'Test message', createdAt: new Date() }
      ]
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      subscribeCallback(records)
      
      // Should not process events when stopping
      expect(mockStoreManager.updateActivity).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Resource management edge cases', () => {
    it('should handle flush timer errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Force an error in flush processing by corrupting store state
      const storeStates = eventProcessor['storeStates']
      storeStates.set('corrupted', null as any)
      
      // Trigger flush
      eventProcessor['flushAllBuffers']()
      
      // Should not crash the process
      expect(consoleSpy).not.toHaveBeenCalled() // No errors should be logged for this specific case
      
      consoleSpy.mockRestore()
    })

    it('should provide accurate processing statistics', () => {
      const storeId = 'test-store'
      
      mockStore.subscribe = vi.fn().mockReturnValue(() => {})
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      const stats = eventProcessor.getProcessingStats()
      const storeStats = stats.get(storeId)
      
      expect(storeStats).toBeDefined()
      expect(storeStats?.errorCount).toBe(0)
      expect(storeStats?.bufferSize).toBe(0)
      expect(storeStats?.processing).toBe(false)
      expect(storeStats?.tablesMonitored).toBeGreaterThan(0)
      expect(storeStats?.lastFlushed).toBeDefined()
    })

    it('should handle concurrent stopAll calls', () => {
      const storeId = 'test-store'
      
      mockStore.subscribe = vi.fn().mockReturnValue(() => {})
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      // Call stopAll multiple times concurrently
      expect(() => {
        eventProcessor.stopAll()
        eventProcessor.stopAll()
        eventProcessor.stopAll()
      }).not.toThrow()
    })
  })

  describe('Memory and performance edge cases', () => {
    it('should handle rapid successive events without memory leaks', () => {
      const storeId = 'test-store'
      
      const subscribeCallback = vi.fn()
      mockStore.subscribe = vi.fn().mockImplementation((query, options) => {
        subscribeCallback.mockImplementation(options.onUpdate)
        return vi.fn()
      })
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      // Simulate rapid events
      for (let i = 0; i < 1000; i++) {
        const records = [{
          id: `msg-${i}`,
          message: `Message ${i}`,
          createdAt: new Date(Date.now() + i) // Ensure increasing timestamps
        }]
        
        subscribeCallback(records)
      }
      
      // Should track all events without crashing
      expect(mockStoreManager.updateActivity).toHaveBeenCalledTimes(1000)
    })

    it('should handle buffer overflow gracefully', () => {
      const storeId = 'test-store'
      
      const subscribeCallback = vi.fn()
      mockStore.subscribe = vi.fn().mockImplementation((query, options) => {
        subscribeCallback.mockImplementation(options.onUpdate)
        return vi.fn()
      })
      
      eventProcessor.startMonitoring(storeId, mockStore)
      
      // Fill buffer beyond maxBufferSize (100)
      const largeEventBatch = Array.from({ length: 150 }, (_, i) => ({
        id: `event-${i}`,
        message: `Event ${i}`,
        createdAt: new Date()
      }))
      
      expect(() => {
        subscribeCallback(largeEventBatch)
      }).not.toThrow()
    })
  })
})