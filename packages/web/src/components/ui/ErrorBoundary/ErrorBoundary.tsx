import React, { Component, ReactNode, ErrorInfo } from 'react'
import * as Sentry from '@sentry/react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Send error to Sentry with React component stack trace
    Sentry.withScope(scope => {
      scope.setContext('react', {
        componentStack: errorInfo.componentStack,
      })
      Sentry.captureException(error)
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
          <div className='max-w-md w-full'>
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <div className='flex items-center mb-4'>
                <div className='flex-shrink-0'>
                  <svg
                    className='h-8 w-8 text-red-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z'
                    />
                  </svg>
                </div>
                <div className='ml-3'>
                  <h3 className='text-lg font-medium text-gray-900'>Something went wrong</h3>
                </div>
              </div>

              <div className='mb-4'>
                <p className='text-sm text-gray-600'>
                  We encountered an unexpected error. This has been logged and will be investigated.
                </p>
              </div>

              <div className='flex gap-3'>
                <button
                  onClick={this.handleRetry}
                  className='flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors'
                >
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className='flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors'
                >
                  Reload Page
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className='mt-4'>
                  <summary className='text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900'>
                    Error Details (Development Only)
                  </summary>
                  <div className='mt-2 p-3 bg-red-50 rounded-md'>
                    <pre className='text-xs text-red-800 whitespace-pre-wrap break-all'>
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
