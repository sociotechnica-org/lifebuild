import { describe, expect, vi, it } from 'vitest'
import { BraintrustProvider, RateLimitError } from './braintrust-provider.js'

const messages: any[] = [{ role: 'user', content: 'hi' }]

describe('BraintrustProvider', () => {
  it('retries on rate limit errors', async () => {
    vi.useFakeTimers()
    const provider = new BraintrustProvider()
    const fetchMock = vi.fn()
    ;(globalThis as any).fetch = fetchMock

    fetchMock
      .mockResolvedValueOnce({ status: 529, ok: false, text: () => Promise.resolve('busy') })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ message: 'ok', toolCalls: [] }),
      })

    const onRetry = vi.fn()

    const promise = provider.call(messages, undefined, undefined, undefined, {
      onRetry,
    })
    await vi.runAllTimersAsync()
    const result = await promise
    vi.useRealTimers()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(result.message).toBe('ok')
  })

  it('throws RateLimitError after max retries', async () => {
    vi.useFakeTimers()
    const provider = new BraintrustProvider()
    const fetchMock = vi.fn()
    ;(globalThis as any).fetch = fetchMock

    fetchMock.mockResolvedValue({ status: 529, ok: false, text: () => Promise.resolve('busy') })
    const promise = provider.call(messages, undefined, undefined, undefined, {
      onRetry: () => {},
    })
    const expectation = expect(promise).rejects.toBeInstanceOf(RateLimitError)
    await vi.runAllTimersAsync()
    await expectation
    vi.useRealTimers()
  })
})
