import type { Store } from '@livestore/livestore'
import { ConversationHistory } from '../conversation/conversation-history.js'
import { ToolExecutor } from '../tool-executor/tool-executor.js'
import type { LLMProvider, AgenticLoopContext, AgenticLoopEvents } from './types.js'

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
      onToolStart: toolCall => {
        console.log(`🔧 Executing tool: ${toolCall.function.name}`)
      },
      onToolComplete: result => {
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
    // Use environment variable if available, otherwise use context.maxIterations, fallback to 15
    // Check for environment variable in a way that works in both Node and browser
    let envMaxIterations = 15
    try {
      // @ts-ignore - import.meta.env may not exist in all environments
      if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LLM_MAX_ITERATIONS) {
        // @ts-ignore
        const parsed = parseInt(import.meta.env.VITE_LLM_MAX_ITERATIONS as string, 10)
        envMaxIterations = isNaN(parsed) ? 15 : Math.max(1, parsed) // Ensure positive integer
      }
    } catch {
      // Fallback if import.meta is not available
    }
    this.maxIterations = context.maxIterations || envMaxIterations
    const { boardContext, workerContext, model } = context

    // Add user message to history
    this.history.addUserMessage(userMessage)
    console.log(`🚀 Starting agentic loop with message: "${userMessage.substring(0, 100)}..."`)

    // Track tool calls to detect stuck/infinite loops
    const toolCallHistory: Array<{ name: string; args: string; iteration: number }> = []
    const consecutiveCallCounts = new Map<string, number>() // Track consecutive calls per tool signature
    const warningThreshold = Math.floor(this.maxIterations * 0.8) // 80% of max iterations

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
          workerContext,
          {
            onRetry: (attempt, maxRetries, delayMs, error) =>
              this.events.onRetry?.(attempt, maxRetries, delayMs, error),
          }
        )

        console.log(`🔄 Iteration ${iteration} LLM response:`, {
          hasMessage: !!response.message?.trim(),
          hasToolCalls: (response.toolCalls?.length || 0) > 0,
          messagePreview: response.message?.substring(0, 100),
        })

        this.events.onIterationComplete?.(iteration, response)

        // Check if we have tool calls to process
        if (response.toolCalls && response.toolCalls.length > 0) {
          // Check for stuck/infinite loops
          let isStuckLoop = false
          for (const toolCall of response.toolCalls) {
            const toolSignature = `${toolCall.function.name}:${toolCall.function.arguments}`

            // Check if this exact call was made recently
            const recentIdenticalCall = toolCallHistory
              .slice(-3) // Check last 3 calls
              .find(
                tc => tc.name === toolCall.function.name && tc.args === toolCall.function.arguments
              )

            if (recentIdenticalCall) {
              const currentCount = (consecutiveCallCounts.get(toolSignature) || 0) + 1
              consecutiveCallCounts.set(toolSignature, currentCount)
              console.warn(
                `⚠️ Detected repeated tool call: ${toolCall.function.name} (${currentCount} times)`
              )

              if (currentCount >= 3) {
                isStuckLoop = true
                console.error('❌ Detected stuck loop - breaking out')
                this.events.onError?.(
                  new Error('Stuck loop detected: Repeating same tool calls'),
                  iteration
                )
                break
              }
            } else {
              consecutiveCallCounts.set(toolSignature, 0) // Reset counter for this specific tool call
            }

            toolCallHistory.push({
              name: toolCall.function.name,
              args: toolCall.function.arguments,
              iteration,
            })
          }

          if (isStuckLoop) {
            // Exit the loop if stuck
            this.events.onComplete?.(iteration)
            return
          }

          // Warn when approaching iteration limit
          if (iteration === warningThreshold) {
            console.warn(`⚠️ Approaching iteration limit (${iteration}/${this.maxIterations})`)
            // Don't call onIterationStart again - it was already called at the start of this iteration
          }

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

    // Check if we hit max iterations - always notify regardless of message state
    console.warn(`⚠️ Hit max iterations (${this.maxIterations}) - loop may be incomplete`)
    console.log('Tool call history (last 5):', toolCallHistory.slice(-5))

    // Trigger error event with helpful context
    this.events.onError?.(
      new Error(
        `Maximum iterations reached (${this.maxIterations}). The operation may be incomplete. Consider breaking down complex requests into smaller parts.`
      ),
      this.maxIterations
    )
    this.events.onComplete?.(this.maxIterations)
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
