import type { Store as LiveStore } from '@livestore/livestore'
import { queryDb } from '@livestore/livestore'
import type { StoreManager } from './store-manager.js'
import { tables, events } from '@work-squared/shared/schema'
import { AgenticLoop } from './agentic-loop/agentic-loop.js'
import { BraintrustProvider } from './agentic-loop/braintrust-provider.js'
import { DEFAULT_MODEL } from '@work-squared/shared/llm/models'
import { MessageQueueManager } from './message-queue-manager.js'
import { AsyncQueueProcessor } from './async-queue-processor.js'
import { QueryOptimizer, QueryPatterns } from './query-optimizer.js'
import { ResourceMonitor } from './resource-monitor.js'
import type {
  EventBuffer,
  ProcessedEvent,
  ChatMessage,
  Conversation,
  Worker,
  LLMMessage,
  BoardContext,
  WorkerContext,
} from './agentic-loop/types.js'

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
  messageQueue: MessageQueueManager // Queue of pending messages per conversation
  conversationProcessors: Map<string, AsyncQueueProcessor> // Per-conversation async processors
  llmProvider?: BraintrustProvider
  queryOptimizer: QueryOptimizer // Query optimization and caching
  queryPatterns: QueryPatterns // Common query patterns
  resourceMonitor: ResourceMonitor // Resource monitoring and limits
}

export class EventProcessor {
  private storeManager: StoreManager
  private storeStates: Map<string, StoreProcessingState> = new Map()
  private readonly maxBufferSize = 100
  private readonly flushInterval = 5000 // 5 seconds
  private flushTimer?: NodeJS.Timeout
  private globalResourceMonitor: ResourceMonitor

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

    // Initialize global resource monitor
    this.globalResourceMonitor = new ResourceMonitor(
      {
        maxConcurrentLLMCalls: parseInt(process.env.MAX_CONCURRENT_LLM_CALLS || '10'),
        maxQueuedMessages: parseInt(process.env.MAX_QUEUED_MESSAGES || '1000'),
        maxConversationsPerStore: parseInt(process.env.MAX_CONVERSATIONS_PER_STORE || '100'),
        messageRateLimit: parseInt(process.env.MESSAGE_RATE_LIMIT || '600'),
        llmCallTimeout: parseInt(process.env.LLM_CALL_TIMEOUT || '30000'),
      },
      alert => {
        console.warn(`🚨 Resource Alert [${alert.type}]: ${alert.message}`)
      }
    )

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
      messageQueue: new MessageQueueManager(),
      conversationProcessors: new Map(),
      llmProvider:
        this.braintrustApiKey && this.braintrustProjectId
          ? new BraintrustProvider(this.braintrustApiKey, this.braintrustProjectId)
          : undefined,
      queryOptimizer: new QueryOptimizer(store, {
        batchTimeout: 5, // 5ms batch window for real-time feel
        defaultCacheTTL: 30000, // 30 seconds default cache
        maxCacheSize: 500, // Reasonable cache size per store
      }),
      queryPatterns: undefined as any, // Will be initialized below
      resourceMonitor: new ResourceMonitor({
        maxConversationsPerStore: 50, // Per-store limit
        maxQueuedMessages: 200, // Per-store limit
      }),
    }

    // Initialize query patterns with the same optimizer for consistency
    storeState.queryPatterns = new QueryPatterns(storeState.queryOptimizer)

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
    records: unknown[],
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
        // Type guard to ensure record is an object with properties
        if (!record || typeof record !== 'object') {
          continue
        }

        const recordObj = record as Record<string, any>
        const timestamp = new Date().toISOString()
        const displayText =
          recordObj.message || recordObj.name || recordObj.title || recordObj.id || 'Unknown'
        const truncatedText =
          displayText.length > 50 ? `${displayText.slice(0, 50)}...` : displayText

        console.log(`📨 [${timestamp}] ${storeId}/${tableName}: ${truncatedText}`)

        // Handle chat messages for agentic loop processing
        if (tableName === 'chatMessages' && recordObj.role === 'user') {
          this.handleUserMessage(storeId, recordObj as ChatMessage, storeState)
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

  private bufferEvents(
    storeId: string,
    events: ProcessedEvent[],
    storeState: StoreProcessingState
  ): void {
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
    events: ProcessedEvent[],
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
    _event: ProcessedEvent,
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
    chatMessage: ChatMessage,
    storeState: StoreProcessingState
  ): Promise<void> {
    const { conversationId, id: messageId } = chatMessage

    // Skip if LLM is not configured
    if (!storeState.llmProvider) {
      console.log(`⚠️ Skipping chat message processing for ${storeId}: LLM not configured`)
      return
    }

    // Check resource limits before processing
    if (!this.globalResourceMonitor.canMakeLLMCall()) {
      console.warn(
        `🚨 Rejecting LLM call for conversation ${conversationId}: Resource limits exceeded`
      )
      const store = this.storeManager.getStore(storeId)
      if (store) {
        store.commit(
          events.llmResponseReceived({
            id: crypto.randomUUID(),
            conversationId,
            message: 'System is currently under high load. Please try again in a moment.',
            role: 'assistant',
            modelId: 'resource-limit',
            responseToMessageId: messageId,
            createdAt: new Date(),
            llmMetadata: { source: 'resource-limit-exceeded' },
          })
        )
      }
      return
    }

    // Check if we can queue more messages
    if (!this.globalResourceMonitor.canQueueMessage()) {
      console.warn(`🚨 Message rate limit exceeded for conversation ${conversationId}`)
      return
    }

    // Track the message
    this.globalResourceMonitor.trackMessage()
    storeState.resourceMonitor.trackMessage()

    // Skip if this conversation is already being processed - queue the message instead
    if (storeState.activeConversations.has(conversationId)) {
      console.log(`⏸️ Queueing message for conversation ${conversationId} (already processing)`)

      try {
        storeState.messageQueue.enqueue(conversationId, chatMessage)
        console.log(
          `📥 Message queued for conversation ${conversationId}. Queue length: ${storeState.messageQueue.getQueueLength(conversationId)}`
        )
      } catch (error) {
        console.error(`❌ Failed to queue message for conversation ${conversationId}:`, error)
        // Emit error to conversation if queue is full
        const store = this.storeManager.getStore(storeId)
        if (store) {
          store.commit(
            events.llmResponseReceived({
              id: crypto.randomUUID(),
              conversationId,
              message: 'Message queue is full. Please wait before sending more messages.',
              role: 'assistant',
              modelId: 'error',
              responseToMessageId: messageId,
              createdAt: new Date(),
              llmMetadata: { source: 'queue-overflow-error' },
            })
          )
        }
      }
      return
    }

    console.log(`🤖 Starting agentic loop for user message in conversation ${conversationId}`)

    // Check conversation limits per store
    if (storeState.activeConversations.size >= 50) {
      console.warn(`🚨 Too many active conversations in store ${storeId}`)
      return
    }

    // Mark conversation as active
    storeState.activeConversations.add(conversationId)

    // Track LLM call start
    const llmCallId = this.globalResourceMonitor.trackLLMCallStart()

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
      const startTime = Date.now()
      await this.runAgenticLoop(storeId, chatMessage, storeState)
      const responseTime = Date.now() - startTime

      // Track successful completion
      this.globalResourceMonitor.trackLLMCallComplete(llmCallId, false, responseTime)
    } catch (error) {
      // Track error
      this.globalResourceMonitor.trackError(`LLM call failed: ${error}`)
      this.globalResourceMonitor.trackLLMCallComplete(llmCallId, false)
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

      // Process any queued messages for this conversation
      await this.processQueuedMessages(storeId, conversationId, storeState)
    }
  }

  /**
   * Run the agentic loop for a user message
   */
  private async runAgenticLoop(
    storeId: string,
    userMessage: ChatMessage,
    storeState: StoreProcessingState
  ): Promise<void> {
    const store = this.storeManager.getStore(storeId)
    if (!store || !storeState.llmProvider) {
      return
    }

    // Get conversation details, worker context, and history in optimized batch
    const { conversation, worker, chatHistory } =
      await storeState.queryPatterns.getConversationWithContext(userMessage.conversationId, tables)

    let workerContext: WorkerContext | undefined = undefined
    const boardContext: BoardContext | undefined = undefined

    // Set worker context if worker data is available
    if (worker) {
      workerContext = {
        systemPrompt: worker.systemPrompt,
        name: worker.name,
        roleDescription: worker.roleDescription,
      }
    }

    // Convert chat messages to conversation history format
    const conversationHistory: LLMMessage[] = (chatHistory as ChatMessage[]).map(msg => ({
      role: msg.role,
      content: msg.message || '',
      tool_calls: msg.llmMetadata?.toolCalls,
      tool_call_id: msg.llmMetadata?.tool_call_id,
    }))

    // Create agentic loop instance with conversation history
    const agenticLoop = new AgenticLoop(
      store,
      storeState.llmProvider,
      {
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
      },
      conversationHistory
    )

    // Conversation history is now set in the AgenticLoop constructor

    // Run the agentic loop
    await agenticLoop.run(userMessage.message, {
      boardContext,
      workerContext,
      model: conversation?.model || DEFAULT_MODEL,
    })
  }

  /**
   * Process any queued messages for a conversation
   */
  private async processQueuedMessages(
    storeId: string,
    conversationId: string,
    storeState: StoreProcessingState
  ): Promise<void> {
    // Process all queued messages sequentially using async queue processor
    while (storeState.messageQueue.hasMessages(conversationId)) {
      const nextMessage = storeState.messageQueue.dequeue(conversationId)

      if (!nextMessage) {
        break
      }

      console.log(
        `📤 Processing queued message for conversation ${conversationId}. Remaining: ${storeState.messageQueue.getQueueLength(conversationId)}`
      )

      // Get or create async processor for this conversation
      let processor = storeState.conversationProcessors.get(conversationId)
      if (!processor) {
        processor = new AsyncQueueProcessor()
        storeState.conversationProcessors.set(conversationId, processor)
      }

      try {
        // Queue the message processing task for sequential execution
        await processor.enqueue(`msg-${nextMessage.id}`, async () => {
          await this.handleUserMessage(storeId, nextMessage, storeState)
        })
      } catch (error) {
        console.error(
          `❌ Error processing queued message for conversation ${conversationId}:`,
          error
        )

        // Emit error to conversation
        const store = this.storeManager.getStore(storeId)
        if (store) {
          store.commit(
            events.llmResponseReceived({
              id: crypto.randomUUID(),
              conversationId,
              message: 'Error processing queued message. Please try again.',
              role: 'assistant',
              modelId: 'error',
              responseToMessageId: nextMessage.id,
              createdAt: new Date(),
              llmMetadata: { source: 'queue-processing-error' },
            })
          )
        }
      }
    }

    // Clean up processor if no more messages
    if (!storeState.messageQueue.hasMessages(conversationId)) {
      const processor = storeState.conversationProcessors.get(conversationId)
      if (processor && !processor.isProcessing()) {
        processor.destroy()
        storeState.conversationProcessors.delete(conversationId)
      }
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
      // Cleanup message queue manager
      storeState.messageQueue.destroy()

      // Cleanup all conversation processors
      for (const processor of storeState.conversationProcessors.values()) {
        processor.destroy()
      }
      storeState.conversationProcessors.clear()

      // Cleanup query optimizer and resource monitor
      storeState.queryOptimizer.destroy()
      storeState.resourceMonitor.destroy()

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

    // Cleanup global resource monitor
    this.globalResourceMonitor.destroy()

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
      activeConversations: number
      queuedMessages: number
      resourceMetrics: any
      cacheStats: any
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
        activeConversations: storeState.activeConversations.size,
        queuedMessages: storeState.messageQueue.getTotalQueuedMessages(),
        resourceMetrics: storeState.resourceMonitor.getCurrentMetrics(),
        cacheStats: storeState.queryOptimizer.getCacheStats(),
      })
    }

    return stats
  }

  /**
   * Get comprehensive resource report across all stores
   */
  getResourceReport(): {
    global: any
    perStore: Map<string, any>
    systemHealth: 'healthy' | 'stressed' | 'critical'
  } {
    const globalReport = this.globalResourceMonitor.getResourceReport()
    const perStoreReports = new Map()

    for (const [storeId, storeState] of this.storeStates) {
      perStoreReports.set(storeId, storeState.resourceMonitor.getResourceReport())
    }

    // Determine overall system health
    const isUnderStress = this.globalResourceMonitor.isSystemUnderStress()
    const hasCriticalAlerts = globalReport.alerts.some(alert => alert.type === 'critical')

    let systemHealth: 'healthy' | 'stressed' | 'critical' = 'healthy'
    if (hasCriticalAlerts) {
      systemHealth = 'critical'
    } else if (isUnderStress) {
      systemHealth = 'stressed'
    }

    return {
      global: globalReport,
      perStore: perStoreReports,
      systemHealth,
    }
  }
}
