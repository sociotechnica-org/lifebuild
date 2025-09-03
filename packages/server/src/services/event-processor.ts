import type { Store as LiveStore } from '@livestore/livestore'
import { queryDb } from '@livestore/livestore'
import type { StoreManager } from './store-manager.js'
import { tables, events } from '@work-squared/shared/schema'
import { AgenticLoop } from './agentic-loop/agentic-loop.js'
import { BraintrustProvider } from './agentic-loop/braintrust-provider.js'
import { DEFAULT_MODEL } from '@work-squared/shared'
import { MessageQueueManager } from './message-queue-manager.js'
import { AsyncQueueProcessor } from './async-queue-processor.js'
import { ResourceMonitor } from './resource-monitor.js'
import type {
  EventBuffer,
  ProcessedEvent,
  ChatMessage,
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
  resourceMonitor: ResourceMonitor // Resource monitoring and limits
  processedMessageIds: Set<string> // Track which chat messages have been processed
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
  // IMPORTANT: Only monitor chatMessages to process user messages
  // Monitoring other tables is unnecessary and causes performance issues
  private readonly monitoredTables = ['chatMessages'] as const

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

  async startMonitoring(storeId: string, store: LiveStore): Promise<void> {
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
      resourceMonitor: new ResourceMonitor({
        maxConversationsPerStore: 50, // Per-store limit
        maxQueuedMessages: 200, // Per-store limit
      }),
      processedMessageIds: new Set(),
    }

    this.storeStates.set(storeId, storeState)

    // Pre-populate processedMessageIds with existing user messages to avoid reprocessing
    try {
      const existingUserMessages = store.query(
        queryDb(tables.chatMessages.select().where('role', '=', 'user'))
      ) as Array<{ id: string }>

      for (const msg of existingUserMessages) {
        storeState.processedMessageIds.add(msg.id)
      }

      console.log(
        `📝 Pre-populated ${existingUserMessages.length} existing user message IDs for store ${storeId}`
      )
    } catch (error) {
      console.error(`⚠️ Failed to pre-populate message IDs for store ${storeId}:`, error)
      // Continue anyway - will just risk reprocessing
    }

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
        console.warn(`⚠️ Unexpected table ${tableName} - only chatMessages should be monitored`)
        return
      }

      const query = queryDb(tables.chatMessages.select(), {
        label: `monitor-${tableName}-${storeId}`,
      })

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

    const lastCount = storeState.lastSeenCounts.get(tableName)
    const currentCount = records.length

    // On first subscription, initialize the count without processing existing records
    if (lastCount === undefined) {
      console.log(`📊 Initial sync for ${storeId}/${tableName}: ${currentCount} existing records`)
      storeState.lastSeenCounts.set(tableName, currentCount)
      return
    }

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

        // Handle chat messages for agentic loop processing - only process truly NEW user messages
        if (tableName === 'chatMessages' && recordObj.role === 'user') {
          // Skip if already processed
          if (storeState.processedMessageIds.has(recordObj.id)) {
            console.log(`⏭️ Skipping already-processed message: ${recordObj.id}`)
            continue
          }

          console.log(`🆕 Scheduling new user message processing: ${recordObj.id}`)
          storeState.processedMessageIds.add(recordObj.id)

          // Defer processing to avoid committing during reactive update cycle
          setImmediate(() => {
            this.handleUserMessage(storeId, recordObj as ChatMessage, storeState)
          })
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
    try {
      const startTime = Date.now()
      await this.runAgenticLoop(storeId, chatMessage, storeState)
      const responseTime = Date.now() - startTime

      // Track successful completion
      this.globalResourceMonitor.trackLLMCallComplete(llmCallId, false, responseTime)
      llmCallCompleted = true
    } catch (error) {
      // Track error and ensure LLM call is properly cleaned up
      this.globalResourceMonitor.trackError(`LLM call failed: ${error}`)
      if (!llmCallCompleted) {
        this.globalResourceMonitor.trackLLMCallComplete(llmCallId, true) // Mark as timeout/error
      }
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
      // Ensure LLM call is always cleaned up
      if (!llmCallCompleted) {
        this.globalResourceMonitor.trackLLMCallComplete(llmCallId, true)
      }

      // Always remove from active conversations
      storeState.activeConversations.delete(conversationId)
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

    console.log(`🤖 Processing queued message for conversation ${conversationId}`)

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

    let llmCallCompleted = false
    try {
      const startTime = Date.now()
      await this.runAgenticLoop(storeId, chatMessage, storeState)
      const responseTime = Date.now() - startTime

      // Track successful completion
      this.globalResourceMonitor.trackLLMCallComplete(llmCallId, false, responseTime)
      llmCallCompleted = true
    } catch (error) {
      // Track error and ensure LLM call is properly cleaned up
      this.globalResourceMonitor.trackError(`LLM call failed: ${error}`)
      if (!llmCallCompleted) {
        this.globalResourceMonitor.trackLLMCallComplete(llmCallId, true) // Mark as timeout/error
      }
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
      // Ensure LLM call is always cleaned up
      if (!llmCallCompleted) {
        this.globalResourceMonitor.trackLLMCallComplete(llmCallId, true)
      }

      // Always remove from active conversations
      storeState.activeConversations.delete(conversationId)
    }

    // NOTE: Deliberately NOT calling processQueuedMessages here to avoid recursion
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
    if (!store) {
      return
    }

    if (!storeState.llmProvider) {
      return
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
      console.error(`❌ Error querying conversation context:`, error)
      // If we can't get the context due to store issues, bail out gracefully
      return
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

    // Convert chat messages to conversation history format and sanitize tool calls
    const rawHistory: LLMMessage[] = chatHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
      content: msg.message || '',
      tool_calls: msg.llmMetadata?.toolCalls as any,
      tool_call_id: msg.llmMetadata?.tool_call_id as any,
    }))

    // Sanitize conversation history to fix tool_use/tool_result mismatches
    const conversationHistory = this.sanitizeConversationHistory(rawHistory)

    // Create agentic loop instance with conversation history
    const agenticLoop = new AgenticLoop(
      store,
      storeState.llmProvider,
      {
        onIterationStart: iteration => {
          console.log(`🔄 Agentic loop iteration ${iteration} started`)
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
            console.log(
              `💬 Iteration ${iteration} LLM reasoning: ${response.message.substring(0, 100)}...`
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
          console.log(`✅ Final LLM response: ${message.substring(0, 100)}...`)
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
        },
        onComplete: iterations => {
          // Send completion event to indicate the agentic loop has finished
          console.log(`✅ Agentic loop completed after ${iterations} iterations`)
          store.commit(
            events.llmResponseCompleted({
              conversationId: userMessage.conversationId,
              userMessageId: userMessage.id,
              createdAt: new Date(),
              iterations,
              success: true,
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
          await this.processQueuedMessage(storeId, nextMessage, storeState)
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

    // Log warning if we hit the safety limit
    if (processedCount >= maxProcessedMessages) {
      console.warn(
        `⚠️ Hit safety limit processing ${processedCount} messages for conversation ${conversationId}. Remaining: ${storeState.messageQueue.getQueueLength(conversationId)}`
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
        cacheStats: { size: 0, maxSize: 0, entries: [] },
      })
    }

    return stats
  }

  /**
   * Get global resource status for health endpoint
   */
  getGlobalResourceStatus(): {
    systemHealth: 'healthy' | 'stressed' | 'critical'
    activeLLMCalls: number
    queuedMessages: number
    activeConversations: number
    errorRate: number
    avgResponseTime: number
    cacheHitRate: number
    alerts: number
  } {
    const globalReport = this.globalResourceMonitor.getResourceReport()

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
      systemHealth,
      activeLLMCalls: globalReport.current.activeLLMCalls,
      queuedMessages: globalReport.current.queuedMessages,
      activeConversations: globalReport.current.activeConversations,
      errorRate: globalReport.current.errorRate,
      avgResponseTime: globalReport.current.avgResponseTime,
      cacheHitRate: globalReport.current.cacheHitRate,
      alerts: globalReport.alerts.length,
    }
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
          console.warn(`🧹 Sanitizing incomplete tool_calls from assistant message`)
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
          console.warn(`🧹 Removing orphaned tool result message`)
        }
      } else {
        // Regular user/assistant message without tool_calls - include as-is
        sanitized.push(message)
      }
    }

    return sanitized
  }
}
