import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useErrorBoundary } from '../../src/hooks/useErrorBoundary'

describe('useErrorBoundary', () => {
  it('initializes with no error', () => {
    const { result } = renderHook(() => useErrorBoundary())

    expect(result.current.hasError).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('captures error when captureError is called', () => {
    const { result } = renderHook(() => useErrorBoundary())
    const testError = new Error('Test error')

    act(() => {
      result.current.captureError(testError)
    })

    expect(result.current.hasError).toBe(true)
    expect(result.current.error).toBe(testError)
  })

  it('resets error state when resetErrorBoundary is called', () => {
    const { result } = renderHook(() => useErrorBoundary())
    const testError = new Error('Test error')

    act(() => {
      result.current.captureError(testError)
    })

    expect(result.current.hasError).toBe(true)
    expect(result.current.error).toBe(testError)

    act(() => {
      result.current.resetErrorBoundary()
    })

    expect(result.current.hasError).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('maintains stable function references', () => {
    const { result, rerender } = renderHook(() => useErrorBoundary())

    const initialResetFn = result.current.resetErrorBoundary
    const initialCaptureFn = result.current.captureError

    rerender()

    expect(result.current.resetErrorBoundary).toBe(initialResetFn)
    expect(result.current.captureError).toBe(initialCaptureFn)
  })
})
