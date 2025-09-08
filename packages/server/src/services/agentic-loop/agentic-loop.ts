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
   * Analyze task complexity and suggest appropriate iteration limit
   */
  private analyzeTaskComplexity(userMessage: string): {
    complexity: 'simple' | 'medium' | 'complex' | 'very-complex'
    suggestedLimit: number
    reasoning: string
  } {
    const message = userMessage.toLowerCase()

    // Complexity indicators
    const complexityIndicators = {
      simple: ['what is', 'explain', 'describe', 'show me', 'list', 'help with'],
      medium: ['create', 'write', 'build', 'make', 'add', 'implement', 'fix', 'update'],
      complex: [
        'refactor',
        'migrate',
        'integrate',
        'optimize',
        'analyze',
        'review',
        'multiple',
        'several',
        'many',
        'comprehensive',
      ],
      veryComplex: [
        'architecture',
        'system',
        'framework',
        'infrastructure',
        'deployment',
        'database',
        'api',
        'microservice',
        'full stack',
        'end-to-end',
      ],
    }

    // Count indicators
    let simpleCount = 0
    let mediumCount = 0
    let complexCount = 0
    let veryComplexCount = 0

    Object.entries(complexityIndicators).forEach(([level, indicators]) => {
      indicators.forEach(indicator => {
        if (message.includes(indicator)) {
          switch (level) {
            case 'simple':
              simpleCount++
              break
            case 'medium':
              mediumCount++
              break
            case 'complex':
              complexCount++
              break
            case 'veryComplex':
              veryComplexCount++
              break
          }
        }
      })
    })

    // Additional complexity factors
    const messageLength = userMessage.length
    const hasMultipleRequests =
      message.includes(' and ') || message.includes(',') || message.includes(';')
    const hasFileOperations =
      message.includes('file') || message.includes('directory') || message.includes('folder')
    const hasTestRequirements = message.includes('test') || message.includes('spec')

    // Determine complexity level
    let complexity: 'simple' | 'medium' | 'complex' | 'very-complex'
    let suggestedLimit: number
    let reasoning: string

    if (veryComplexCount > 0 || (complexCount >= 2 && messageLength > 200)) {
      complexity = 'very-complex'
      suggestedLimit = 50
      reasoning = 'Very complex task with architectural/system-level requirements'
    } else if (complexCount > 0 || (mediumCount >= 2 && hasMultipleRequests)) {
      complexity = 'complex'
      suggestedLimit = 40
      reasoning = 'Complex task requiring multiple operations or analysis'
    } else if (mediumCount > 0 || hasFileOperations || hasTestRequirements) {
      complexity = 'medium'
      suggestedLimit = 30
      reasoning = 'Medium complexity task with implementation work'
    } else {
      complexity = 'simple'
      suggestedLimit = 15
      reasoning = 'Simple task with limited operations required'
    }

    return { complexity, suggestedLimit, reasoning }
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
      : 30 // Default fallback

    // Analyze task complexity and adjust iterations accordingly
    const taskAnalysis = this.analyzeTaskComplexity(userMessage)
    console.log(
      `📊 Task complexity analysis: ${taskAnalysis.complexity} (${taskAnalysis.reasoning})`
    )
    console.log(`🎯 Suggested iteration limit: ${taskAnalysis.suggestedLimit}`)

    // Use context override, then environment variable, then task complexity suggestion, then default
    const initialMaxIterations =
      context.maxIterations || envMaxIterations || taskAnalysis.suggestedLimit
    this.maxIterations = initialMaxIterations

    // Get execution time limit from environment or context
    const envMaxExecutionTimeMs = process.env.LLM_MAX_EXECUTION_TIME_MS
      ? (() => {
          const parsed = parseInt(process.env.LLM_MAX_EXECUTION_TIME_MS, 10)
          return isNaN(parsed) ? 600000 : Math.max(30000, parsed) // Ensure at least 30 seconds
        })()
      : 600000 // Default 10 minutes

    const {
      boardContext,
      workerContext,
      workerId,
      model,
      allowContinuation = false,
      continuationIncrement = 15,
      maxExecutionTimeMs = envMaxExecutionTimeMs,
    } = context

    // Set worker ID on tool executor for proper actor tracking
    this.toolExecutor.setWorkerId(workerId)

    // Add user message to history
    this.history.addUserMessage(userMessage)
    console.log(`🚀 Starting agentic loop with message: "${userMessage.substring(0, 100)}..."`)
    console.log(
      `⏱️ Maximum execution time: ${Math.round(maxExecutionTimeMs / 1000 / 60)}m${Math.round((maxExecutionTimeMs % 60000) / 1000)}s`
    )

    // Time-based tracking
    const startTime = Date.now()

    // Track tool calls to detect stuck/infinite loops with improved intelligence
    const toolCallHistory: Array<{
      name: string
      args: string
      iteration: number
      timestamp: number
    }> = []
    const consecutiveCallCounts = new Map<string, number>() // Track consecutive calls per tool signature
    const toolCallResults = new Map<string, { success: boolean; result: string }[]>() // Track outcomes
    const warningThreshold = Math.floor(this.maxIterations * 0.8) // 80% of max iterations

    // Track productive vs unproductive iterations
    let consecutiveUnproductiveIterations = 0
    const maxConsecutiveUnproductive = 5 // Allow some unproductive iterations before flagging as stuck

    // Run the loop
    let completedSuccessfully = false
    for (let iteration = 1; iteration <= this.maxIterations; iteration++) {
      let retryAttempts = 0 // Reset retry counter for each iteration

      // Check time-based limit
      const elapsedTime = Date.now() - startTime
      if (elapsedTime > maxExecutionTimeMs) {
        console.warn(
          `⏱️ Maximum execution time exceeded (${Math.round(elapsedTime / 1000)}s / ${Math.round(maxExecutionTimeMs / 1000)}s)`
        )
        this.events.onError?.(
          new Error(
            `Maximum execution time exceeded (${Math.round(elapsedTime / 1000)}s). The operation took too long to complete.`
          ),
          iteration
        )
        this.events.onComplete?.(iteration)
        break
      }

      try {
        this.events.onIterationStart?.(iteration)
        const timeRemaining = maxExecutionTimeMs - elapsedTime
        console.log(
          `🔄 Iteration ${iteration}/${this.maxIterations} (${Math.round(elapsedTime / 1000)}s elapsed, ${Math.round(timeRemaining / 1000)}s remaining)`
        )

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
          // Enhanced loop detection with productivity tracking
          let isStuckLoop = false
          let isProductiveIteration = false

          for (const toolCall of response.toolCalls) {
            const toolSignature = `${toolCall.function.name}:${toolCall.function.arguments}`
            const currentTime = Date.now()

            // Check if this exact call was made recently (within last 5 iterations or 30 seconds)
            const recentIdenticalCalls = toolCallHistory.filter(
              tc =>
                tc.name === toolCall.function.name &&
                tc.args === toolCall.function.arguments &&
                (iteration - tc.iteration <= 5 || currentTime - tc.timestamp < 30000)
            )

            if (recentIdenticalCalls.length > 0) {
              const currentCount = (consecutiveCallCounts.get(toolSignature) || 0) + 1
              consecutiveCallCounts.set(toolSignature, currentCount)

              console.warn(
                `⚠️ Detected repeated tool call: ${toolCall.function.name} (${currentCount} times) - checking productivity`
              )

              // More lenient approach - allow repeated calls if they might be productive
              // Only flag as stuck if we have many consecutive identical calls with no progress
              if (currentCount >= 4) {
                // Check if previous calls with same signature were productive
                const previousResults = toolCallResults.get(toolSignature) || []
                const recentFailures = previousResults.slice(-3).filter(r => !r.success).length

                if (recentFailures >= 2) {
                  isStuckLoop = true
                  console.error('❌ Detected stuck loop - repeated failures with same tool call')
                  this.events.onError?.(
                    new Error(
                      `Stuck loop detected: Tool "${toolCall.function.name}" failing repeatedly with same arguments`
                    ),
                    iteration
                  )
                  break
                }
              }

              // This iteration made progress if it's trying something new or hasn't failed recently
              isProductiveIteration = currentCount <= 2 || recentIdenticalCalls.length === 1
            } else {
              consecutiveCallCounts.set(toolSignature, 0) // Reset counter for this specific tool call
              isProductiveIteration = true // New tool call is considered productive
            }

            toolCallHistory.push({
              name: toolCall.function.name,
              args: toolCall.function.arguments,
              iteration,
              timestamp: currentTime,
            })
          }

          // Update productivity tracking
          if (isProductiveIteration) {
            consecutiveUnproductiveIterations = 0
          } else {
            consecutiveUnproductiveIterations++
          }

          // Check for too many consecutive unproductive iterations
          if (consecutiveUnproductiveIterations >= maxConsecutiveUnproductive) {
            isStuckLoop = true
            console.error(
              `❌ Detected stuck loop - ${consecutiveUnproductiveIterations} consecutive unproductive iterations`
            )
            this.events.onError?.(
              new Error(
                `Stuck loop detected: ${consecutiveUnproductiveIterations} consecutive unproductive iterations`
              ),
              iteration
            )
          }

          if (isStuckLoop) {
            // Exit the loop if stuck
            this.events.onComplete?.(iteration)
            completedSuccessfully = true
            return
          }

          // Progressive limits with user continuation
          if (iteration === warningThreshold) {
            console.warn(`⚠️ Approaching iteration limit (${iteration}/${this.maxIterations})`)
            this.events.onIterationLimitApproaching?.(
              iteration,
              this.maxIterations,
              allowContinuation
            )

            if (allowContinuation && this.events.onRequestContinuation) {
              console.log(
                `🤔 Checking if user wants to continue beyond ${this.maxIterations} iterations...`
              )
              try {
                const shouldContinue = await this.events.onRequestContinuation(
                  iteration,
                  this.maxIterations
                )
                if (shouldContinue) {
                  const newLimit = this.maxIterations + continuationIncrement
                  console.log(
                    `✅ User approved continuation - extending limit from ${this.maxIterations} to ${newLimit}`
                  )
                  this.maxIterations = newLimit
                  // Recalculate warning threshold for the new limit
                  const newWarningThreshold = Math.floor(this.maxIterations * 0.8)
                  console.log(`📊 New warning threshold: ${newWarningThreshold}`)
                } else {
                  console.log(
                    `❌ User declined continuation - will stop at ${this.maxIterations} iterations`
                  )
                }
              } catch (error) {
                console.error(`❌ Error requesting continuation:`, error)
                // Continue with original limit if there's an error
              }
            }
          }

          // Add assistant message with tool calls
          this.history.addAssistantMessage(response.message || '', response.toolCalls)

          // Execute tools
          this.events.onToolsExecuting?.(response.toolCalls)
          const toolMessages = await this.toolExecutor.executeTools(response.toolCalls)

          // Track tool execution results for smart loop detection
          response.toolCalls.forEach((toolCall, index) => {
            const toolSignature = `${toolCall.function.name}:${toolCall.function.arguments}`
            const toolMessage = toolMessages[index]
            const wasSuccessful =
              toolMessage && !toolMessage.content.toLowerCase().includes('error')

            if (!toolCallResults.has(toolSignature)) {
              toolCallResults.set(toolSignature, [])
            }
            toolCallResults.get(toolSignature)!.push({
              success: wasSuccessful,
              result: toolMessage?.content.substring(0, 200) || '', // Store first 200 chars for analysis
            })

            // Keep only last 5 results per tool signature to prevent memory growth
            const results = toolCallResults.get(toolSignature)!
            if (results.length > 5) {
              results.shift()
            }
          })

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
