import type { Store } from '@livestore/livestore'
import { ConversationHistory } from '../conversation/conversation-history.js'
import { ToolExecutor } from '../tool-executor/tool-executor.js'
import type {
  LLMProvider,
  LLMResponse,
  AgenticLoopContext,
  AgenticLoopEvents,
} from './types.js'
import type { ToolCall } from '../tool-formatters/types.js'

export class AgenticLoop {
  private history: ConversationHistory
  private toolExecutor: ToolExecutor
  private maxIterations: number

  constructor(
    private store: Store,
    private llmProvider: LLMProvider,
    private events: AgenticLoopEvents = {}
  ) {
    this.history = new ConversationHistory()
    this.toolExecutor = new ToolExecutor(store, {
      onToolStart: (toolCall) => {
        console.log(`🔧 Executing tool: ${toolCall.function.name}`)
      },
      onToolComplete: (result) => {
        console.log(`✅ Tool completed: ${result.toolCall.function.name}`)
      },
      onToolError: (error, toolCall) => {
        console.error(`❌ Tool error in ${toolCall.function.name}:`, error)
      },
    })
    this.maxIterations = 10 // Default max iterations
  }

  /**
   * Run the agentic loop with a user message
   */
  async run(userMessage: string, context: AgenticLoopContext): Promise<void> {
    // Initialize context
    this.maxIterations = context.maxIterations || 10
    const { boardContext, workerContext, model } = context

    // Add user message to history
    this.history.addUserMessage(userMessage)
    console.log(`🚀 Starting agentic loop with message: "${userMessage.substring(0, 100)}..."`)

    // Run the loop
    for (let iteration = 1; iteration <= this.maxIterations; iteration++) {
      try {
        this.events.onIterationStart?.(iteration)
        console.log(`🔄 Iteration ${iteration}/${this.maxIterations}`)

        // Call LLM with current history
        const response = await this.llmProvider.call(
          this.history.getOpenAIFormat(),
          boardContext,
          model,
          workerContext
        )

        console.log(`🔄 Iteration ${iteration} LLM response:`, {
          hasMessage: !!response.message?.trim(),
          hasToolCalls: (response.toolCalls?.length || 0) > 0,
          messagePreview: response.message?.substring(0, 100),
        })

        this.events.onIterationComplete?.(iteration, response)

        // Check if we have tool calls to process
        if (response.toolCalls && response.toolCalls.length > 0) {
          // Add assistant message with tool calls
          this.history.addAssistantMessage(response.message || '', response.toolCalls)

          // Execute tools
          this.events.onToolsExecuting?.(response.toolCalls)
          const toolMessages = await this.toolExecutor.executeTools(response.toolCalls)
          
          // Add tool results to history
          this.history.addToolMessages(toolMessages)
          this.events.onToolsComplete?.(toolMessages)

          // Continue to next iteration
          continue
        }

        // No tool calls - handle final message
        if (response.message && response.message.trim()) {
          console.log(`✅ Final LLM message: ${response.message.substring(0, 100)}...`)
          this.history.addAssistantMessage(response.message)
          this.events.onFinalMessage?.(response.message)
        }

        // Exit loop - we're done
        console.log(`✅ Agentic loop completed after ${iteration} iterations`)
        this.events.onComplete?.(iteration)
        break
      } catch (error) {
        console.error(`❌ Error in iteration ${iteration}:`, error)
        this.events.onError?.(error as Error, iteration)
        
        // Decide whether to continue or abort
        // For now, we'll abort on error
        throw error
      }
    }

    // Check if we hit max iterations
    if (this.history.getMessageCount() > 0) {
      const lastMessages = this.history.getLastMessages(1)
      const lastMessage = lastMessages[0]
      if (lastMessage && lastMessage.role === 'tool') {
        console.warn(`⚠️ Hit max iterations (${this.maxIterations}) - loop may be incomplete`)
        this.events.onComplete?.(this.maxIterations)
      }
    }
  }

  /**
   * Get the conversation history
   */
  getHistory(): ConversationHistory {
    return this.history
  }

  /**
   * Clear the conversation history
   */
  clearHistory(): void {
    this.history.clear()
  }

  /**
   * Set initial conversation history (useful for resuming)
   */
  setHistory(history: ConversationHistory): void {
    this.history = history
  }
}