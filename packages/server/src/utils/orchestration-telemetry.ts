import * as Sentry from '@sentry/node'

const incidentDashboardUrl = process.env.ORCHESTRATION_INCIDENT_DASHBOARD_URL ?? null

/**
 * Checks if an error is an Effect.js FiberFailure.
 * FiberFailure objects have a specific structure with _id and cause properties.
 */
function isFiberFailure(error: unknown): error is { _id: 'FiberFailure'; cause: unknown } {
  return (
    typeof error === 'object' &&
    error !== null &&
    '_id' in error &&
    (error as Record<string, unknown>)._id === 'FiberFailure' &&
    'cause' in error
  )
}

/**
 * Extracts the underlying Error from an Effect.js FiberFailure or Cause structure.
 * Effect errors have nested cause structures that need to be unwrapped for Sentry to capture them properly.
 *
 * Structure: FiberFailure -> Cause (Fail/Die/Interrupt) -> failure -> cause (actual Error)
 */
function extractEffectError(error: unknown): Error | unknown {
  // If it's already a standard Error, return it
  if (error instanceof Error) {
    return error
  }

  // Handle FiberFailure from Effect.js
  if (isFiberFailure(error)) {
    const cause = error.cause as Record<string, unknown> | undefined
    if (cause && typeof cause === 'object') {
      // Check for Fail/Die patterns
      const failure = cause.failure
      // Handle Effect.fail(new Error(...)) where failure is directly an Error
      if (failure instanceof Error) {
        return failure
      }
      if (failure && typeof failure === 'object') {
        // The actual error is in failure.cause (for wrapped errors like LiveStore.UnknownError)
        const underlyingCause = (failure as Record<string, unknown>).cause
        if (underlyingCause instanceof Error) {
          return underlyingCause
        }
        // If cause is not an Error, try to create one from the message
        if (underlyingCause && typeof underlyingCause === 'object') {
          const msg =
            (underlyingCause as Record<string, unknown>).message ||
            ((failure as Record<string, unknown>)._tag
              ? `${(failure as Record<string, unknown>)._tag}: ${JSON.stringify(failure)}`
              : String(failure))
          const extractedError = new Error(String(msg))
          extractedError.name = String((failure as Record<string, unknown>)._tag || 'EffectError')
          return extractedError
        }
      }
      // For defects (Die), the error might be directly in cause.defect
      const defect = cause.defect
      if (defect instanceof Error) {
        return defect
      }
    }
  }

  // Return the original error if we couldn't extract anything
  return error
}

/**
 * Unwraps an error for Sentry capture.
 * Handles Effect.js FiberFailure errors which Sentry doesn't recognize as standard Errors.
 */
export function unwrapErrorForSentry(error: unknown): Error | unknown {
  return extractEffectError(error)
}

interface TelemetryOptions {
  operation: string
  storeId?: string
  metadata?: Record<string, unknown>
  captureOnError?: boolean
}

interface TelemetryResult {
  durationMs: number
  breadcrumbData: Record<string, unknown>
}

export interface OrchestrationTelemetry {
  recordSuccess(extra?: Record<string, unknown>): TelemetryResult
  recordFailure(error: unknown, extra?: Record<string, unknown>): TelemetryResult
}

export function createOrchestrationTelemetry(options: TelemetryOptions): OrchestrationTelemetry {
  const start = process.hrtime.bigint()
  const baseData = {
    ...options.metadata,
    operation: options.operation,
    storeId: options.storeId,
    incidentDashboardUrl,
  }

  Sentry.addBreadcrumb({
    category: 'workspace_orchestration',
    message: `${options.operation} started`,
    level: 'info',
    data: baseData,
  })

  const getDuration = (): number => {
    const end = process.hrtime.bigint()
    const diffNs = end - start
    return Number(diffNs / BigInt(1_000_000))
  }

  const serializeError = (error: unknown): Record<string, unknown> => {
    // Unwrap Effect.js FiberFailure errors for better serialization
    const unwrapped = unwrapErrorForSentry(error)

    if (unwrapped instanceof Error) {
      return {
        name: unwrapped.name,
        message: unwrapped.message,
        stack: unwrapped.stack,
      }
    }

    return {
      message: String(unwrapped),
    }
  }

  const addSuccessBreadcrumb = (data: Record<string, unknown>): void => {
    Sentry.addBreadcrumb({
      category: 'workspace_orchestration',
      message: `${options.operation} succeeded`,
      level: 'info',
      data,
    })
  }

  const addFailureBreadcrumb = (data: Record<string, unknown>): void => {
    Sentry.addBreadcrumb({
      category: 'workspace_orchestration',
      message: `${options.operation} failed`,
      level: 'error',
      data,
    })
  }

  const captureFailure = (error: unknown, data: Record<string, unknown>): void => {
    if (!options.captureOnError) {
      return
    }

    // Unwrap Effect.js FiberFailure errors for proper Sentry capture
    const unwrappedError = unwrapErrorForSentry(error)

    Sentry.withScope(scope => {
      scope.setTag('workspace_orchestration.operation', options.operation)
      if (options.storeId) {
        scope.setTag('workspace_orchestration.store_id', options.storeId)
      }
      scope.setContext('workspace_orchestration', data)
      scope.setLevel('error')
      Sentry.captureException(unwrappedError)
    })
  }

  return {
    recordSuccess(extra = {}) {
      const durationMs = getDuration()
      const data = {
        ...baseData,
        ...extra,
        durationMs,
        status: 'success',
      }
      addSuccessBreadcrumb(data)
      return { durationMs, breadcrumbData: data }
    },
    recordFailure(error, extra = {}) {
      const durationMs = getDuration()
      const data = {
        ...baseData,
        ...extra,
        durationMs,
        status: 'error',
        error: serializeError(error),
      }
      addFailureBreadcrumb(data)
      captureFailure(error, data)
      return { durationMs, breadcrumbData: data }
    },
  }
}

export function getIncidentDashboardUrl(): string | null {
  return incidentDashboardUrl
}
