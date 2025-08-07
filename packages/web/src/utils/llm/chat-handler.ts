import type { Store } from '@livestore/livestore'
import { AgenticLoop, type AgenticLoopContext } from '@work-squared/shared'
import { events } from '@work-squared/shared/schema'
import { BraintrustProvider } from './braintrust-provider.js'

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
 */
export class ChatHandler {
  private agenticLoop: AgenticLoop
  private llmProvider = new BraintrustProvider()

  constructor(private store: Store) {
    this.agenticLoop = new AgenticLoop(store, this.llmProvider, {
      onIterationStart: (iteration: number) => {
        console.log(`🔄 Starting iteration ${iteration}`)
      },
      onToolsExecuting: (toolCalls: any[]) => {
        console.log(`🔧 Executing ${toolCalls.length} tools`)
        // Could emit UI events here for loading states
      },
      onToolsComplete: (results: any[]) => {
        console.log(`✅ Tools completed, ${results.length} results`)
        // Could emit UI events here for tool results
      },
      onFinalMessage: (message: string) => {
        console.log(`💬 Final message received`)
        // This is where the final assistant message is ready
      },
      onError: (error: Error, iteration: number) => {
        console.error(`❌ Error in iteration ${iteration}:`, error)
        // Could emit UI error events here
      },
      onComplete: (iterations: number) => {
        console.log(`✅ Completed after ${iterations} iterations`)
      },
    })
  }

  /**
   * Handle a chat message from the user
   */
  async handleMessage(
    userMessage: string,
    options: ChatHandlerOptions
  ): Promise<void> {
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

    // Set up event handlers to store results in the UI
    const originalEvents = this.agenticLoop['events']
    this.agenticLoop['events'] = {
      ...originalEvents,
      onToolsExecuting: (toolCalls: any[]) => {
        originalEvents.onToolsExecuting?.(toolCalls)
        
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
      onFinalMessage: (message: string) => {
        originalEvents.onFinalMessage?.(message)
        
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
        originalEvents.onError?.(error, iteration)
        
        // Store error in UI
        this.store.commit(
          events.llmResponseReceived({
            id: crypto.randomUUID(),
            conversationId,
            message: `Error: ${error.message}`,
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
    }

    // Run the agentic loop
    try {
      await this.agenticLoop.run(userMessage, context)
    } catch (error) {
      console.error('Failed to run agentic loop:', error)
      throw error
    }
  }

  /**
   * Clear the conversation history
   */
  clearHistory(): void {
    this.agenticLoop.clearHistory()
  }

  /**
   * Get the current conversation history
   */
  getHistory() {
    return this.agenticLoop.getHistory()
  }
}