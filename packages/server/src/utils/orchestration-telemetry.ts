import * as Sentry from '@sentry/node'

const incidentDashboardUrl = process.env.ORCHESTRATION_INCIDENT_DASHBOARD_URL ?? null

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
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }

    return {
      message: String(error),
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

    Sentry.withScope(scope => {
      scope.setTag('workspace_orchestration.operation', options.operation)
      if (options.storeId) {
        scope.setTag('workspace_orchestration.store_id', options.storeId)
      }
      scope.setContext('workspace_orchestration', data)
      scope.setLevel('error')
      Sentry.captureException(error)
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
