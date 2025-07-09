import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error UI when there is an error', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error
    console.error = vi.fn()

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(
      screen.getByText(
        'We encountered an unexpected error. This has been logged and will be investigated.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Reload Page')).toBeInTheDocument()

    // Restore console.error
    console.error = originalConsoleError
  })

  it('renders custom fallback when provided', () => {
    const originalConsoleError = console.error
    console.error = vi.fn()

    const CustomFallback = <div>Custom error message</div>

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()

    console.error = originalConsoleError
  })

  it('calls onError callback when error occurs', () => {
    const originalConsoleError = console.error
    console.error = vi.fn()

    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    )

    console.error = originalConsoleError
  })

  it('resets error state when Try Again is clicked', () => {
    const originalConsoleError = console.error
    console.error = vi.fn()

    let shouldThrow = true
    const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />

    const { rerender } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Click Try Again and change the state to not throw
    shouldThrow = false
    fireEvent.click(screen.getByText('Try Again'))

    // Rerender with no error
    rerender(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()

    console.error = originalConsoleError
  })

  it('shows error details in development mode', () => {
    const originalConsoleError = console.error
    const originalEnv = process.env.NODE_ENV
    console.error = vi.fn()
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument()

    console.error = originalConsoleError
    process.env.NODE_ENV = originalEnv
  })

  it('hides error details in production mode', () => {
    const originalConsoleError = console.error
    const originalEnv = process.env.NODE_ENV
    console.error = vi.fn()
    process.env.NODE_ENV = 'production'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument()

    console.error = originalConsoleError
    process.env.NODE_ENV = originalEnv
  })
})
