import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RetryableOperation } from './retryable-operation.js'

describe('RetryableOperation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic retry functionality', () => {
    it('should execute operation successfully on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success')
      const retryable = new RetryableOperation({ maxRetries: 3 })

      const result = await retryable.execute(operation)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success')

      const retryable = new RetryableOperation({
        maxRetries: 3,
        baseDelay: 100
      })

      const executePromise = retryable.execute(operation)

      // Fast forward through retry delays
      for (let i = 0; i < 3; i++) {
        await vi.advanceTimersByTimeAsync(200) // More than base delay
      }

      const result = await executePromise

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should fail after max retries exceeded', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent error'))

      const retryable = new RetryableOperation({
        maxRetries: 2,
        baseDelay: 100
      })

      const executePromise = retryable.execute(operation)

      // Fast forward through all retry delays
      for (let i = 0; i < 5; i++) {
        await vi.advanceTimersByTimeAsync(1000)
      }

      await expect(executePromise).rejects.toThrow('Persistent error')
      expect(operation).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })
  })

  describe('Retry conditions', () => {
    it('should not retry non-retryable errors by default', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Validation failed'))

      const retryable = new RetryableOperation({ maxRetries: 3 })

      await expect(retryable.execute(operation)).rejects.toThrow('Validation failed')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry network errors by default', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success')

      const retryable = new RetryableOperation({
        maxRetries: 2,
        baseDelay: 100
      })

      const executePromise = retryable.execute(operation)
      await vi.advanceTimersByTimeAsync(200)
      const result = await executePromise

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should retry 5xx HTTP errors by default', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('HTTP call failed: 500 Internal Server Error'))
        .mockResolvedValue('success')

      const retryable = new RetryableOperation({
        maxRetries: 2,
        baseDelay: 100
      })

      const executePromise = retryable.execute(operation)
      await vi.advanceTimersByTimeAsync(200)
      const result = await executePromise

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should not retry 4xx HTTP errors by default', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('HTTP call failed: 400 Bad Request'))

      const retryable = new RetryableOperation({ maxRetries: 3 })

      await expect(retryable.execute(operation)).rejects.toThrow('400 Bad Request')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should use custom retry condition', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Custom error'))
        .mockResolvedValue('success')

      const retryable = new RetryableOperation({
        maxRetries: 2,
        baseDelay: 100,
        retryCondition: (error) => error.message.includes('Custom')
      })

      const executePromise = retryable.execute(operation)
      await vi.advanceTimersByTimeAsync(200)
      const result = await executePromise

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('Exponential backoff', () => {
    it('should increase delay exponentially', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success')

      const onRetry = vi.fn()
      const retryable = new RetryableOperation({
        maxRetries: 3,
        baseDelay: 1000,
        backoffMultiplier: 2,
        jitterMax: 0, // No jitter for predictable testing
        onRetry
      })

      const executePromise = retryable.execute(operation)

      // First retry should be around 1000ms
      await vi.advanceTimersByTimeAsync(1000)
      // Second retry should be around 2000ms
      await vi.advanceTimersByTimeAsync(2000)
      
      const result = await executePromise

      expect(result).toBe('success')
      expect(onRetry).toHaveBeenCalledTimes(2)
      
      // Check that delays increased
      const [firstCall, secondCall] = onRetry.mock.calls
      expect(firstCall[2]).toBe(1000) // First delay
      expect(secondCall[2]).toBe(2000) // Second delay (doubled)
    })

    it('should respect maximum delay', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success')

      const onRetry = vi.fn()
      const retryable = new RetryableOperation({
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 1500, // Cap delay at 1.5 seconds
        backoffMultiplier: 3,
        jitterMax: 0,
        onRetry
      })

      const executePromise = retryable.execute(operation)
      await vi.advanceTimersByTimeAsync(1500)
      const result = await executePromise

      expect(result).toBe('success')
      expect(onRetry).toHaveBeenCalledWith(1, 2, 1500, expect.any(Error))
    })

    it('should add jitter to prevent thundering herd', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success')

      const onRetry = vi.fn()
      
      // Mock Math.random to return predictable values
      const originalRandom = Math.random
      Math.random = vi.fn().mockReturnValue(0.5) // 50% jitter

      const retryable = new RetryableOperation({
        maxRetries: 2,
        baseDelay: 1000,
        jitterMax: 0.1, // 10% jitter
        backoffMultiplier: 1,
        onRetry
      })

      const executePromise = retryable.execute(operation)
      await vi.advanceTimersByTimeAsync(1050) // Base delay + 5% jitter
      const result = await executePromise

      expect(result).toBe('success')
      expect(onRetry).toHaveBeenCalledWith(1, 2, 1050, expect.any(Error))

      Math.random = originalRandom
    })
  })

  describe('Statistics and monitoring', () => {
    it('should return execution statistics', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success')

      const retryable = new RetryableOperation({
        maxRetries: 2,
        baseDelay: 100
      })

      const executePromise = retryable.executeWithStats(operation)
      await vi.advanceTimersByTimeAsync(200)
      const result = await executePromise

      expect(result.result).toBe('success')
      expect(result.attemptCount).toBe(2)
      expect(result.totalDuration).toBeGreaterThan(100)
    })

    it('should call onRetry callback with correct parameters', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValue('success')

      const onRetry = vi.fn()
      const retryable = new RetryableOperation({
        maxRetries: 3,
        baseDelay: 100,
        onRetry
      })

      const executePromise = retryable.execute(operation)
      
      // Fast forward through retries
      for (let i = 0; i < 3; i++) {
        await vi.advanceTimersByTimeAsync(500)
      }
      
      await executePromise

      expect(onRetry).toHaveBeenCalledTimes(2)
      
      // First retry
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, 3, expect.any(Number), expect.objectContaining({
        message: 'ECONNRESET'
      }))
      
      // Second retry
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, 3, expect.any(Number), expect.objectContaining({
        message: 'ETIMEDOUT'
      }))
    })
  })

  describe('Pre-configured strategies', () => {
    it('should create HTTP-optimized retryable operation', async () => {
      const httpRetryable = RetryableOperation.forHttp()
      
      // Should retry 5xx errors
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('fetch failed: 500'))
        .mockResolvedValue('success')

      const executePromise = httpRetryable.execute(operation)
      await vi.advanceTimersByTimeAsync(2000)
      const result = await executePromise

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should create database-optimized retryable operation', async () => {
      const dbRetryable = RetryableOperation.forDatabase()
      
      // Should retry database connection errors
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('database connection timeout'))
        .mockResolvedValue('success')

      const executePromise = dbRetryable.execute(operation)
      await vi.advanceTimersByTimeAsync(1000)
      const result = await executePromise

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should create aggressive retry strategy', async () => {
      const aggressiveRetryable = RetryableOperation.aggressive()
      
      // Should retry any error
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Any error'))
        .mockResolvedValue('success')

      const executePromise = aggressiveRetryable.execute(operation)
      await vi.advanceTimersByTimeAsync(1000)
      const result = await executePromise

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should create conservative retry strategy', async () => {
      const conservativeRetryable = RetryableOperation.conservative()
      
      // Should only retry obvious network errors
      const validationError = vi.fn().mockRejectedValue(new Error('Validation failed'))
      const networkError = vi.fn()
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockResolvedValue('success')

      // Should not retry validation error
      await expect(conservativeRetryable.execute(validationError)).rejects.toThrow('Validation failed')
      expect(validationError).toHaveBeenCalledTimes(1)

      // Should retry network error
      const executePromise = conservativeRetryable.execute(networkError)
      await vi.advanceTimersByTimeAsync(3000)
      const result = await executePromise

      expect(result).toBe('success')
      expect(networkError).toHaveBeenCalledTimes(2)
    })
  })

  describe('Concurrent operations', () => {
    it('should execute multiple operations with individual retry logic', async () => {
      const op1 = vi.fn().mockResolvedValue('result1')
      const op2 = vi.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('result2')
      const op3 = vi.fn().mockResolvedValue('result3')

      const executePromise = RetryableOperation.executeAll([op1, op2, op3], {
        maxRetries: 2,
        baseDelay: 100
      })

      await vi.advanceTimersByTimeAsync(200)
      const results = await executePromise

      expect(results).toEqual(['result1', 'result2', 'result3'])
      expect(op1).toHaveBeenCalledTimes(1)
      expect(op2).toHaveBeenCalledTimes(2) // Retried once
      expect(op3).toHaveBeenCalledTimes(1)
    })

    it('should execute operations with different strategies', async () => {
      const httpOp = vi.fn()
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockResolvedValue('http-result')
      
      const dbOp = vi.fn()
        .mockRejectedValueOnce(new Error('database locked'))
        .mockResolvedValue('db-result')

      const executePromise = RetryableOperation.executeWithStrategies([
        { operation: httpOp, strategy: RetryableOperation.forHttp() },
        { operation: dbOp, strategy: RetryableOperation.forDatabase() }
      ])

      await vi.advanceTimersByTimeAsync(2000)
      const results = await executePromise

      expect(results).toEqual(['http-result', 'db-result'])
      expect(httpOp).toHaveBeenCalledTimes(2)
      expect(dbOp).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error handling edge cases', () => {
    it('should handle non-Error thrown values', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce('string error')
        .mockResolvedValue('success')

      const retryable = new RetryableOperation({
        maxRetries: 2,
        baseDelay: 100,
        retryCondition: () => true
      })

      const executePromise = retryable.execute(operation)
      await vi.advanceTimersByTimeAsync(200)
      const result = await executePromise

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should preserve original error after all retries fail', async () => {
      const originalError = new Error('Original error with context')
      const operation = vi.fn().mockRejectedValue(originalError)

      const retryable = new RetryableOperation({ maxRetries: 1, baseDelay: 100 })

      const executePromise = retryable.execute(operation)
      await vi.advanceTimersByTimeAsync(200)

      await expect(executePromise).rejects.toBe(originalError)
    })
  })
})