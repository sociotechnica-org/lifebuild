interface RetryOptions {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitterMax: number
  retryCondition?: (error: Error) => boolean
  onRetry?: (attempt: number, maxRetries: number, delayMs: number, error: Error) => void
}

interface RetryResult<T> {
  result: T
  attemptCount: number
  totalDuration: number
}

export class RetryableOperation<T = any> {
  private static readonly DEFAULT_OPTIONS: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    jitterMax: 0.1, // 10% jitter
    retryCondition: (error: Error) => {
      // Retry on network errors, timeouts, and 5xx server errors
      if (error.message.includes('ECONNRESET') ||
          error.message.includes('ENOTFOUND') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('timeout')) {
        return true
      }
      
      // Retry on HTTP 5xx errors if error message contains status code
      const statusMatch = error.message.match(/(\d{3})/)
      if (statusMatch) {
        const status = parseInt(statusMatch[1])
        return status >= 500 && status < 600
      }
      
      return false
    }
  }

  constructor(private options: Partial<RetryOptions> = {}) {
    this.options = { ...RetryableOperation.DEFAULT_OPTIONS, ...options }
  }

  /**
   * Execute an operation with retry logic
   */
  async execute(operation: () => Promise<T>): Promise<T> {
    const result = await this.executeWithStats(operation)
    return result.result
  }

  /**
   * Execute an operation with retry logic and return detailed stats
   */
  async executeWithStats(operation: () => Promise<T>): Promise<RetryResult<T>> {
    const startTime = Date.now()
    const options = this.options as RetryOptions
    let lastError: Error

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        const result = await operation()
        const totalDuration = Date.now() - startTime
        
        if (attempt > 0) {
          console.log(`✅ Operation succeeded after ${attempt + 1} attempts (${totalDuration}ms)`)
        }
        
        return {
          result,
          attemptCount: attempt + 1,
          totalDuration
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Don't retry on the last attempt
        if (attempt === options.maxRetries) {
          break
        }
        
        // Check if we should retry this error
        if (options.retryCondition && !options.retryCondition(lastError)) {
          console.log(`❌ Non-retryable error: ${lastError.message}`)
          break
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, options)
        
        console.warn(`⚠️ Attempt ${attempt + 1} failed: ${lastError.message}. Retrying in ${delay}ms...`)
        
        // Notify about retry attempt
        options.onRetry?.(attempt + 1, options.maxRetries, delay, lastError)
        
        // Wait before retrying
        await this.sleep(delay)
      }
    }
    
    const totalDuration = Date.now() - startTime
    console.error(`❌ Operation failed after ${options.maxRetries + 1} attempts (${totalDuration}ms)`)
    throw lastError
  }

  /**
   * Calculate delay for the given attempt with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, options: RetryOptions): number {
    // Exponential backoff: baseDelay * (backoffMultiplier ^ attempt)
    const exponentialDelay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt)
    
    // Cap at maxDelay
    const cappedDelay = Math.min(exponentialDelay, options.maxDelay)
    
    // Add jitter to avoid thundering herd
    const jitter = cappedDelay * options.jitterMax * Math.random()
    const finalDelay = cappedDelay + jitter
    
    return Math.floor(finalDelay)
  }

  /**
   * Sleep for the specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Create a retryable operation optimized for HTTP calls
   */
  static forHttp(customOptions?: Partial<RetryOptions>): RetryableOperation {
    return new RetryableOperation({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitterMax: 0.1,
      retryCondition: (error: Error) => {
        // Retry on network errors
        if (error.message.includes('fetch failed') ||
            error.message.includes('ECONNRESET') ||
            error.message.includes('ENOTFOUND') ||
            error.message.includes('ETIMEDOUT')) {
          return true
        }
        
        // Retry on 5xx server errors and 429 rate limiting
        const statusMatch = error.message.match(/(\d{3})/)
        if (statusMatch) {
          const status = parseInt(statusMatch[1])
          return status === 429 || (status >= 500 && status < 600)
        }
        
        return false
      },
      ...customOptions
    })
  }

  /**
   * Create a retryable operation optimized for database operations
   */
  static forDatabase(customOptions?: Partial<RetryOptions>): RetryableOperation {
    return new RetryableOperation({
      maxRetries: 5,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 1.5,
      jitterMax: 0.2,
      retryCondition: (error: Error) => {
        const message = error.message.toLowerCase()
        
        // Retry on temporary database issues
        return message.includes('connection') ||
               message.includes('timeout') ||
               message.includes('busy') ||
               message.includes('locked') ||
               message.includes('deadlock') ||
               message.includes('constraint') && message.includes('temporary')
      },
      ...customOptions
    })
  }

  /**
   * Create a retryable operation with aggressive retry settings
   */
  static aggressive(customOptions?: Partial<RetryOptions>): RetryableOperation {
    return new RetryableOperation({
      maxRetries: 10,
      baseDelay: 500,
      maxDelay: 60000,
      backoffMultiplier: 1.8,
      jitterMax: 0.15,
      retryCondition: () => true, // Retry all errors
      ...customOptions
    })
  }

  /**
   * Create a retryable operation with conservative retry settings
   */
  static conservative(customOptions?: Partial<RetryOptions>): RetryableOperation {
    return new RetryableOperation({
      maxRetries: 2,
      baseDelay: 2000,
      maxDelay: 10000,
      backoffMultiplier: 3,
      jitterMax: 0.05,
      retryCondition: (error: Error) => {
        // Only retry obvious network/timeout errors
        const message = error.message.toLowerCase()
        return message.includes('network') ||
               message.includes('timeout') ||
               message.includes('econnreset')
      },
      ...customOptions
    })
  }

  /**
   * Execute multiple operations concurrently with individual retry logic
   */
  static async executeAll<T>(
    operations: Array<() => Promise<T>>,
    retryOptions?: Partial<RetryOptions>
  ): Promise<T[]> {
    const retryableOp = new RetryableOperation(retryOptions)
    
    const promises = operations.map(op => retryableOp.execute(op))
    return Promise.all(promises)
  }

  /**
   * Execute multiple operations with different retry strategies
   */
  static async executeWithStrategies<T>(
    operationsWithStrategies: Array<{
      operation: () => Promise<T>
      strategy: RetryableOperation<T>
    }>
  ): Promise<T[]> {
    const promises = operationsWithStrategies.map(({ operation, strategy }) => 
      strategy.execute(operation)
    )
    
    return Promise.all(promises)
  }
}