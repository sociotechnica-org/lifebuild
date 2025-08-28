import type { Store } from '@livestore/livestore'
import { ConversationHistory } from './conversation-history.js'
import { ToolExecutor } from './tool-executor.js'
import type { LLMProvider, AgenticLoopContext, AgenticLoopEvents, LLMMessage } from './types.js'

export class AgenticLoop {
  private history: ConversationHistory
  private toolExecutor: ToolExecutor
  private maxIterations: number

  constructor(
    private store: Store,
    private llmProvider: LLMProvider,
    private events: AgenticLoopEvents = {},
    initialHistory: LLMMessage[] = []
  ) {
    this.history = new ConversationHistory(initialHistory)
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
    // Initialize context - use server environment variables
    const envMaxIterations = process.env.LLM_MAX_ITERATIONS
      ? (() => {
          const parsed = parseInt(process.env.LLM_MAX_ITERATIONS, 10)
          return isNaN(parsed) ? 15 : Math.max(1, parsed) // Ensure positive integer
        })()
      : 15 // Prevent infinite loops - increased from 5 to 15 for complex multi-step operations

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
    let completedSuccessfully = false
    let retryAttempts = 0
    for (let iteration = 1; iteration <= this.maxIterations; iteration++) {
      try {
        this.events.onIterationStart?.(iteration)
        console.log(`🔄 Iteration ${iteration}/${this.maxIterations}`)

        // Call LLM with current history
        const response = await this.llmProvider.call(
          this.history.getMessages(),
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
            completedSuccessfully = true
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
        completedSuccessfully = true
        break
      } catch (error) {
        console.error(`❌ Error in iteration ${iteration}:`, error)
        const errorMessage = (error as Error).message || 'Unknown error'

        // Check if this is a transient error that we should retry
        const isTransientError = this.isTransientError(error)
        const shouldRetry =
          isTransientError && iteration < this.maxIterations - 1 && retryAttempts < 3

        if (shouldRetry) {
          retryAttempts++
          console.log(`🔄 Retrying after transient error (attempt ${retryAttempts}/3)...`)

          // Exponential backoff: 1s, 2s, 4s
          await this.delay(1000 * Math.pow(2, retryAttempts - 1))

          // Continue to retry the same iteration
          iteration-- // Decrement so the loop increment brings us back to the same iteration
          continue
        }

        // For non-transient errors or after max retries, emit error and complete gracefully
        console.error(`❌ Fatal error or max retries reached, aborting loop`)
        this.events.onError?.(error as Error, iteration)

        // Send user-friendly error message
        const userMessage = this.getUserFriendlyError(error)
        this.events.onFinalMessage?.(userMessage)
        this.events.onComplete?.(iteration)
        break
      }
    }

    // Only report max iterations error if we didn't complete successfully
    if (!completedSuccessfully) {
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

  /**
   * Get the current LLM provider
   */
  getLLMProvider(): LLMProvider {
    return this.llmProvider
  }

  /**
   * Check if an error is transient and should be retried
   */
  private isTransientError(error: unknown): boolean {
    const message = (error as Error).message?.toLowerCase() || ''

    // Network/timeout errors
    if (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnrefused') ||
      message.includes('socket hang up')
    ) {
      return true
    }

    // Rate limiting errors
    if (
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('too many requests')
    ) {
      return true
    }

    // Temporary API errors
    if (
      message.includes('503') ||
      message.includes('service unavailable') ||
      message.includes('502') ||
      message.includes('bad gateway')
    ) {
      return true
    }

    return false
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyError(error: unknown): string {
    const message = (error as Error).message?.toLowerCase() || ''

    if (message.includes('timeout')) {
      return 'The request took too long to complete. Please try again with a simpler request.'
    }

    if (message.includes('rate limit')) {
      return "We're experiencing high demand. Please wait a moment and try again."
    }

    if (message.includes('network')) {
      return 'There was a network issue. Please check your connection and try again.'
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      return 'Authentication failed. Please check your API credentials.'
    }

    return 'An error occurred while processing your request. Please try again or contact support if the issue persists.'
  }

  /**
   * Delay helper for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
