interface QueuedMessage {
  message: any
  timestamp: number
}

export class MessageQueueManager {
  private queues = new Map<string, QueuedMessage[]>()
  private readonly maxQueueSize = 100
  private readonly messageTimeout = 5 * 60 * 1000 // 5 minutes
  private readonly cleanupInterval = 60 * 1000 // 1 minute
  private cleanupTimer?: NodeJS.Timeout

  constructor() {
    this.startCleanupTimer()
  }

  /**
   * Add a message to the queue for a conversation
   */
  enqueue(conversationId: string, message: any): void {
    const queue = this.queues.get(conversationId) || []
    this.queues.set(conversationId, queue)

    // Clean stale messages first, then check size limit
    this.cleanStaleMessages(conversationId)
    const cleanedQueue = this.queues.get(conversationId) || []

    // Check queue size limit after cleanup
    if (cleanedQueue.length >= this.maxQueueSize) {
      throw new Error(
        `Message queue overflow for conversation ${conversationId}: ${cleanedQueue.length} messages`
      )
    }

    // Add message with timestamp
    cleanedQueue.push({
      message,
      timestamp: Date.now(),
    })

    this.queues.set(conversationId, cleanedQueue)
  }

  /**
   * Get the next message from the queue
   */
  dequeue(conversationId: string): any | null {
    const queue = this.queues.get(conversationId)
    if (!queue || queue.length === 0) {
      return null
    }

    const queuedMessage = queue.shift()

    // Remove empty queue
    if (queue.length === 0) {
      this.queues.delete(conversationId)
    }

    return queuedMessage?.message || null
  }

  /**
   * Check if a conversation has queued messages
   */
  hasMessages(conversationId: string): boolean {
    const queue = this.queues.get(conversationId)
    return queue ? queue.length > 0 : false
  }

  /**
   * Get the number of queued messages for a conversation
   */
  getQueueLength(conversationId: string): number {
    const queue = this.queues.get(conversationId)
    return queue ? queue.length : 0
  }

  /**
   * Clear all messages for a conversation
   */
  clearQueue(conversationId: string): void {
    this.queues.delete(conversationId)
  }

  /**
   * Get total number of queued messages across all conversations
   */
  getTotalQueuedMessages(): number {
    let total = 0
    for (const queue of this.queues.values()) {
      total += queue.length
    }
    return total
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    totalConversations: number
    totalMessages: number
    averageQueueLength: number
    maxQueueLength: number
  } {
    const totalConversations = this.queues.size
    let totalMessages = 0
    let maxQueueLength = 0

    for (const queue of this.queues.values()) {
      totalMessages += queue.length
      maxQueueLength = Math.max(maxQueueLength, queue.length)
    }

    return {
      totalConversations,
      totalMessages,
      averageQueueLength: totalConversations > 0 ? totalMessages / totalConversations : 0,
      maxQueueLength,
    }
  }

  /**
   * Clean up stale messages for a specific conversation
   */
  private cleanStaleMessages(conversationId: string): void {
    const queue = this.queues.get(conversationId)
    if (!queue) return

    const now = Date.now()
    const freshMessages = queue.filter(
      queuedMessage => now - queuedMessage.timestamp < this.messageTimeout
    )

    if (freshMessages.length !== queue.length) {
      const staleCount = queue.length - freshMessages.length
      console.warn(`🧹 Cleaned ${staleCount} stale messages from conversation ${conversationId}`)

      if (freshMessages.length === 0) {
        this.queues.delete(conversationId)
      } else {
        this.queues.set(conversationId, freshMessages)
      }
    }
  }

  /**
   * Start periodic cleanup of stale messages
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupAllStaleMessages()
    }, this.cleanupInterval)
  }

  /**
   * Clean up stale messages across all conversations
   */
  private cleanupAllStaleMessages(): void {
    const conversationIds = Array.from(this.queues.keys())
    let totalCleaned = 0

    for (const conversationId of conversationIds) {
      const queue = this.queues.get(conversationId)
      if (!queue) continue

      const originalLength = queue.length
      this.cleanStaleMessages(conversationId)
      const newLength = this.queues.get(conversationId)?.length || 0
      totalCleaned += originalLength - newLength
    }

    if (totalCleaned > 0) {
      console.log(
        `🧹 Periodic cleanup: removed ${totalCleaned} stale messages from ${conversationIds.length} conversations`
      )
    }
  }

  /**
   * Stop the cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }

    // Clear all queues
    this.queues.clear()
  }
}
