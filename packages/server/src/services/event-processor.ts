import type { Store as LiveStore } from '@livestore/livestore'
import { queryDb } from '@livestore/livestore'
import type { StoreManager } from './store-manager.js'
import { tables, events } from '@work-squared/shared/schema'
import { AgenticLoop } from './agentic-loop/agentic-loop.js'
import { BraintrustProvider } from './agentic-loop/braintrust-provider.js'
import { DEFAULT_MODEL } from '@work-squared/shared'
import { MessageQueueManager } from './message-queue-manager.js'
import { AsyncQueueProcessor } from './async-queue-processor.js'
import { ProcessedMessageTracker } from './processed-message-tracker.js'
import { logger, storeLogger, createContextLogger } from '../utils/logger.js'
import type {
  EventBuffer,
  ProcessedEvent,
  ChatMessage,
  LLMMessage,
  BoardContext,
  WorkerContext,
} from './agentic-loop/types.js'

const toTimestamp = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? null : time
  }

  if (typeof value === 'string') {
    const date = new Date(value)
    const time = date.getTime()
    return Number.isNaN(time) ? null : time
  }

  return null
}

const toIsoString = (timestamp: number | null): string | null => {
  if (timestamp === null || !Number.isFinite(timestamp)) {
    return null
  }

  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

interface StoreProcessingState {
  subscriptions: Array<() => void>
  eventBuffer: EventBuffer
  errorCount: number
  lastError?: Error
  processingQueue: Promise<void>
  stopping: boolean
  // Chat processing state
  activeConversations: Set<string> // Track conversations currently being processed
  messageQueue: MessageQueueManager // Queue of pending messages per conversation
  conversationProcessors: Map<string, AsyncQueueProcessor> // Per-conversation async processors
  llmProvider?: BraintrustProvider
}

interface LiveStoreStats {
  chatMessages: number
  userMessages: number
  assistantMessages: number
  processedUserMessages: number
  pendingUserMessages: number
  conversations: number
  lastMessageAt: string | null
  lastUserMessageAt: string | null
  lastAssistantMessageAt: string | null
}

type LiveStoreStatsEntry = LiveStoreStats | { error: string }

interface LiveStoreStatsResult {
  perStore: Map<string, LiveStoreStatsEntry>
  totals: LiveStoreStats
}

export class EventProcessor {
  private storeManager: StoreManager
  private storeStates: Map<string, StoreProcessingState> = new Map()
  private readonly maxBufferSize = 100
  private readonly flushInterval = 5000 // 5 seconds
  private flushTimer?: NodeJS.Timeout
  private processedTracker: ProcessedMessageTracker
  private databaseInitialized = false

  // LLM configuration from environment
  private braintrustApiKey: string | undefined
  private braintrustProjectId: string | undefined

  // Cutoff timestamp - messages before this are marked as processed but skipped
  private messageCutoffTimestamp: Date | null

  private readonly maxConcurrentLLMCalls: number
  private readonly maxQueuedMessages: number
  private readonly messageRateLimit: number
  private readonly llmCallTimeoutMs: number
  private readonly messageRateWindowMs = 60_000

  private activeLLMCalls = 0
  private llmCallsInFlight = new Set<string>()
  private llmCallTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private messageTimestamps: number[] = []
  private errorTimestamps: number[] = []
  private responseTimes: number[] = []

  // Tables to monitor for activity
  // IMPORTANT: Only monitor chatMessages to process user messages
  // Monitoring other tables is unnecessary and causes performance issues
  private readonly monitoredTables = ['chatMessages'] as const

  constructor(storeManager: StoreManager) {
    this.storeManager = storeManager
    this.processedTracker = new ProcessedMessageTracker()
    this.startFlushTimer()

    const parsePositiveInt = (
      value: string | undefined,
      fallback: number,
      allowZero = false
    ): number => {
      if (!value) return fallback
      const parsed = Number.parseInt(value, 10)
      if (!Number.isFinite(parsed)) {
        return fallback
      }
      if (parsed > 0) {
        return parsed
      }
      if (allowZero && parsed === 0) {
        return 0
      }
      return fallback
    }

    this.maxConcurrentLLMCalls = parsePositiveInt(process.env.MAX_CONCURRENT_LLM_CALLS, 10, true)
    this.maxQueuedMessages = parsePositiveInt(process.env.MAX_QUEUED_MESSAGES, 0, true)
    this.messageRateLimit = parsePositiveInt(process.env.MESSAGE_RATE_LIMIT, 0, true)
    this.llmCallTimeoutMs = parsePositiveInt(process.env.LLM_CALL_TIMEOUT, 30_000, true)

    // Load LLM configuration from environment
    this.braintrustApiKey = process.env.BRAINTRUST_API_KEY
    this.braintrustProjectId = process.env.BRAINTRUST_PROJECT_ID

    if (!this.braintrustApiKey || !this.braintrustProjectId) {
      logger.warn(
        'LLM functionality disabled: Missing BRAINTRUST_API_KEY or BRAINTRUST_PROJECT_ID environment variables'
      )
    } else {
      logger.info('LLM functionality enabled with Braintrust integration')
    }

    // Load message cutoff timestamp from environment
    const cutoffEnv = process.env.MESSAGE_PROCESSING_CUTOFF_TIMESTAMP
    this.messageCutoffTimestamp = cutoffEnv ? new Date(cutoffEnv) : null
    if (this.messageCutoffTimestamp) {
      logger.info(
        { cutoffTimestamp: this.messageCutoffTimestamp.toISOString() },
        'Message processing cutoff configured'
      )
    }

    // Initialize processed message tracking
    this.processedTracker
      .initialize()
      .then(() => {
        this.databaseInitialized = true
        logger.info('Processed message tracking initialized')
      })
      .catch(error => {
        logger.error(
          { error },
          'CRITICAL: Failed to initialize processed message tracker, stopping all message processing'
        )
        this.databaseInitialized = false
      })
  }

  async startMonitoring(storeId: string, store: LiveStore): Promise<void> {
    storeLogger(storeId).info('Starting comprehensive event monitoring')

    const existingState = this.storeStates.get(storeId)
    if (existingState) {
      if (existingState.stopping) {
        storeLogger(storeId).warn('Store is currently stopping, cannot start monitoring')
      } else {
        storeLogger(storeId).warn('Store is already being monitored')
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
    }

    this.storeStates.set(storeId, storeState)

    storeLogger(storeId).debug('Using persistent message tracking')

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
      // We only monitor chatMessages now for processing user messages
      if (tableName !== 'chatMessages') {
        logger.warn(`Unexpected table ${tableName} - only chatMessages should be monitored`)
        return
      }

      // Subscribe to chatMessages table with recent filter to reduce volume
      // Still get all matching records on each update, but limit scope to reduce load
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const query = queryDb(tables.chatMessages.select().where('createdAt', '>=', oneHourAgo), {
        label: `monitor-${tableName}-${storeId}`,
      })

      const unsubscribe = store.subscribe(query as any, {
        onUpdate: (records: any[]) => {
          this.handleTableUpdate(storeId, tableName, records, storeState)
        },
      })

      storeState.subscriptions.push(unsubscribe)
      storeLogger(storeId).debug({ tableName }, 'Subscribed to table')
    } catch (error) {
      storeLogger(storeId).error({ error, tableName }, `Failed to subscribe to ${tableName}`)
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

    // Update activity tracker
    this.storeManager.updateActivity(storeId)

    // Only handle chatMessages table (our focus)
    if (tableName !== 'chatMessages') {
      return
    }

    // Filter for user messages only
    const userRecords = records.filter(
      (record: any) => record && typeof record === 'object' && record.role === 'user'
    )

    if (userRecords.length === 0) {
      return
    }

    const log = createContextLogger({ storeId, operation: 'buffer_messages' })
    log.debug({ messageCount: userRecords.length }, 'Buffering user messages for processing')

    // Convert records to ProcessedEvent objects for buffering
    const events: ProcessedEvent[] = userRecords.map((record: any) => ({
      type: 'chatMessage',
      storeId,
      data: record,
      timestamp: new Date(),
    }))

    // Buffer events for async processing (uses existing event pipeline)
    this.bufferEvents(storeId, events, storeState)
  }

  private async processChatMessage(
    storeId: string,
    message: ChatMessage,
    storeState: StoreProcessingState
  ): Promise<void> {
    const messagePreview =
      message.message?.slice(0, 50) + (message.message?.length > 50 ? '...' : '')
    const log = createContextLogger({
      messageId: message.id,
      conversationId: message.conversationId,
    })
    log.debug({ messagePreview }, 'Processing chat message')

    // CRITICAL: If database is not initialized, stop all processing to prevent infinite loops
    if (!this.databaseInitialized) {
      logger.error(
        { messageId: message.id },
        `CRITICAL: Database not initialized - SKIPPING message to prevent duplicate processing. Fix database initialization issue and restart server`
      )
      return
    }

    try {
      // Check if already processed using SQLite
      const isAlreadyProcessed = await this.processedTracker.isProcessed(message.id, storeId)

      if (isAlreadyProcessed) {
        log.debug('Message already processed, skipping LLM call')
        return
      }

      // Check if message is before cutoff timestamp
      if (this.messageCutoffTimestamp && message.createdAt) {
        const messageDate = new Date(message.createdAt)
        if (messageDate < this.messageCutoffTimestamp) {
          logger.info(
            { messageId: message.id, messageDate: messageDate.toISOString() },
            `Message before cutoff - no LLM call`
          )
          // Mark as processed in SQLite but don't actually process it
          await this.processedTracker.markProcessed(message.id, storeId)
          return
        }
      }

      // Attempt to claim processing rights atomically
      const claimedProcessing = await this.processedTracker.markProcessed(message.id, storeId)

      if (!claimedProcessing) {
        logger.info(
          { messageId: message.id },
          `Another instance claimed processing for message - no LLM call`
        )
        return
      }

      log.info('Sending LLM call for message processing')

      // Defer processing to avoid committing during reactive update cycle
      setImmediate(() => {
        this.handleUserMessage(storeId, message, storeState)
      })
    } catch (error) {
      logger.error(
        { error, messageId: message.id },
        `CRITICAL: Database operation failed - SKIPPING message to prevent infinite loops`
      )
      // DO NOT process the message - this could cause infinite loops if DB is broken
      return
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
      storeLogger(storeId).error({ error }, `Error processing buffered events`)
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
        storeLogger(storeId).error({ error, event: event.type }, `Error processing event`)
        this.incrementErrorCount(storeId, error as Error)

        // Continue processing other events even if one fails (isolation)
        continue
      }
    }
  }

  private async processEvent(
    storeId: string,
    event: ProcessedEvent,
    storeState: StoreProcessingState
  ): Promise<void> {
    // Handle different event types
    if (event.type === 'chatMessage') {
      // Extract ChatMessage data from the event
      const chatMessage = event.data as ChatMessage

      // Process using our existing chat message logic (with SQLite deduplication)
      await this.processChatMessage(storeId, chatMessage, storeState)
    } else {
      // Log unhandled event types for future extension
      storeLogger(storeId).debug({ eventType: event.type }, `Unhandled event type`)
    }
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
      storeLogger(storeId).debug(`Skipping chat message processing: LLM not configured`)
      return
    }

    // Check resource limits before processing
    if (!this.canStartLLMCall()) {
      logger.warn({ conversationId, storeId }, `Rejecting LLM call: Resource limits exceeded`)
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
    const queueCheck = this.canAcceptIncomingMessage()
    if (!queueCheck.allowed) {
      logger.warn({ conversationId, reason: queueCheck.reason }, `Message intake limited`)
      return
    }

    // Track the message
    this.recordIncomingMessage()

    // Skip if this conversation is already being processed - queue the message instead
    if (storeState.activeConversations.has(conversationId)) {
      logger.debug({ conversationId }, `Queueing message (already processing)`)

      try {
        storeState.messageQueue.enqueue(conversationId, chatMessage)
        logger.debug(
          { conversationId, queueLength: storeState.messageQueue.getQueueLength(conversationId) },
          `Message queued`
        )
      } catch (error) {
        logger.error({ error, conversationId }, `Failed to queue message`)
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

    logger.info({ conversationId }, `Starting agentic loop for user message`)

    // Check conversation limits per store
    if (storeState.activeConversations.size >= 50) {
      storeLogger(storeId).warn(`Too many active conversations`)
      return
    }

    // Mark conversation as active
    storeState.activeConversations.add(conversationId)

    // Track LLM call start
    const llmCallId = this.beginLLMCall()

    // Emit response started event (safe now that we defer processing)
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

    let llmCallCompleted = false
    let completionEventEmitted = false
    try {
      const startTime = Date.now()
      completionEventEmitted = await this.runAgenticLoop(storeId, chatMessage, storeState)
      const responseTime = Date.now() - startTime

      // Track successful completion
      this.endLLMCall(llmCallId, false, responseTime)
      llmCallCompleted = true
    } catch (error) {
      // Track error and ensure LLM call is properly cleaned up
      this.recordError()
      if (!llmCallCompleted) {
        this.endLLMCall(llmCallId, true) // Mark as timeout/error
      }
      logger.error({ error, conversationId }, `Error in agentic loop`)

      // Emit error message to conversation
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

        if (!completionEventEmitted) {
          store.commit(
            events.llmResponseCompleted({
              conversationId,
              userMessageId: messageId,
              createdAt: new Date(),
              iterations: 0,
              success: false,
            })
          )
          completionEventEmitted = true
        }
      }
    } finally {
      // Ensure LLM call is always cleaned up
      if (!llmCallCompleted) {
        this.endLLMCall(llmCallId, true)
      }

      // Always remove from active conversations
      storeState.activeConversations.delete(conversationId)
    }

    if (!completionEventEmitted && store) {
      store.commit(
        events.llmResponseCompleted({
          conversationId,
          userMessageId: messageId,
          createdAt: new Date(),
          iterations: 0,
          success: llmCallCompleted,
        })
      )
      completionEventEmitted = true
    }

    // Process any queued messages for this conversation (outside try/catch to avoid recursion)
    await this.processQueuedMessages(storeId, conversationId, storeState)
  }

  /**
   * Process a single queued message without recursive queue processing
   */
  private async processQueuedMessage(
    storeId: string,
    chatMessage: ChatMessage,
    storeState: StoreProcessingState
  ): Promise<void> {
    const conversationId = chatMessage.conversationId
    const messageId = chatMessage.id

    logger.info({ conversationId }, `Processing queued message`)

    // Check conversation limits per store
    if (storeState.activeConversations.size >= 50) {
      storeLogger(storeId).warn(`Too many active conversations`)
      return
    }

    // Mark conversation as active
    storeState.activeConversations.add(conversationId)

    // Track LLM call start
    const llmCallId = this.beginLLMCall()

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

    let llmCallCompleted = false
    let completionEventEmitted = false
    try {
      const startTime = Date.now()
      completionEventEmitted = await this.runAgenticLoop(storeId, chatMessage, storeState)
      const responseTime = Date.now() - startTime

      // Track successful completion
      this.endLLMCall(llmCallId, false, responseTime)
      llmCallCompleted = true
    } catch (error) {
      // Track error and ensure LLM call is properly cleaned up
      this.recordError()
      if (!llmCallCompleted) {
        this.endLLMCall(llmCallId, true) // Mark as timeout/error
      }
      logger.error({ error, conversationId }, `Error in agentic loop`)

      // Emit error message to conversation
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

        if (!completionEventEmitted) {
          store.commit(
            events.llmResponseCompleted({
              conversationId,
              userMessageId: messageId,
              createdAt: new Date(),
              iterations: 0,
              success: false,
            })
          )
          completionEventEmitted = true
        }
      }
    } finally {
      // Ensure LLM call is always cleaned up
      if (!llmCallCompleted) {
        this.endLLMCall(llmCallId, true)
      }

      // Always remove from active conversations
      storeState.activeConversations.delete(conversationId)
    }

    // NOTE: Deliberately NOT calling processQueuedMessages here to avoid recursion

    if (!completionEventEmitted && store) {
      store.commit(
        events.llmResponseCompleted({
          conversationId,
          userMessageId: messageId,
          createdAt: new Date(),
          iterations: 0,
          success: llmCallCompleted,
        })
      )
    }
  }

  /**
   * Run the agentic loop for a user message
   */
  private async runAgenticLoop(
    storeId: string,
    userMessage: ChatMessage,
    storeState: StoreProcessingState
  ): Promise<boolean> {
    const store = this.storeManager.getStore(storeId)
    if (!store) {
      return false
    }

    if (!storeState.llmProvider) {
      return false
    }

    // Get conversation details, worker context, and history
    let conversation: any, worker: any, chatHistory: ChatMessage[]
    try {
      // Get conversation
      const conversationResult = store.query(
        queryDb(tables.conversations.select().where('id', '=', userMessage.conversationId))
      )
      conversation = conversationResult[0]

      // Get worker if conversation has workerId
      if (conversation?.workerId) {
        const workerResult = store.query(
          queryDb(tables.workers.select().where('id', '=', conversation.workerId))
        )
        worker = workerResult[0]
      }

      // Get chat history
      chatHistory = store.query(
        queryDb(
          tables.chatMessages
            .select()
            .where('conversationId', '=', userMessage.conversationId)
            .orderBy('createdAt', 'asc')
        )
      )
    } catch (error) {
      logger.error({ error }, `Error querying conversation context`)
      // If we can't get the context due to store issues, bail out gracefully
      store.commit(
        events.llmResponseReceived({
          id: crypto.randomUUID(),
          conversationId: userMessage.conversationId,
          message: 'I had trouble loading the conversation context. Please try again.',
          role: 'assistant',
          modelId: 'error',
          responseToMessageId: userMessage.id,
          createdAt: new Date(),
          llmMetadata: { source: 'context-load-error' },
        })
      )

      store.commit(
        events.llmResponseCompleted({
          conversationId: userMessage.conversationId,
          userMessageId: userMessage.id,
          createdAt: new Date(),
          iterations: 0,
          success: false,
        })
      )

      return true
    }

    let workerContext: WorkerContext | undefined = undefined
    const boardContext: BoardContext | undefined = undefined

    // Set worker context if worker data is available
    if (worker) {
      workerContext = {
        systemPrompt: worker.systemPrompt,
        name: worker.name,
        roleDescription: worker.roleDescription || undefined,
      }
    }

    // Convert chat messages to conversation history format and sanitize tool calls.
    // The conversation history intentionally excludes the live user message because the agentic
    // loop appends it before contacting the provider.
    const conversationHistory = this.buildConversationHistory(chatHistory, userMessage)

    let completionEmitted = false

    // Create agentic loop instance with conversation history
    const agenticLoop = new AgenticLoop(
      store,
      storeState.llmProvider,
      {
        onIterationStart: iteration => {
          logger.debug({ iteration }, `Agentic loop iteration started`)
        },
        onIterationComplete: (iteration, response) => {
          // Only send the LLM's message if there are tool calls
          // If there are no tool calls, onFinalMessage will handle it
          if (
            response.message &&
            response.message.trim() &&
            response.toolCalls &&
            response.toolCalls.length > 0
          ) {
            logger.debug(
              { iteration, reasoning: response.message.substring(0, 100) },
              `Iteration LLM reasoning`
            )
            store.commit(
              events.llmResponseReceived({
                id: crypto.randomUUID(),
                conversationId: userMessage.conversationId,
                message: response.message,
                role: 'assistant',
                modelId: conversation?.model || DEFAULT_MODEL,
                responseToMessageId: userMessage.id,
                createdAt: new Date(),
                llmMetadata: {
                  source: 'braintrust',
                  iteration,
                  hasToolCalls: true,
                  messageType: 'reasoning',
                },
              })
            )
          }
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
        onToolsComplete: toolMessages => {
          // Send formatted tool results to the frontend
          for (const toolMessage of toolMessages) {
            store.commit(
              events.llmResponseReceived({
                id: crypto.randomUUID(),
                conversationId: userMessage.conversationId,
                message: toolMessage.content, // This is already formatted by ToolResultFormatterService
                role: 'assistant',
                modelId: 'system',
                responseToMessageId: userMessage.id,
                createdAt: new Date(),
                llmMetadata: {
                  source: 'tool-result',
                  toolCallId: toolMessage.tool_call_id,
                },
              })
            )
          }
        },
        onFinalMessage: message => {
          // Emit final LLM response
          logger.info({ response: message.substring(0, 100) }, `Final LLM response`)
          store.commit(
            events.llmResponseReceived({
              id: crypto.randomUUID(),
              conversationId: userMessage.conversationId,
              message,
              role: 'assistant',
              modelId: conversation?.model || DEFAULT_MODEL,
              responseToMessageId: userMessage.id,
              createdAt: new Date(),
              llmMetadata: {
                source: 'braintrust',
                messageType: 'final',
              },
            })
          )
        },
        onError: (error, iteration) => {
          logger.error({ error, iteration }, `Agentic loop error`)
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

          // Send completion event indicating failure
          store.commit(
            events.llmResponseCompleted({
              conversationId: userMessage.conversationId,
              userMessageId: userMessage.id,
              createdAt: new Date(),
              iterations: iteration,
              success: false,
            })
          )
          completionEmitted = true
        },
        onComplete: iterations => {
          // Send completion event to indicate the agentic loop has finished
          logger.info({ iterations }, `Agentic loop completed`)
          store.commit(
            events.llmResponseCompleted({
              conversationId: userMessage.conversationId,
              userMessageId: userMessage.id,
              createdAt: new Date(),
              iterations,
              success: true,
            })
          )
          completionEmitted = true
        },
      },
      conversationHistory
    )

    // Conversation history is now set in the AgenticLoop constructor

    // Run the agentic loop
    await agenticLoop.run(userMessage.message, {
      boardContext,
      workerContext,
      workerId: worker?.id,
      model: conversation?.model || DEFAULT_MODEL,
    })

    return completionEmitted
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
    // Safety counter to prevent infinite loops
    let processedCount = 0
    const maxProcessedMessages = 100 // Reasonable limit

    while (
      storeState.messageQueue.hasMessages(conversationId) &&
      processedCount < maxProcessedMessages
    ) {
      processedCount++
      const nextMessage = storeState.messageQueue.dequeue(conversationId)

      if (!nextMessage) {
        break
      }

      logger.debug(
        { conversationId, remaining: storeState.messageQueue.getQueueLength(conversationId) },
        `Processing queued message`
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
          await this.processQueuedMessage(storeId, nextMessage, storeState)
        })
      } catch (error) {
        logger.error({ error, conversationId }, `Error processing queued message`)

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

    // Log warning if we hit the safety limit
    if (processedCount >= maxProcessedMessages) {
      logger.warn(
        {
          processedCount,
          conversationId,
          remaining: storeState.messageQueue.getQueueLength(conversationId),
        },
        `Hit safety limit processing messages`
      )
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
      storeLogger(storeId).warn(`Store is not being monitored`)
      return
    }

    // Mark as stopping immediately to prevent race conditions
    storeState.stopping = true

    // Unsubscribe from all table subscriptions
    for (const unsubscribe of storeState.subscriptions) {
      try {
        unsubscribe()
      } catch (error) {
        storeLogger(storeId).error({ error }, `Error unsubscribing from store`)
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

      this.storeStates.delete(storeId)
      storeLogger(storeId).info('Stopped event monitoring')
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

    this.clearLlmCallTracking()

    // Cleanup processed message tracker
    this.processedTracker.close().catch(error => {
      logger.error({ error }, 'Error closing processed message tracker')
    })

    logger.info('Stopped all event monitoring')
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
        resourceMetrics: null,
        cacheStats: { size: 0, maxSize: 0, entries: [] },
      })
    }

    return stats
  }

  async getLiveStoreStats(): Promise<LiveStoreStatsResult> {
    const perStore = new Map<string, LiveStoreStatsEntry>()
    const totalsAccumulator = {
      chatMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
      processedUserMessages: 0,
      pendingUserMessages: 0,
      conversations: 0,
      lastMessageAt: null as number | null,
      lastUserMessageAt: null as number | null,
      lastAssistantMessageAt: null as number | null,
    }

    const stores = this.storeManager.getAllStores()

    for (const [storeId, store] of stores) {
      try {
        const query = (handler: (db: any) => any) =>
          (store as unknown as { query: (cb: (db: any) => any) => Promise<any> | any }).query(
            handler
          )

        const [rawMessages, rawConversations, processedUserMessages] = await Promise.all([
          query((db: any) => db.table('chatMessages').all()),
          query((db: any) => db.table('conversations').all()),
          this.processedTracker.getProcessedCount(storeId),
        ])

        const chatMessages = Array.isArray(rawMessages) ? rawMessages : []
        const conversations = Array.isArray(rawConversations) ? rawConversations : []

        let userMessages = 0
        let assistantMessages = 0
        let lastMessageTimestamp: number | null = null
        let lastUserMessageTimestamp: number | null = null
        let lastAssistantMessageTimestamp: number | null = null

        for (const message of chatMessages) {
          const timestamp = toTimestamp((message as any)?.createdAt)

          if (timestamp !== null) {
            lastMessageTimestamp =
              lastMessageTimestamp === null ? timestamp : Math.max(lastMessageTimestamp, timestamp)
          }

          const role = (message as any)?.role
          if (role === 'user') {
            userMessages += 1
            if (timestamp !== null) {
              lastUserMessageTimestamp =
                lastUserMessageTimestamp === null
                  ? timestamp
                  : Math.max(lastUserMessageTimestamp, timestamp)
            }
          } else if (role === 'assistant') {
            assistantMessages += 1
            if (timestamp !== null) {
              lastAssistantMessageTimestamp =
                lastAssistantMessageTimestamp === null
                  ? timestamp
                  : Math.max(lastAssistantMessageTimestamp, timestamp)
            }
          }
        }

        const pendingUserMessages = Math.max(userMessages - processedUserMessages, 0)

        const snapshot: LiveStoreStats = {
          chatMessages: chatMessages.length,
          userMessages,
          assistantMessages,
          processedUserMessages,
          pendingUserMessages,
          conversations: conversations.length,
          lastMessageAt: toIsoString(lastMessageTimestamp),
          lastUserMessageAt: toIsoString(lastUserMessageTimestamp),
          lastAssistantMessageAt: toIsoString(lastAssistantMessageTimestamp),
        }

        perStore.set(storeId, snapshot)

        totalsAccumulator.chatMessages += snapshot.chatMessages
        totalsAccumulator.userMessages += snapshot.userMessages
        totalsAccumulator.assistantMessages += snapshot.assistantMessages
        totalsAccumulator.processedUserMessages += snapshot.processedUserMessages
        totalsAccumulator.pendingUserMessages += snapshot.pendingUserMessages
        totalsAccumulator.conversations += snapshot.conversations

        if (lastMessageTimestamp !== null) {
          totalsAccumulator.lastMessageAt =
            totalsAccumulator.lastMessageAt === null
              ? lastMessageTimestamp
              : Math.max(totalsAccumulator.lastMessageAt, lastMessageTimestamp)
        }

        if (lastUserMessageTimestamp !== null) {
          totalsAccumulator.lastUserMessageAt =
            totalsAccumulator.lastUserMessageAt === null
              ? lastUserMessageTimestamp
              : Math.max(totalsAccumulator.lastUserMessageAt, lastUserMessageTimestamp)
        }

        if (lastAssistantMessageTimestamp !== null) {
          totalsAccumulator.lastAssistantMessageAt =
            totalsAccumulator.lastAssistantMessageAt === null
              ? lastAssistantMessageTimestamp
              : Math.max(totalsAccumulator.lastAssistantMessageAt, lastAssistantMessageTimestamp)
        }
      } catch (error: any) {
        perStore.set(storeId, {
          error: error?.message ?? 'Failed to retrieve LiveStore statistics for this store.',
        })
      }
    }

    const totals: LiveStoreStats = {
      chatMessages: totalsAccumulator.chatMessages,
      userMessages: totalsAccumulator.userMessages,
      assistantMessages: totalsAccumulator.assistantMessages,
      processedUserMessages: totalsAccumulator.processedUserMessages,
      pendingUserMessages: totalsAccumulator.pendingUserMessages,
      conversations: totalsAccumulator.conversations,
      lastMessageAt: toIsoString(totalsAccumulator.lastMessageAt),
      lastUserMessageAt: toIsoString(totalsAccumulator.lastUserMessageAt),
      lastAssistantMessageAt: toIsoString(totalsAccumulator.lastAssistantMessageAt),
    }

    return {
      perStore,
      totals,
    }
  }

  /**
   * Get global resource status for health endpoint
   */
  getGlobalResourceStatus(options?: { pendingUserMessages?: number; userMessages?: number }): {
    systemHealth: 'healthy' | 'stressed' | 'critical'
    activeLLMCalls: number
    queuedMessages: number
    activeConversations: number
    errorRate: number | null
    avgResponseTime: number | null
    cacheHitRate: number | null
    alerts: number
    pendingUserMessages: number | null
    userMessages: number | null
    notes?: string
  } {
    const totals = Array.from(this.storeStates.values()).reduce(
      (acc, state) => {
        acc.activeConversations += state.activeConversations.size
        acc.queuedMessages += state.messageQueue.getTotalQueuedMessages()
        return acc
      },
      { activeConversations: 0, queuedMessages: 0 }
    )

    const recentErrorRate = this.getRecentErrorRate()
    const averageResponseTime = this.getAverageResponseTime()

    let systemHealth: 'healthy' | 'stressed' | 'critical' = 'healthy'

    const queueNearCapacity =
      this.maxQueuedMessages > 0 && totals.queuedMessages >= this.maxQueuedMessages * 0.8
    const llmAtCapacity =
      this.maxConcurrentLLMCalls > 0 && this.activeLLMCalls >= this.maxConcurrentLLMCalls

    const backlog = options?.pendingUserMessages ?? null
    if (queueNearCapacity || llmAtCapacity || (recentErrorRate ?? 0) > 10) {
      systemHealth = 'stressed'
    }

    const noteSegments = [
      'In-process resource monitor disabled; rely on Render dashboards for CPU/memory metrics.',
    ]

    if (backlog && backlog > 0) {
      noteSegments.push(`LiveStore backlog: ${backlog} pending user message(s).`)
    }

    return {
      systemHealth,
      activeLLMCalls: this.activeLLMCalls,
      queuedMessages: totals.queuedMessages,
      activeConversations: totals.activeConversations,
      errorRate: recentErrorRate,
      avgResponseTime: averageResponseTime,
      cacheHitRate: null,
      alerts: 0,
      pendingUserMessages: backlog,
      userMessages: options?.userMessages ?? null,
      notes: noteSegments.join(' '),
    }
  }

  /**
   * Get processed message statistics for health monitoring
   */
  async getProcessedMessageStats(): Promise<
    | {
        total: number
        byStore: Record<string, number>
        databasePath: string
      }
    | { error: string }
  > {
    try {
      const total = await this.processedTracker.getProcessedCount()
      const byStore: Record<string, number> = {}

      for (const [storeId] of this.storeStates) {
        const count = await this.processedTracker.getProcessedCount(storeId)
        byStore[storeId] = count
      }

      return {
        total,
        byStore,
        databasePath: this.processedTracker.databasePath,
      }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  private canStartLLMCall(): boolean {
    if (this.maxConcurrentLLMCalls <= 0) {
      return true
    }
    return this.activeLLMCalls < this.maxConcurrentLLMCalls
  }

  private beginLLMCall(): string {
    const callId = crypto.randomUUID()
    this.activeLLMCalls += 1
    this.llmCallsInFlight.add(callId)

    if (this.llmCallTimeoutMs > 0) {
      const timeout = setTimeout(() => {
        if (this.llmCallsInFlight.has(callId)) {
          logger.warn({ callId }, 'LLM call timeout')
          this.endLLMCall(callId, true)
        }
      }, this.llmCallTimeoutMs)

      this.llmCallTimeouts.set(callId, timeout)
    }

    return callId
  }

  private endLLMCall(callId: string, isTimeout: boolean, responseTime?: number): void {
    if (!this.llmCallsInFlight.has(callId)) {
      return
    }

    this.llmCallsInFlight.delete(callId)
    if (this.activeLLMCalls > 0) {
      this.activeLLMCalls -= 1
    }

    const timeout = this.llmCallTimeouts.get(callId)
    if (timeout) {
      clearTimeout(timeout)
      this.llmCallTimeouts.delete(callId)
    }

    if (isTimeout) {
      this.recordError()
    } else if (typeof responseTime === 'number') {
      this.recordResponseTime(responseTime)
    }
  }

  private canAcceptIncomingMessage():
    | { allowed: true }
    | { allowed: false; reason: 'queue-limit' | 'rate-limit' } {
    if (this.maxQueuedMessages > 0) {
      const totalQueued = Array.from(this.storeStates.values()).reduce(
        (acc, state) => acc + state.messageQueue.getTotalQueuedMessages(),
        0
      )

      if (totalQueued >= this.maxQueuedMessages) {
        return { allowed: false, reason: 'queue-limit' }
      }
    }

    const now = Date.now()
    this.trimTimestamps(this.messageTimestamps, now, this.messageRateWindowMs)

    if (this.messageRateLimit > 0 && this.messageTimestamps.length >= this.messageRateLimit) {
      return { allowed: false, reason: 'rate-limit' }
    }

    return { allowed: true }
  }

  private recordIncomingMessage(): void {
    const now = Date.now()
    this.messageTimestamps.push(now)
    this.trimTimestamps(this.messageTimestamps, now, this.messageRateWindowMs)
  }

  private recordError(): void {
    const now = Date.now()
    this.errorTimestamps.push(now)
    this.trimTimestamps(this.errorTimestamps, now, this.messageRateWindowMs)
  }

  private recordResponseTime(durationMs: number): void {
    this.responseTimes.push(durationMs)

    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-50)
    }
  }

  private getRecentErrorRate(): number | null {
    if (this.errorTimestamps.length === 0) {
      return null
    }

    const now = Date.now()
    this.trimTimestamps(this.errorTimestamps, now, this.messageRateWindowMs)

    return this.errorTimestamps.length
  }

  private getAverageResponseTime(): number | null {
    if (this.responseTimes.length === 0) {
      return null
    }

    const total = this.responseTimes.reduce((acc, value) => acc + value, 0)
    return Math.round(total / this.responseTimes.length)
  }

  private trimTimestamps(timestamps: number[], now: number, windowMs: number): void {
    const cutoff = now - windowMs
    let firstValidIndex = 0

    while (firstValidIndex < timestamps.length && timestamps[firstValidIndex] < cutoff) {
      firstValidIndex++
    }

    if (firstValidIndex > 0) {
      timestamps.splice(0, firstValidIndex)
    }
  }

  private clearLlmCallTracking(): void {
    for (const timeout of this.llmCallTimeouts.values()) {
      clearTimeout(timeout)
    }
    this.llmCallTimeouts.clear()
    this.llmCallsInFlight.clear()
    this.activeLLMCalls = 0
  }

  /**
   * Sanitize conversation history to prevent tool_use/tool_result mismatches
   */
  private sanitizeConversationHistory(history: LLMMessage[]): LLMMessage[] {
    const sanitized: LLMMessage[] = []

    for (let i = 0; i < history.length; i++) {
      const message = history[i]

      // If this is an assistant message with tool_calls
      if (message.role === 'assistant' && message.tool_calls && message.tool_calls.length > 0) {
        // Check if the next message has corresponding tool_result blocks
        const nextMessage = history[i + 1]

        if (!nextMessage || nextMessage.role !== 'tool' || !nextMessage.tool_call_id) {
          // No corresponding tool result - strip the tool_calls to avoid API errors
          logger.debug(`Sanitizing incomplete tool_calls from assistant message`)
          sanitized.push({
            ...message,
            tool_calls: undefined,
          })
        } else {
          // Has tool results - include as-is
          sanitized.push(message)
        }
      } else if (message.role === 'tool') {
        // Only include tool messages if the previous message was an assistant with tool_calls
        const prevMessage = sanitized[sanitized.length - 1]
        if (prevMessage && prevMessage.role === 'assistant' && prevMessage.tool_calls) {
          sanitized.push(message)
        } else {
          logger.debug(`Removing orphaned tool result message`)
        }
      } else {
        // Regular user/assistant message without tool_calls - include as-is
        sanitized.push(message)
      }
    }

    return sanitized
  }

  private buildConversationHistory(
    chatHistory: ChatMessage[],
    userMessage: ChatMessage
  ): LLMMessage[] {
    let historyToUse = chatHistory

    if (historyToUse.length > 0) {
      const lastMessage = historyToUse[historyToUse.length - 1]

      if (lastMessage.id === userMessage.id && lastMessage.role === 'user') {
        historyToUse = historyToUse.slice(0, -1)
        logger.debug(
          {
            conversationId: userMessage.conversationId,
            userMessageId: userMessage.id,
            removedMessageRole: lastMessage.role,
          },
          'Trimming current user message from conversation history before LLM call'
        )
      }
    }

    const rawHistory: LLMMessage[] = historyToUse.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
      content: msg.message || '',
      tool_calls: msg.llmMetadata?.toolCalls as any,
      tool_call_id: msg.llmMetadata?.tool_call_id as any,
    }))

    const sanitizedHistory = this.sanitizeConversationHistory(rawHistory)

    const duplicateUserMessages: Array<{ index: number; content: string | null }> = []
    for (let i = 1; i < sanitizedHistory.length; i++) {
      const previous = sanitizedHistory[i - 1]
      const current = sanitizedHistory[i]

      if (
        previous.role === 'user' &&
        current.role === 'user' &&
        previous.content === current.content
      ) {
        duplicateUserMessages.push({ index: i, content: current.content })
      }
    }

    if (duplicateUserMessages.length > 0) {
      logger.warn(
        {
          conversationId: userMessage.conversationId,
          userMessageId: userMessage.id,
          duplicates: duplicateUserMessages.map(({ index, content }) => ({
            index,
            preview: content ? content.slice(0, 100) : null,
          })),
        },
        'Detected duplicate consecutive user messages in conversation history'
      )
    }

    return sanitizedHistory
  }
}
