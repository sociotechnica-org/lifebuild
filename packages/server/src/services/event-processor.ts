import type { Store as LiveStore } from '@livestore/livestore'
import { queryDb } from '@livestore/livestore'
import type { StoreManager } from './store-manager.js'
import { tables, events } from '@work-squared/shared/schema'
import { BraintrustProvider } from './agentic-loop/braintrust-provider.js'
import { ConversationHistory } from './agentic-loop/conversation-history.js'
import { InputValidator } from './agentic-loop/input-validator.js'

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
  private llmProvider?: BraintrustProvider
  private inputValidator: InputValidator
  private conversationHistories: Map<string, ConversationHistory> = new Map()

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
    this.inputValidator = new InputValidator()
    this.initializeLLMProvider()
    this.startFlushTimer()
  }

  private initializeLLMProvider(): void {
    const apiKey = process.env.BRAINTRUST_API_KEY
    const projectId = process.env.BRAINTRUST_PROJECT_ID

    if (apiKey && projectId) {
      this.llmProvider = new BraintrustProvider(apiKey, projectId, this.inputValidator)
      console.log('✅ Braintrust LLM provider initialized')
    } else {
      console.warn(
        '⚠️ Braintrust API credentials not configured. LLM features will be unavailable.'
      )
      console.warn('   Set BRAINTRUST_API_KEY and BRAINTRUST_PROJECT_ID environment variables.')
    }
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

    const currentCount = records.length
    const lastSeenCount = storeState.lastSeenCounts.get(tableName) || 0

    // For non-chat tables, use count-based deduplication to avoid reprocessing all records
    if (tableName !== 'chatMessages') {
      if (currentCount <= lastSeenCount) {
        return // No new records, skip processing
      }
    }

    const newRecords = []

    for (const record of records) {
      let shouldProcess = true

      // For chat messages, use ID-based deduplication to prevent infinite loops
      if (tableName === 'chatMessages' && record.id) {
        if (storeState.processedMessageIds.has(record.id)) {
          shouldProcess = false // Skip already processed message
        } else {
          storeState.processedMessageIds.add(record.id)
          // Memory management: limit the Set size to prevent memory leaks
          if (storeState.processedMessageIds.size > 10000) {
            console.warn(
              `⚠️ Processed message IDs approaching limit for store ${storeId}. Clearing old entries.`
            )
            // Keep only the most recent 5000 IDs (rough cleanup)
            const idsArray = Array.from(storeState.processedMessageIds)
            storeState.processedMessageIds.clear()
            idsArray.slice(-5000).forEach(id => storeState.processedMessageIds.add(id))
          }
        }
      }

      if (shouldProcess) {
        const timestamp = new Date().toISOString()
        const displayText = record.message || record.name || record.title || record.id
        const truncatedText =
          displayText.length > 50 ? `${displayText.slice(0, 50)}...` : displayText

        console.log(`📨 [${timestamp}] ${storeId}/${tableName}: ${truncatedText}`)

        // Handle user messages for test responses (only genuine user messages)
        if (tableName === 'chatMessages' && record.role === 'user') {
          this.handleUserMessage(storeId, record, storeState)
        }

        newRecords.push(record)
      }
    }

    // Update the seen count for all tables to track new records
    storeState.lastSeenCounts.set(tableName, currentCount)

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
   * Handle user messages and emit LLM responses for messages starting with "server:"
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
      const userMessage = message.substring(7).trim() // Remove "server:" prefix

      // Process with LLM if provider is available
      if (this.llmProvider) {
        console.log(`🤖 Processing with LLM for conversation ${conversationId}`)
        this.processWithLLM(storeId, conversationId, messageId, userMessage)
      } else {
        console.log(
          `🤖 Emitting echo response for conversation ${conversationId} (no LLM configured)`
        )
        // Fallback to echo response if LLM not configured
        this.emitEchoResponse(storeId, conversationId, messageId, userMessage)
      }
    }
  }

  private async processWithLLM(
    storeId: string,
    conversationId: string,
    messageId: string,
    userMessage: string
  ): Promise<void> {
    try {
      // Get or create conversation history for this conversation
      const historyKey = `${storeId}-${conversationId}`
      let history = this.conversationHistories.get(historyKey)
      if (!history) {
        history = new ConversationHistory()
        this.conversationHistories.set(historyKey, history)

        // Memory management: limit conversation histories
        if (this.conversationHistories.size > 100) {
          console.warn('⚠️ Conversation histories approaching limit. Clearing oldest entries.')
          const entries = Array.from(this.conversationHistories.entries())
          // Remove oldest 20 entries
          entries.slice(0, 20).forEach(([key]) => this.conversationHistories.delete(key))
        }
      }

      // Add user message to history
      history.addUserMessage(userMessage)

      // Get messages for LLM call
      const messages = history.getMessages()

      // Call LLM with retry logic
      const startTime = Date.now()
      const response = await this.llmProvider!.call(messages)
      const duration = Date.now() - startTime

      console.log(`✅ LLM response received for conversation ${conversationId} in ${duration}ms`)

      // Add assistant response to history
      if (response.message) {
        history.addAssistantMessage(response.message, response.toolCalls || undefined)

        // Emit LLM response to LiveStore
        setTimeout(() => {
          const storeState = this.storeStates.get(storeId)
          if (storeState?.stopping) {
            return
          }

          const store = this.storeManager.getStore(storeId)
          if (store) {
            try {
              store.commit(
                events.llmResponseReceived({
                  id: crypto.randomUUID(),
                  conversationId,
                  message: response.message || '',
                  role: 'assistant',
                  modelId: response.modelUsed,
                  responseToMessageId: messageId,
                  createdAt: new Date(),
                  llmMetadata: {
                    source: 'server-llm',
                    duration,
                  },
                })
              )
            } catch (error) {
              console.error(
                `❌ Failed to emit LLM response for conversation ${conversationId}:`,
                error
              )
              this.incrementErrorCount(storeId, error as Error)
            }
          }
        }, 0)
      }
    } catch (error) {
      console.error(`❌ LLM processing failed for conversation ${conversationId}:`, error)
      this.incrementErrorCount(storeId, error as Error)

      // Emit error message to user
      this.emitErrorResponse(
        storeId,
        conversationId,
        messageId,
        'Sorry, I encountered an error processing your request. Please try again.'
      )
    }
  }

  private emitEchoResponse(
    storeId: string,
    conversationId: string,
    messageId: string,
    message: string
  ): void {
    setTimeout(() => {
      const storeState = this.storeStates.get(storeId)
      if (storeState?.stopping) {
        return
      }

      const store = this.storeManager.getStore(storeId)
      if (store) {
        try {
          store.commit(
            events.llmResponseReceived({
              id: crypto.randomUUID(),
              conversationId,
              message: `Echo: ${message}`,
              role: 'assistant',
              modelId: 'test-echo',
              responseToMessageId: messageId,
              createdAt: new Date(),
              llmMetadata: { source: 'server-test-echo' },
            })
          )
        } catch (error) {
          console.error(
            `❌ Failed to emit echo response for conversation ${conversationId}:`,
            error
          )
          this.incrementErrorCount(storeId, error as Error)
        }
      }
    }, 0)
  }

  private emitErrorResponse(
    storeId: string,
    conversationId: string,
    messageId: string,
    errorMessage: string
  ): void {
    setTimeout(() => {
      const storeState = this.storeStates.get(storeId)
      if (storeState?.stopping) {
        return
      }

      const store = this.storeManager.getStore(storeId)
      if (store) {
        try {
          store.commit(
            events.llmResponseReceived({
              id: crypto.randomUUID(),
              conversationId,
              message: errorMessage,
              role: 'assistant',
              modelId: 'error-handler',
              responseToMessageId: messageId,
              createdAt: new Date(),
              llmMetadata: { source: 'server-error' },
            })
          )
        } catch (error) {
          console.error(
            `❌ Failed to emit error response for conversation ${conversationId}:`,
            error
          )
          this.incrementErrorCount(storeId, error as Error)
        }
      }
    }, 0)
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
