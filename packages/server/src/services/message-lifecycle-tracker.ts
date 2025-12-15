/**
 * MessageLifecycleTracker - Tracks messages through processing stages for debugging
 *
 * This service maintains an in-memory ring buffer of recent message lifecycles,
 * allowing operators to trace individual messages through the system.
 */

import { logger } from '../utils/logger.js'

export type MessageStage =
  | 'received'
  | 'buffered'
  | 'dedupe_checked'
  | 'queued'
  | 'processing_started'
  | 'iteration'
  | 'completed'
  | 'error'

export interface IterationInfo {
  number: number
  timestamp: Date
  hadToolCalls: boolean
  toolNames?: string[]
  durationMs: number
}

export interface MessageLifecycle {
  messageId: string
  storeId: string
  conversationId: string
  correlationId: string
  createdAt: Date
  stages: {
    received?: { timestamp: Date }
    buffered?: { timestamp: Date; bufferSize: number }
    dedupe_checked?: { timestamp: Date; wasDuplicate: boolean; reason?: string }
    queued?: { timestamp: Date; queuePosition: number }
    processing_started?: { timestamp: Date }
    iterations: IterationInfo[]
    completed?: { timestamp: Date; responseMessageId?: string; totalIterations: number }
    error?: { timestamp: Date; message: string; code?: string; stack?: string }
  }
  currentStage: MessageStage
  lastUpdated: Date
}

export interface NonResponseDiagnosis {
  messageId: string
  storeId: string
  conversationId: string
  reason: NonResponseReason
  details: Record<string, unknown>
  diagnosedAt: Date
}

export type NonResponseReason =
  | 'message_too_old'
  | 'already_processed'
  | 'queued_waiting'
  | 'rate_limited'
  | 'store_disconnected'
  | 'llm_disabled'
  | 'processing_in_progress'
  | 'stuck_in_loop'
  | 'error_occurred'
  | 'unknown'

interface RingBufferConfig {
  maxSize: number
  ttlMs: number
}

/**
 * Generate a correlation ID for tracing a message through the system
 */
export function generateCorrelationId(messageId: string): string {
  return `msg_${messageId}_${Date.now()}`
}

export class MessageLifecycleTracker {
  private lifecycles: Map<string, MessageLifecycle> = new Map()
  private insertionOrder: string[] = [] // Track order for ring buffer behavior
  private config: RingBufferConfig
  private cleanupTimer?: NodeJS.Timeout

  constructor(config?: Partial<RingBufferConfig>) {
    this.config = {
      maxSize: parseInt(process.env.DEBUG_MESSAGE_HISTORY_SIZE || '100', 10),
      ttlMs: parseInt(process.env.DEBUG_MESSAGE_TTL_MS || '300000', 10), // 5 minutes default
      ...config,
    }

    // Start periodic cleanup
    this.cleanupTimer = setInterval(() => this.cleanup(), 60_000) // Every minute
    logger.info(
      { maxSize: this.config.maxSize, ttlMs: this.config.ttlMs },
      'MessageLifecycleTracker initialized'
    )
  }

  /**
   * Start tracking a new message
   */
  startTracking(
    messageId: string,
    storeId: string,
    conversationId: string
  ): { lifecycle: MessageLifecycle; correlationId: string } {
    const correlationId = generateCorrelationId(messageId)

    const lifecycle: MessageLifecycle = {
      messageId,
      storeId,
      conversationId,
      correlationId,
      createdAt: new Date(),
      stages: {
        received: { timestamp: new Date() },
        iterations: [],
      },
      currentStage: 'received',
      lastUpdated: new Date(),
    }

    this.addLifecycle(messageId, lifecycle)

    logger.debug(
      { correlationId, messageId, storeId, conversationId },
      'Started tracking message lifecycle'
    )

    return { lifecycle, correlationId }
  }

  /**
   * Record that message was buffered
   */
  recordBuffered(messageId: string, bufferSize: number): void {
    const lifecycle = this.lifecycles.get(messageId)
    if (!lifecycle) return

    lifecycle.stages.buffered = {
      timestamp: new Date(),
      bufferSize,
    }
    lifecycle.currentStage = 'buffered'
    lifecycle.lastUpdated = new Date()
  }

  /**
   * Record dedupe check result
   */
  recordDedupeChecked(messageId: string, wasDuplicate: boolean, reason?: string): void {
    const lifecycle = this.lifecycles.get(messageId)
    if (!lifecycle) return

    lifecycle.stages.dedupe_checked = {
      timestamp: new Date(),
      wasDuplicate,
      reason,
    }
    lifecycle.currentStage = 'dedupe_checked'
    lifecycle.lastUpdated = new Date()
  }

  /**
   * Record that message was queued
   */
  recordQueued(messageId: string, queuePosition: number): void {
    const lifecycle = this.lifecycles.get(messageId)
    if (!lifecycle) return

    lifecycle.stages.queued = {
      timestamp: new Date(),
      queuePosition,
    }
    lifecycle.currentStage = 'queued'
    lifecycle.lastUpdated = new Date()
  }

  /**
   * Record processing started
   */
  recordProcessingStarted(messageId: string): void {
    const lifecycle = this.lifecycles.get(messageId)
    if (!lifecycle) return

    lifecycle.stages.processing_started = {
      timestamp: new Date(),
    }
    lifecycle.currentStage = 'processing_started'
    lifecycle.lastUpdated = new Date()
  }

  /**
   * Record an agentic loop iteration
   */
  recordIteration(
    messageId: string,
    iterationNumber: number,
    hadToolCalls: boolean,
    toolNames?: string[],
    durationMs?: number
  ): void {
    const lifecycle = this.lifecycles.get(messageId)
    if (!lifecycle) return

    lifecycle.stages.iterations.push({
      number: iterationNumber,
      timestamp: new Date(),
      hadToolCalls,
      toolNames,
      durationMs: durationMs || 0,
    })
    lifecycle.currentStage = 'iteration'
    lifecycle.lastUpdated = new Date()
  }

  /**
   * Record successful completion
   */
  recordCompleted(messageId: string, responseMessageId?: string): void {
    const lifecycle = this.lifecycles.get(messageId)
    if (!lifecycle) return

    lifecycle.stages.completed = {
      timestamp: new Date(),
      responseMessageId,
      totalIterations: lifecycle.stages.iterations.length,
    }
    lifecycle.currentStage = 'completed'
    lifecycle.lastUpdated = new Date()

    logger.debug(
      {
        correlationId: lifecycle.correlationId,
        messageId,
        totalIterations: lifecycle.stages.iterations.length,
        elapsedMs: Date.now() - lifecycle.createdAt.getTime(),
      },
      'Message processing completed'
    )
  }

  /**
   * Record an error
   */
  recordError(messageId: string, error: Error | string, code?: string): void {
    const lifecycle = this.lifecycles.get(messageId)
    if (!lifecycle) return

    const errorMessage = typeof error === 'string' ? error : error.message
    const errorStack = typeof error === 'string' ? undefined : error.stack

    lifecycle.stages.error = {
      timestamp: new Date(),
      message: errorMessage,
      code,
      stack: errorStack,
    }
    lifecycle.currentStage = 'error'
    lifecycle.lastUpdated = new Date()

    logger.debug(
      {
        correlationId: lifecycle.correlationId,
        messageId,
        error: errorMessage,
        code,
      },
      'Message processing error recorded'
    )
  }

  /**
   * Get lifecycle for a specific message
   */
  getLifecycle(messageId: string): MessageLifecycle | undefined {
    return this.lifecycles.get(messageId)
  }

  /**
   * Get correlation ID for a message
   */
  getCorrelationId(messageId: string): string | undefined {
    return this.lifecycles.get(messageId)?.correlationId
  }

  /**
   * Get all recent lifecycles
   */
  getAllLifecycles(): MessageLifecycle[] {
    return Array.from(this.lifecycles.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )
  }

  /**
   * Get lifecycles for a specific store
   */
  getLifecyclesByStore(storeId: string): MessageLifecycle[] {
    return this.getAllLifecycles().filter(l => l.storeId === storeId)
  }

  /**
   * Get lifecycles in a specific stage
   */
  getLifecyclesByStage(stage: MessageStage): MessageLifecycle[] {
    return this.getAllLifecycles().filter(l => l.currentStage === stage)
  }

  /**
   * Get messages currently in progress (not completed or errored)
   */
  getInProgressLifecycles(): MessageLifecycle[] {
    return this.getAllLifecycles().filter(
      l => l.currentStage !== 'completed' && l.currentStage !== 'error'
    )
  }

  /**
   * Calculate elapsed time for a message
   */
  getElapsedMs(messageId: string): number | undefined {
    const lifecycle = this.lifecycles.get(messageId)
    if (!lifecycle) return undefined
    return Date.now() - lifecycle.createdAt.getTime()
  }

  /**
   * Get summary statistics
   */
  getStats(): {
    total: number
    byStage: Record<MessageStage, number>
    avgProcessingTimeMs: number | null
    oldestMessageAge: number | null
  } {
    const lifecycles = this.getAllLifecycles()

    const byStage: Record<MessageStage, number> = {
      received: 0,
      buffered: 0,
      dedupe_checked: 0,
      queued: 0,
      processing_started: 0,
      iteration: 0,
      completed: 0,
      error: 0,
    }

    let totalProcessingTime = 0
    let completedCount = 0

    for (const lifecycle of lifecycles) {
      byStage[lifecycle.currentStage]++

      if (lifecycle.stages.completed && lifecycle.stages.received) {
        const processingTime =
          lifecycle.stages.completed.timestamp.getTime() -
          lifecycle.stages.received.timestamp.getTime()
        totalProcessingTime += processingTime
        completedCount++
      }
    }

    const oldestLifecycle = lifecycles[lifecycles.length - 1]

    return {
      total: lifecycles.length,
      byStage,
      avgProcessingTimeMs:
        completedCount > 0 ? Math.round(totalProcessingTime / completedCount) : null,
      oldestMessageAge: oldestLifecycle ? Date.now() - oldestLifecycle.createdAt.getTime() : null,
    }
  }

  /**
   * Add a lifecycle to the ring buffer
   */
  private addLifecycle(messageId: string, lifecycle: MessageLifecycle): void {
    // If message already exists, update it instead
    if (this.lifecycles.has(messageId)) {
      this.lifecycles.set(messageId, lifecycle)
      return
    }

    // Enforce ring buffer size limit
    while (this.insertionOrder.length >= this.config.maxSize) {
      const oldestId = this.insertionOrder.shift()
      if (oldestId) {
        this.lifecycles.delete(oldestId)
      }
    }

    this.lifecycles.set(messageId, lifecycle)
    this.insertionOrder.push(messageId)
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const expiredIds: string[] = []

    for (const [messageId, lifecycle] of this.lifecycles) {
      const age = now - lifecycle.lastUpdated.getTime()
      if (age > this.config.ttlMs) {
        expiredIds.push(messageId)
      }
    }

    for (const messageId of expiredIds) {
      this.lifecycles.delete(messageId)
      const index = this.insertionOrder.indexOf(messageId)
      if (index !== -1) {
        this.insertionOrder.splice(index, 1)
      }
    }

    if (expiredIds.length > 0) {
      logger.debug({ expiredCount: expiredIds.length }, 'Cleaned up expired message lifecycles')
    }
  }

  /**
   * Destroy the tracker and clean up resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
    this.lifecycles.clear()
    this.insertionOrder = []
  }
}

// Singleton instance for global access
let globalTracker: MessageLifecycleTracker | null = null

export function getMessageLifecycleTracker(): MessageLifecycleTracker {
  if (!globalTracker) {
    globalTracker = new MessageLifecycleTracker()
  }
  return globalTracker
}

export function destroyMessageLifecycleTracker(): void {
  if (globalTracker) {
    globalTracker.destroy()
    globalTracker = null
  }
}
