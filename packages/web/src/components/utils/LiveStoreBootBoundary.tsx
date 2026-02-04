import React, { Component, ErrorInfo } from 'react'
import * as Sentry from '@sentry/react'
import { LiveStoreRepairPrompt } from './LiveStoreRepairPrompt.js'
import { isLiveStoreHeadMismatchError } from '../../utils/livestoreErrors.js'

interface LiveStoreBootBoundaryProps {
  children: React.ReactNode
  onRetry: () => void
  onRepair: () => void
}

interface LiveStoreBootBoundaryState {
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class LiveStoreBootBoundary extends Component<
  LiveStoreBootBoundaryProps,
  LiveStoreBootBoundaryState
> {
  constructor(props: LiveStoreBootBoundaryProps) {
    super(props)
    this.state = {
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<LiveStoreBootBoundaryState> {
    return {
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    })

    console.error('[LiveStore] Boot error:', error, errorInfo)

    Sentry.withScope(scope => {
      scope.setContext('react', {
        componentStack: errorInfo.componentStack,
      })
      scope.setTag('livestore', 'boot')
      Sentry.captureException(error)
    })
  }

  render() {
    const { error } = this.state
    if (!error) {
      return this.props.children
    }

    const isHeadMismatch = isLiveStoreHeadMismatchError(error)
    const details =
      process.env.NODE_ENV === 'development'
        ? `${error.toString()}${this.state.errorInfo?.componentStack ?? ''}`
        : undefined

    if (isHeadMismatch) {
      return (
        <LiveStoreRepairPrompt
          title='LiveStore needs repair'
          description='Local data on this device is out of sync with the server.'
          details='Repairing will clear local data and re-sync from the server. Server data will not be affected.'
          showRepairAction
          onConfirmRepair={this.props.onRepair}
          onRetry={this.props.onRetry}
          onReload={() => window.location.reload()}
        />
      )
    }

    return (
      <LiveStoreRepairPrompt
        title='LiveStore failed to start'
        description='We could not start the local data store.'
        details={details}
        onRetry={this.props.onRetry}
        onReload={() => window.location.reload()}
      />
    )
  }
}
