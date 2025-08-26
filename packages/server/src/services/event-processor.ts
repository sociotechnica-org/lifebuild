import type { Store as LiveStore } from '@livestore/livestore'
import { queryDb } from '@livestore/livestore'
import type { StoreManager } from './store-manager.js'
import { tables, events } from '@work-squared/shared/schema'
import { AgenticLoop } from './agentic-loop/agentic-loop.js'
import { BraintrustProvider } from './agentic-loop/braintrust-provider.js'
import { DEFAULT_MODEL } from '@work-squared/shared/llm/models'

interface EventBuffer {
  events: any[]
  lastFlushed: Date
  processing: boolean
}

interface StoreProcessingState {
  subscriptions: Array<() => void>
  eventBuffer: EventBuffer
  lastSeenCounts: Map<string, number>
  errorCount: number
  lastError?: Error
  processingQueue: Promise<void>
  stopping: boolean
  // Chat processing state
  activeConversations: Set<string> // Track conversations currently being processed
  llmProvider?: BraintrustProvider
}

export class EventProcessor {
  private storeManager: StoreManager
  private storeStates: Map<string, StoreProcessingState> = new Map()
  private readonly maxBufferSize = 100
  private readonly flushInterval = 5000 // 5 seconds
  private flushTimer?: NodeJS.Timeout

  // LLM configuration from environment
  private braintrustApiKey: string | undefined
  private braintrustProjectId: string | undefined

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

    // Load LLM configuration from environment
    this.braintrustApiKey = process.env.BRAINTRUST_API_KEY
    this.braintrustProjectId = process.env.BRAINTRUST_PROJECT_ID

    if (!this.braintrustApiKey || !this.braintrustProjectId) {
      console.warn(
        '⚠️ LLM functionality disabled: Missing BRAINTRUST_API_KEY or BRAINTRUST_PROJECT_ID environment variables'
      )
    } else {
      console.log('✅ LLM functionality enabled with Braintrust integration')
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
      errorCount: 0,
      processingQueue: Promise.resolve(),
      stopping: false,
      activeConversations: new Set(),
      llmProvider:
        this.braintrustApiKey && this.braintrustProjectId
          ? new BraintrustProvider(this.braintrustApiKey, this.braintrustProjectId)
          : undefined,
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

    const lastCount = storeState.lastSeenCounts.get(tableName) || 0
    const currentCount = records.length

    // Only process if we have new records
    if (currentCount > lastCount) {
      const newRecords = records.slice(lastCount) // Get only the new records (from lastCount onwards)

      for (const record of newRecords) {
        const timestamp = new Date().toISOString()
        const displayText = record.message || record.name || record.title || record.id
        const truncatedText =
          displayText.length > 50 ? `${displayText.slice(0, 50)}...` : displayText

        console.log(`📨 [${timestamp}] ${storeId}/${tableName}: ${truncatedText}`)

        // Handle chat messages for agentic loop processing
        if (tableName === 'chatMessages' && record.role === 'user') {
          this.handleUserMessage(storeId, record, storeState)
        }
      }

      storeState.lastSeenCounts.set(tableName, currentCount)

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
   * Handle a new user message and trigger agentic loop if needed
   */
  private async handleUserMessage(
    storeId: string,
    chatMessage: any,
    storeState: StoreProcessingState
  ): Promise<void> {
    const { conversationId, id: messageId } = chatMessage

    // Skip if LLM is not configured
    if (!storeState.llmProvider) {
      console.log(`⚠️ Skipping chat message processing for ${storeId}: LLM not configured`)
      return
    }

    // Skip if this conversation is already being processed
    if (storeState.activeConversations.has(conversationId)) {
      console.log(`⏸️ Queueing message for conversation ${conversationId} (already processing)`)
      // TODO: Implement message queueing
      return
    }

    console.log(`🤖 Starting agentic loop for user message in conversation ${conversationId}`)

    // Mark conversation as active
    storeState.activeConversations.add(conversationId)

    // Emit response started event
    const store = this.storeManager.getStore(storeId)
    if (store) {
      store.commit(
        events.llmResponseStarted({
          conversationId,
          userMessageId: messageId,
          createdAt: new Date(),
        })
      )
    }

    try {
      await this.runAgenticLoop(storeId, chatMessage, storeState)
    } catch (error) {
      console.error(`❌ Error in agentic loop for conversation ${conversationId}:`, error)

      // Emit error message to conversation
      const store = this.storeManager.getStore(storeId)
      if (store) {
        store.commit(
          events.llmResponseReceived({
            id: crypto.randomUUID(),
            conversationId,
            message: 'Sorry, I encountered an error processing your message. Please try again.',
            role: 'assistant',
            modelId: 'error',
            responseToMessageId: messageId,
            createdAt: new Date(),
            llmMetadata: { source: 'error' },
          })
        )
      }
    } finally {
      // Always remove from active conversations
      storeState.activeConversations.delete(conversationId)
    }
  }

  /**
   * Run the agentic loop for a user message
   */
  private async runAgenticLoop(
    storeId: string,
    userMessage: any,
    storeState: StoreProcessingState
  ): Promise<void> {
    const store = this.storeManager.getStore(storeId)
    if (!store || !storeState.llmProvider) {
      return
    }

    // Get conversation details and worker context
    const conversationQuery = queryDb(
      tables.conversations.select().where('id', '=', userMessage.conversationId)
    )
    const conversations = store.query(conversationQuery)
    const conversation = conversations[0]

    let workerContext: any = undefined
    const boardContext: any = undefined

    // Get worker context if conversation has a workerId
    if (conversation?.workerId) {
      const workerQuery = queryDb(tables.workers.select().where('id', '=', conversation.workerId))
      const workers = store.query(workerQuery)
      const worker = workers[0]

      if (worker) {
        workerContext = {
          systemPrompt: worker.systemPrompt,
          name: worker.name,
          roleDescription: worker.roleDescription,
        }
      }
    }

    // Get conversation history for context
    const historyQuery = queryDb(
      tables.chatMessages
        .select()
        .where('conversationId', '=', userMessage.conversationId)
        .where('createdAt', '<', userMessage.createdAt)
    )
    const _conversationHistory = store.query(historyQuery)

    // Create agentic loop instance
    const agenticLoop = new AgenticLoop(store, storeState.llmProvider, {
      onIterationStart: iteration => {
        console.log(`🔄 Agentic loop iteration ${iteration} started`)
      },
      onToolsExecuting: toolCalls => {
        // Emit tool execution events for UI updates
        for (const toolCall of toolCalls) {
          store.commit(
            events.llmResponseReceived({
              id: crypto.randomUUID(),
              conversationId: userMessage.conversationId,
              message: `🔧 Using ${toolCall.function.name} tool...`,
              role: 'assistant',
              modelId: 'system',
              responseToMessageId: userMessage.id,
              createdAt: new Date(),
              llmMetadata: {
                source: 'tool-execution',
                toolCall: toolCall,
              },
            })
          )
        }
      },
      onFinalMessage: message => {
        // Emit final LLM response
        store.commit(
          events.llmResponseReceived({
            id: crypto.randomUUID(),
            conversationId: userMessage.conversationId,
            message,
            role: 'assistant',
            modelId: conversation?.model || DEFAULT_MODEL,
            responseToMessageId: userMessage.id,
            createdAt: new Date(),
            llmMetadata: { source: 'braintrust' },
          })
        )
      },
      onError: (error, iteration) => {
        console.error(`❌ Agentic loop error at iteration ${iteration}:`, error)
        store.commit(
          events.llmResponseReceived({
            id: crypto.randomUUID(),
            conversationId: userMessage.conversationId,
            message: error.message.includes('Maximum iterations')
              ? error.message
              : 'I encountered an error while processing your request. Please try again.',
            role: 'assistant',
            modelId: 'error',
            responseToMessageId: userMessage.id,
            createdAt: new Date(),
            llmMetadata: {
              source: 'error',
              agenticIteration: iteration,
              errorType: error.message.includes('stuck loop')
                ? 'stuck_loop_detected'
                : 'processing_error',
            },
          })
        )
      },
    })

    // Set conversation history on the agentic loop
    // TODO: Convert conversationHistory to the format expected by ConversationHistory class

    // Run the agentic loop
    await agenticLoop.run(userMessage.message, {
      boardContext,
      workerContext,
      model: conversation?.model || DEFAULT_MODEL,
    })
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
