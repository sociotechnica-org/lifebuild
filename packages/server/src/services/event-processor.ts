import type { Store as LiveStore } from '@livestore/livestore'
import { queryDb } from '@livestore/livestore'
import type { StoreManager } from './store-manager.js'
import { tables, events } from '@work-squared/shared/schema'

interface EventBuffer {
  events: any[]
  lastFlushed: Date
  processing: boolean
}

interface StoreProcessingState {
  subscriptions: Array<() => void>
  eventBuffer: EventBuffer
  lastSeenCounts: Map<string, number>
  processedMessageIds: Set<string> // Track processed message IDs to prevent duplicates
  errorCount: number
  lastError?: Error
  processingQueue: Promise<void>
  stopping: boolean
}

export class EventProcessor {
  private storeManager: StoreManager
  private storeStates: Map<string, StoreProcessingState> = new Map()
  private readonly maxBufferSize = 100
  private readonly flushInterval = 5000 // 5 seconds
  private flushTimer?: NodeJS.Timeout

  // Tables to monitor for activity
  private readonly monitoredTables = [
    'chatMessages',
    'tasks',
    'projects',
    'conversations',
    'documents',
    'workers',
    'comments',
    'recurringTasks',
    'contacts',
  ] as const

  constructor(storeManager: StoreManager) {
    this.storeManager = storeManager
    this.startFlushTimer()
  }

  startMonitoring(storeId: string, store: LiveStore): void {
    console.log(`📡 Starting comprehensive event monitoring for store ${storeId}`)

    const existingState = this.storeStates.get(storeId)
    if (existingState) {
      if (existingState.stopping) {
        console.warn(`⚠️ Store ${storeId} is currently stopping, cannot start monitoring`)
      } else {
        console.warn(`⚠️ Store ${storeId} is already being monitored`)
      }
      return
    }

    // Initialize processing state for this store
    const storeState: StoreProcessingState = {
      subscriptions: [],
      eventBuffer: {
        events: [],
        lastFlushed: new Date(),
        processing: false,
      },
      lastSeenCounts: new Map(),
      processedMessageIds: new Set(),
      errorCount: 0,
      processingQueue: Promise.resolve(),
      stopping: false,
    }

    this.storeStates.set(storeId, storeState)

    // Monitor all important tables
    for (const tableName of this.monitoredTables) {
      this.setupTableSubscription(storeId, store, tableName, storeState)
    }
  }

  private setupTableSubscription(
    storeId: string,
    store: LiveStore,
    tableName: string,
    storeState: StoreProcessingState
  ): void {
    try {
      let query: any

      // Handle each table specifically to avoid TypeScript issues
      switch (tableName) {
        case 'chatMessages':
          query = queryDb(tables.chatMessages.select(), {
            label: `monitor-${tableName}-${storeId}`,
          })
          break
        case 'tasks':
          query = queryDb(tables.tasks.select(), {
            label: `monitor-${tableName}-${storeId}`,
          })
          break
        case 'projects':
          query = queryDb(tables.boards.select(), {
            // Note: projects table is named 'boards' in schema
            label: `monitor-${tableName}-${storeId}`,
          })
          break
        case 'conversations':
          query = queryDb(tables.conversations.select(), {
            label: `monitor-${tableName}-${storeId}`,
          })
          break
        case 'documents':
          query = queryDb(tables.documents.select(), {
            label: `monitor-${tableName}-${storeId}`,
          })
          break
        case 'workers':
          query = queryDb(tables.workers.select(), {
            label: `monitor-${tableName}-${storeId}`,
          })
          break
        case 'comments':
          query = queryDb(tables.comments.select(), {
            label: `monitor-${tableName}-${storeId}`,
          })
          break
        case 'recurringTasks':
          query = queryDb(tables.recurringTasks.select(), {
            label: `monitor-${tableName}-${storeId}`,
          })
          break
        case 'contacts':
          query = queryDb(tables.contacts.select(), {
            label: `monitor-${tableName}-${storeId}`,
          })
          break
        default:
          console.warn(`⚠️ Unknown table ${tableName} for store ${storeId}`)
          return
      }

      const unsubscribe = store.subscribe(query as any, {
        onUpdate: (records: any[]) => {
          this.handleTableUpdate(storeId, tableName, records, storeState)
        },
      })

      storeState.subscriptions.push(unsubscribe)
      console.log(`✅ Subscribed to ${tableName} for store ${storeId}`)
    } catch (error) {
      console.error(`❌ Failed to subscribe to ${tableName} for store ${storeId}:`, error)
      this.incrementErrorCount(storeId, error as Error)
    }
  }

  private handleTableUpdate(
    storeId: string,
    tableName: string,
    records: any[],
    storeState: StoreProcessingState
  ): void {
    // Skip processing if store is stopping
    if (storeState.stopping) {
      return
    }

    const newRecords = []

    for (const record of records) {
      // For chat messages, use ID to prevent duplicate processing
      if (tableName === 'chatMessages' && record.id) {
        if (storeState.processedMessageIds.has(record.id)) {
          continue // Skip already processed message
        }
        storeState.processedMessageIds.add(record.id)
      }

      const timestamp = new Date().toISOString()
      const displayText = record.message || record.name || record.title || record.id
      const truncatedText = displayText.length > 50 ? `${displayText.slice(0, 50)}...` : displayText

      console.log(`📨 [${timestamp}] ${storeId}/${tableName}: ${truncatedText}`)

      // Handle user messages for test responses (only genuine user messages)
      if (tableName === 'chatMessages' && record.role === 'user') {
        this.handleUserMessage(storeId, record, storeState)
      }

      newRecords.push(record)
    }

    // Only update activity and buffer events if we had new records
    if (newRecords.length > 0) {
      // Update activity tracker
      this.storeManager.updateActivity(storeId)

      // Buffer events for processing
      this.bufferEvents(
        storeId,
        newRecords.map(r => ({
          type: tableName,
          storeId,
          data: r,
          timestamp: new Date(),
        })),
        storeState
      )
    }
  }

  private bufferEvents(storeId: string, events: any[], storeState: StoreProcessingState): void {
    storeState.eventBuffer.events.push(...events)

    // If buffer is full or processing is idle, trigger processing
    if (
      storeState.eventBuffer.events.length >= this.maxBufferSize ||
      !storeState.eventBuffer.processing
    ) {
      this.scheduleEventProcessing(storeId, storeState)
    }
  }

  private scheduleEventProcessing(
    storeId: string,
    storeState: StoreProcessingState
  ): Promise<void> {
    // Chain processing to ensure serialization per store
    storeState.processingQueue = storeState.processingQueue.then(async () => {
      await this.processBufferedEvents(storeId, storeState)
    })
    return storeState.processingQueue
  }

  private async processBufferedEvents(
    storeId: string,
    storeState: StoreProcessingState
  ): Promise<void> {
    if (
      storeState.eventBuffer.processing ||
      storeState.eventBuffer.events.length === 0 ||
      storeState.stopping
    ) {
      return
    }

    storeState.eventBuffer.processing = true
    const events = [...storeState.eventBuffer.events]
    storeState.eventBuffer.events = []
    storeState.eventBuffer.lastFlushed = new Date()

    try {
      await this.handleEvents(storeId, events, storeState)
    } catch (error) {
      console.error(`❌ Error processing buffered events for store ${storeId}:`, error)
      this.incrementErrorCount(storeId, error as Error)
    } finally {
      storeState.eventBuffer.processing = false
    }
  }

  private async handleEvents(
    storeId: string,
    events: any[],
    storeState: StoreProcessingState
  ): Promise<void> {
    for (const event of events) {
      try {
        await this.processEvent(storeId, event, storeState)
      } catch (error) {
        console.error(`❌ Error processing event in store ${storeId}:`, error)
        this.incrementErrorCount(storeId, error as Error)

        // Continue processing other events even if one fails (isolation)
        continue
      }
    }
  }

  private async processEvent(
    _storeId: string,
    _event: any,
    _storeState: StoreProcessingState
  ): Promise<void> {
    // Future: Implement specific event processing logic here
    // For now, events are logged in handleTableUpdate
  }

  /**
   * Handle user messages and emit test responses for messages starting with "server:"
   */
  private handleUserMessage(
    storeId: string,
    chatMessage: any,
    _storeState: StoreProcessingState
  ): void {
    const { conversationId, id: messageId, message } = chatMessage

    // Validate required fields
    if (!conversationId || !messageId) {
      console.warn(`⚠️ Invalid chat message: missing conversationId or messageId`, {
        conversationId,
        messageId,
        storeId,
      })
      return
    }

    // Format message content for logging
    const messagePreview = message
      ? message.length > 100
        ? `${message.slice(0, 100)}...`
        : message
      : '<no message content>'

    console.log(`📨 received user message in conversation ${conversationId}: ${messagePreview}`)

    // Only process messages starting with "server:" for testing
    if (message && message.startsWith('server:')) {
      const testMessage = message.substring(7).trim() // Remove "server:" prefix

      console.log(`🤖 Emitting test response for conversation ${conversationId}`)

      // Use setTimeout to avoid LiveStore race condition (GitHub issue #577)
      // This is the officially recommended workaround for committing from within subscriptions
      setTimeout(() => {
        const store = this.storeManager.getStore(storeId)
        if (store) {
          try {
            store.commit(
              events.llmResponseReceived({
                id: crypto.randomUUID(),
                conversationId,
                message: `Echo: ${testMessage}`,
                role: 'assistant',
                modelId: 'test-echo',
                responseToMessageId: messageId,
                createdAt: new Date(),
                llmMetadata: { source: 'server-test-echo' },
              })
            )
          } catch (error) {
            console.error(
              `❌ Failed to emit test response for conversation ${conversationId}:`,
              error
            )
            this.incrementErrorCount(storeId, error as Error)
          }
        } else {
          console.warn(`⚠️ Store ${storeId} not found for test response emission`)
        }
      }, 0)
    }
  }

  private incrementErrorCount(storeId: string, error: Error): void {
    const storeState = this.storeStates.get(storeId)
    if (storeState) {
      storeState.errorCount++
      storeState.lastError = error
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushAllBuffers()
    }, this.flushInterval)
  }

  private async flushAllBuffers(): Promise<void> {
    const flushPromises: Promise<void>[] = []

    for (const [storeId, storeState] of this.storeStates.entries()) {
      const timeSinceFlush = Date.now() - storeState.eventBuffer.lastFlushed.getTime()

      if (
        timeSinceFlush > this.flushInterval &&
        storeState.eventBuffer.events.length > 0 &&
        !storeState.eventBuffer.processing
      ) {
        flushPromises.push(this.scheduleEventProcessing(storeId, storeState))
      }
    }

    await Promise.allSettled(flushPromises)
  }

  stopMonitoring(storeId: string): void {
    const storeState = this.storeStates.get(storeId)
    if (!storeState) {
      console.warn(`⚠️ Store ${storeId} is not being monitored`)
      return
    }

    // Mark as stopping immediately to prevent race conditions
    storeState.stopping = true

    // Unsubscribe from all table subscriptions
    for (const unsubscribe of storeState.subscriptions) {
      try {
        unsubscribe()
      } catch (error) {
        console.error(`⚠️ Error unsubscribing from store ${storeId}:`, error)
      }
    }

    // Wait for processing to complete before removing state
    storeState.processingQueue.finally(() => {
      // Clear processed message IDs to free memory
      storeState.processedMessageIds.clear()
      this.storeStates.delete(storeId)
      console.log(`🛑 Stopped event monitoring for store ${storeId}`)
    })
  }

  stopAll(): void {
    const storeIds = Array.from(this.storeStates.keys())

    for (const storeId of storeIds) {
      this.stopMonitoring(storeId)
    }

    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }

    console.log('🛑 Stopped all event monitoring')
  }

  getProcessingStats(): Map<
    string,
    {
      errorCount: number
      lastError?: string
      bufferSize: number
      processing: boolean
      lastFlushed: string
      tablesMonitored: number
    }
  > {
    const stats = new Map()

    for (const [storeId, storeState] of this.storeStates) {
      stats.set(storeId, {
        errorCount: storeState.errorCount,
        lastError: storeState.lastError?.message,
        bufferSize: storeState.eventBuffer.events.length,
        processing: storeState.eventBuffer.processing,
        lastFlushed: storeState.eventBuffer.lastFlushed.toISOString(),
        tablesMonitored: storeState.subscriptions.length,
      })
    }

    return stats
  }
}
