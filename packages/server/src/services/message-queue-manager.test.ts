import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MessageQueueManager } from './message-queue-manager.js'

describe('MessageQueueManager', () => {
  let manager: MessageQueueManager

  beforeEach(() => {
    manager = new MessageQueueManager()
  })

  afterEach(() => {
    manager.destroy()
  })

  describe('Basic queue operations', () => {
    it('should enqueue and dequeue messages correctly', () => {
      const conversationId = 'conv-1'
      const message = { id: 'msg-1', content: 'Hello' }

      manager.enqueue(conversationId, message)
      expect(manager.hasMessages(conversationId)).toBe(true)
      expect(manager.getQueueLength(conversationId)).toBe(1)

      const dequeued = manager.dequeue(conversationId)
      expect(dequeued).toEqual(message)
      expect(manager.hasMessages(conversationId)).toBe(false)
      expect(manager.getQueueLength(conversationId)).toBe(0)
    })

    it('should handle multiple messages in order', () => {
      const conversationId = 'conv-1'
      const messages = [
        { id: 'msg-1', content: 'First' },
        { id: 'msg-2', content: 'Second' },
        { id: 'msg-3', content: 'Third' },
      ]

      // Enqueue all messages
      messages.forEach(msg => manager.enqueue(conversationId, msg))
      expect(manager.getQueueLength(conversationId)).toBe(3)

      // Dequeue in order
      for (const expectedMessage of messages) {
        const dequeued = manager.dequeue(conversationId)
        expect(dequeued).toEqual(expectedMessage)
      }

      expect(manager.hasMessages(conversationId)).toBe(false)
    })

    it('should handle multiple conversations independently', () => {
      const conv1 = 'conv-1'
      const conv2 = 'conv-2'
      const msg1 = { id: 'msg-1', content: 'Conv1 message' }
      const msg2 = { id: 'msg-2', content: 'Conv2 message' }

      manager.enqueue(conv1, msg1)
      manager.enqueue(conv2, msg2)

      expect(manager.getQueueLength(conv1)).toBe(1)
      expect(manager.getQueueLength(conv2)).toBe(1)

      const dequeued1 = manager.dequeue(conv1)
      expect(dequeued1).toEqual(msg1)
      expect(manager.hasMessages(conv2)).toBe(true)

      const dequeued2 = manager.dequeue(conv2)
      expect(dequeued2).toEqual(msg2)
    })
  })

  describe('Queue limits and overflow', () => {
    it('should throw error when queue size limit is exceeded', () => {
      const conversationId = 'conv-1'
      const message = { id: 'msg', content: 'Test' }

      // Fill queue to the limit (100 messages)
      for (let i = 0; i < 100; i++) {
        manager.enqueue(conversationId, { ...message, id: `msg-${i}` })
      }

      // Next message should throw error
      expect(() => {
        manager.enqueue(conversationId, message)
      }).toThrow('Message queue overflow for conversation conv-1: 100 messages')
    })

    it('should allow enqueueing after dequeue reduces queue size', () => {
      const conversationId = 'conv-1'
      const message = { id: 'msg', content: 'Test' }

      // Fill queue to the limit
      for (let i = 0; i < 100; i++) {
        manager.enqueue(conversationId, { ...message, id: `msg-${i}` })
      }

      // Dequeue one message
      manager.dequeue(conversationId)

      // Should now allow one more message
      expect(() => {
        manager.enqueue(conversationId, message)
      }).not.toThrow()
    })
  })

  describe('Queue cleanup and stale messages', () => {
    it('should clean up stale messages', async () => {
      vi.useFakeTimers()

      const conversationId = 'conv-1'
      const message = { id: 'msg-1', content: 'Test' }

      manager.enqueue(conversationId, message)
      expect(manager.getQueueLength(conversationId)).toBe(1)

      // Fast forward past message timeout (5 minutes)
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000)

      // Trigger cleanup by enqueueing another message
      manager.enqueue(conversationId, { id: 'msg-2', content: 'New' })

      // Old message should be cleaned up, only new one remains
      expect(manager.getQueueLength(conversationId)).toBe(1)

      const dequeued = manager.dequeue(conversationId)
      expect(dequeued.id).toBe('msg-2')

      vi.useRealTimers()
    })

    it('should remove empty queues after cleanup', async () => {
      vi.useFakeTimers()

      const conversationId = 'conv-1'
      const message = { id: 'msg-1', content: 'Test' }

      manager.enqueue(conversationId, message)
      expect(manager.hasMessages(conversationId)).toBe(true)

      // Fast forward past message timeout
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000)

      // Trigger periodic cleanup
      vi.advanceTimersByTime(60 * 1000)

      // Queue should be completely removed
      expect(manager.hasMessages(conversationId)).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('Statistics and monitoring', () => {
    it('should provide accurate queue statistics', () => {
      const conv1 = 'conv-1'
      const conv2 = 'conv-2'

      // Add messages to first conversation
      manager.enqueue(conv1, { id: 'msg-1' })
      manager.enqueue(conv1, { id: 'msg-2' })
      manager.enqueue(conv1, { id: 'msg-3' })

      // Add messages to second conversation
      manager.enqueue(conv2, { id: 'msg-4' })

      const stats = manager.getStats()
      expect(stats.totalConversations).toBe(2)
      expect(stats.totalMessages).toBe(4)
      expect(stats.averageQueueLength).toBe(2) // 4 messages / 2 conversations
      expect(stats.maxQueueLength).toBe(3)

      expect(manager.getTotalQueuedMessages()).toBe(4)
    })

    it('should handle empty queues in statistics', () => {
      const stats = manager.getStats()
      expect(stats.totalConversations).toBe(0)
      expect(stats.totalMessages).toBe(0)
      expect(stats.averageQueueLength).toBe(0)
      expect(stats.maxQueueLength).toBe(0)

      expect(manager.getTotalQueuedMessages()).toBe(0)
    })
  })

  describe('Queue management', () => {
    it('should clear specific conversation queue', () => {
      const conv1 = 'conv-1'
      const conv2 = 'conv-2'

      manager.enqueue(conv1, { id: 'msg-1' })
      manager.enqueue(conv2, { id: 'msg-2' })

      expect(manager.hasMessages(conv1)).toBe(true)
      expect(manager.hasMessages(conv2)).toBe(true)

      manager.clearQueue(conv1)

      expect(manager.hasMessages(conv1)).toBe(false)
      expect(manager.hasMessages(conv2)).toBe(true)
    })

    it('should handle dequeue from empty queue', () => {
      const result = manager.dequeue('non-existent')
      expect(result).toBeNull()
    })

    it('should handle operations on non-existent queues gracefully', () => {
      expect(manager.hasMessages('non-existent')).toBe(false)
      expect(manager.getQueueLength('non-existent')).toBe(0)
      expect(() => manager.clearQueue('non-existent')).not.toThrow()
    })
  })

  describe('Cleanup and destruction', () => {
    it('should clear all queues when destroyed', () => {
      const conv1 = 'conv-1'
      const conv2 = 'conv-2'

      manager.enqueue(conv1, { id: 'msg-1' })
      manager.enqueue(conv2, { id: 'msg-2' })

      expect(manager.getTotalQueuedMessages()).toBe(2)

      manager.destroy()

      expect(manager.getTotalQueuedMessages()).toBe(0)
      expect(manager.hasMessages(conv1)).toBe(false)
      expect(manager.hasMessages(conv2)).toBe(false)
    })
  })
})
