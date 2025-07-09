import { useCallback, useState } from 'react'

interface ErrorBoundaryState {
  error: Error | null
}

export function useErrorBoundary() {
  const [errorBoundaryState, setErrorBoundaryState] = useState<ErrorBoundaryState>({ error: null })

  const resetErrorBoundary = useCallback(() => {
    setErrorBoundaryState({ error: null })
  }, [])

  const captureError = useCallback((error: Error) => {
    setErrorBoundaryState({ error })
  }, [])

  return {
    hasError: errorBoundaryState.error !== null,
    error: errorBoundaryState.error,
    resetErrorBoundary,
    captureError,
  }
}
