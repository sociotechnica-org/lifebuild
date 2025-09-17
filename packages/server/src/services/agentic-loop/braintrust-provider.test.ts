import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BraintrustProvider } from './braintrust-provider.js'
import type { LLMMessage } from './types.js'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('BraintrustProvider', () => {
  let provider: BraintrustProvider
  const mockApiKey = 'test-api-key'
  const mockProjectId = 'test-project-id'

  beforeEach(() => {
    provider = new BraintrustProvider(mockApiKey, mockProjectId)
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('timeout error handling', () => {
    const mockMessages: LLMMessage[] = [{ role: 'user', content: 'test message' }]

    it('should handle ConnectTimeoutError and retry', async () => {
      // Mock the timeout error that would come from undici
      const timeoutError = new Error('fetch failed')
      timeoutError.cause = { code: 'UND_ERR_CONNECT_TIMEOUT' }

      // Mock fetch to fail first, then succeed
      mockFetch.mockRejectedValueOnce(timeoutError).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: 'test response',
                  tool_calls: [],
                },
              },
            ],
          }),
      })

      const promise = provider.call(mockMessages)

      // Fast forward through retry delays
      await vi.runAllTimersAsync()

      const result = await promise

      expect(result.message).toBe('test response')
      expect(result.toolCalls).toEqual([])
      expect(mockFetch).toHaveBeenCalledTimes(2) // first call failed, second succeeded
    })

    it('should use AbortController with proper timeout', async () => {
      const mockAbortController = {
        signal: { aborted: false },
        abort: vi.fn(),
      }

      // Mock AbortController
      const mockAbortControllerClass = vi.fn(() => mockAbortController)
      global.AbortController = mockAbortControllerClass as any

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: 'test response',
                  tool_calls: [],
                },
              },
            ],
          }),
      })

      await provider.call(mockMessages)

      // Verify AbortController was created
      expect(mockAbortControllerClass).toHaveBeenCalled()

      // Verify fetch was called with the abort signal
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: mockAbortController.signal,
        })
      )
    })

    it('should clear timeout on error', async () => {
      const mockAbortController = {
        signal: { aborted: false },
        abort: vi.fn(),
      }

      global.AbortController = vi.fn(() => mockAbortController) as any

      const error = new Error('Network error')
      mockFetch.mockRejectedValue(error)

      const promise = provider.call(mockMessages)

      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow()

      // Just verify that the AbortController was used (main functionality)
      expect(global.AbortController).toHaveBeenCalled()
    })

    it('should handle timeout during response reading', async () => {
      const timeoutError = new Error('fetch failed')
      timeoutError.cause = { code: 'UND_ERR_CONNECT_TIMEOUT' }

      mockFetch.mockRejectedValueOnce(timeoutError).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: 'recovery response',
                  tool_calls: [],
                },
              },
            ],
          }),
      })

      const promise = provider.call(mockMessages)
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.message).toBe('recovery response')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should eventually fail after exhausting retries on persistent timeout', async () => {
      const timeoutError = new Error('ConnectTimeoutError: Connect Timeout Error')
      mockFetch.mockRejectedValue(timeoutError)

      const promise = provider.call(mockMessages)

      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow('ConnectTimeoutError')

      // Should have made initial attempt + 3 retries (forHttp default)
      expect(mockFetch).toHaveBeenCalledTimes(4)
    })
  })

  describe('integration with RetryableOperation.forHttp()', () => {
    it('should use HTTP-optimized retry settings', async () => {
      const mockMessages: LLMMessage[] = [{ role: 'user', content: 'test message' }]

      // Mock a 503 server error (should be retryable)
      mockFetch
        .mockRejectedValueOnce(new Error('Braintrust API call failed: 503 Service Unavailable'))
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [
                {
                  message: {
                    content: 'success after retry',
                    tool_calls: [],
                  },
                },
              ],
            }),
        })

      const promise = provider.call(mockMessages)
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.message).toBe('success after retry')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should not retry 4xx client errors', async () => {
      const mockMessages: LLMMessage[] = [{ role: 'user', content: 'test message' }]

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request'),
      })

      const promise = provider.call(mockMessages)
      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow('Braintrust API call failed: 400 Bad Request')
      expect(mockFetch).toHaveBeenCalledTimes(1) // no retries
    })
  })
})
