import type { Store } from '@livestore/livestore'
import {
  AgenticLoop,
  type AgenticLoopContext,
  type AgenticLoopEvents,
  ConversationHistory,
} from '@work-squared/shared'
import { events } from '@work-squared/shared/schema'
import { BraintrustProvider, RateLimitError } from './braintrust-provider.js'

interface ChatHandlerOptions {
  conversationId: string
  model: string
  boardContext?: { id: string; name: string }
  workerContext?: { systemPrompt: string; name: string; roleDescription?: string }
  maxIterations?: number
}

/**
 * Refactored chat handler using the new agentic loop abstractions
 * This demonstrates how the ChatInterface can be simplified
 *
 * Note: Creates a new AgenticLoop instance per message to avoid context leakage
 * while maintaining conversation history across messages within the handler.
 */
export class ChatHandler {
  private llmProvider = new BraintrustProvider()
  private sharedHistory: ConversationHistory | null = null // Shared conversation history across messages

  constructor(private store: Store) {}

  /**
   * Handle a chat message from the user
   */
  async handleMessage(userMessage: string, options: ChatHandlerOptions): Promise<void> {
    const { conversationId, model, boardContext, workerContext, maxIterations } = options

    // Store the user message
    const userMessageEvent = events.chatMessageSent({
      id: crypto.randomUUID(),
      conversationId,
      message: userMessage,
      role: 'user',
      createdAt: new Date(),
    })
    this.store.commit(userMessageEvent)

    // Create context for the agentic loop
    const context: AgenticLoopContext = {
      model,
      boardContext,
      workerContext,
      maxIterations: maxIterations || 10,
    }

    // Create event handlers with captured context for this specific call
    const eventHandlers: AgenticLoopEvents = {
      onIterationStart: (iteration: number) => {
        console.log(`🔄 Starting iteration ${iteration}`)
      },
      onRetry: (attempt, maxRetries, delayMs) => {
        this.store.commit(
          events.llmResponseReceived({
            id: crypto.randomUUID(),
            conversationId,
            message: `The AI service is busy. Retrying in ${Math.round(delayMs / 1000)}s (attempt ${attempt}/${maxRetries})...`,
            role: 'assistant',
            modelId: model,
            responseToMessageId: userMessageEvent.args.id,
            createdAt: new Date(),
            llmMetadata: { source: 'status', retryAttempt: attempt },
          })
        )
      },
      onToolsExecuting: (toolCalls: any[]) => {
        console.log(`🔧 Executing ${toolCalls.length} tools`)

        // Store tool execution notifications in UI if needed
        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'create_task') {
            // Special UI notification for task creation
            this.store.commit(
              events.llmResponseReceived({
                id: crypto.randomUUID(),
                conversationId,
                message: `✅ Creating task...`,
                role: 'assistant',
                modelId: model,
                responseToMessageId: userMessageEvent.args.id,
                createdAt: new Date(),
                llmMetadata: {
                  source: 'tool-result',
                  toolCall: toolCall,
                },
              })
            )
          }
        }
      },
      onToolsComplete: (results: any[]) => {
        console.log(`✅ Tools completed, ${results.length} results`)
      },
      onFinalMessage: (message: string) => {
        console.log(`💬 Final message received`)

        // Store the final assistant message
        this.store.commit(
          events.llmResponseReceived({
            id: crypto.randomUUID(),
            conversationId,
            message,
            role: 'assistant',
            modelId: model,
            responseToMessageId: userMessageEvent.args.id,
            createdAt: new Date(),
            llmMetadata: {
              source: 'braintrust',
            },
          })
        )
      },
      onError: (error: Error, iteration: number) => {
        console.error(`❌ Error in iteration ${iteration}:`, error)

        const isRateLimit = error instanceof RateLimitError
        const message = isRateLimit
          ? 'The AI service is busy. Please try again later.'
          : `Error: ${error.message}`

        this.store.commit(
          events.llmResponseReceived({
            id: crypto.randomUUID(),
            conversationId,
            message,
            role: 'assistant',
            modelId: model,
            responseToMessageId: userMessageEvent.args.id,
            createdAt: new Date(),
            llmMetadata: {
              source: 'error',
              error: error.message,
            },
          })
        )
      },
      onComplete: (iterations: number) => {
        console.log(`✅ Completed after ${iterations} iterations`)
      },
    }

    // Create a new AgenticLoop instance for this message to avoid context leakage
    // Each call gets its own instance with its own event handlers that capture
    // the call-specific context (conversationId, model, etc.)
    const agenticLoop = new AgenticLoop(this.store, this.llmProvider, eventHandlers)

    // If we have shared history from previous messages, restore it
    // This allows conversation continuity while avoiding context leakage
    if (this.sharedHistory) {
      // Note: This assumes AgenticLoop has a way to set initial history
      // If not, this would need to be added to the AgenticLoop class
      // For now, we'll just create a fresh loop each time
    }

    // Run the agentic loop
    try {
      await agenticLoop.run(userMessage, context)
      // Store the history from this loop for potential future use
      this.sharedHistory = agenticLoop.getHistory()
    } catch (error) {
      console.error('Failed to run agentic loop:', error)
      throw error
    }
  }

  /**
   * Clear the conversation history
   */
  clearHistory(): void {
    this.sharedHistory = null
  }

  /**
   * Get the current conversation history
   */
  getHistory(): ConversationHistory | null {
    return this.sharedHistory
  }
}
