import type { IncomingMessage, ServerResponse } from 'http'
import type { WorkspaceReconciler } from '../services/workspace-reconciler.js'
import { operationLogger } from '../utils/logger.js'
import {
  createOrchestrationTelemetry,
  getIncidentDashboardUrl,
} from '../utils/orchestration-telemetry.js'

export interface ManualReconcileState {
  lastTriggeredAt: number | null
  inFlight: boolean
}

export interface ManualReconcileHandlerOptions {
  workspaceReconciler: WorkspaceReconciler
  serverBypassToken: string
  minIntervalMs: number
  state: ManualReconcileState
}

export const createManualReconcileState = (): ManualReconcileState => ({
  lastTriggeredAt: null,
  inFlight: false,
})

const respondJson = (res: ServerResponse, status: number, body: unknown): void => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const extractServerToken = (req: IncomingMessage): string | null => {
  const authHeader = req.headers['authorization']
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader
  if (typeof headerValue === 'string' && headerValue.toLowerCase().startsWith('bearer ')) {
    return headerValue.slice(7).trim()
  }

  const fallbackHeader = req.headers['x-server-token']
  const fallbackValue = Array.isArray(fallbackHeader) ? fallbackHeader[0] : fallbackHeader
  return typeof fallbackValue === 'string' ? fallbackValue.trim() : null
}

export const createManualReconcileHandler = (options: ManualReconcileHandlerOptions) => {
  const { workspaceReconciler, serverBypassToken, minIntervalMs, state } = options
  const log = operationLogger('workspace_reconciler.manual_trigger', {
    source: 'http',
  })

  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method !== 'POST') {
      respondJson(res, 405, { error: 'Method not allowed' })
      return
    }

    const token = extractServerToken(req)
    if (!token || token !== serverBypassToken) {
      respondJson(res, 401, { error: 'Unauthorized' })
      return
    }

    if (state.inFlight) {
      respondJson(res, 409, { error: 'Manual reconciliation already in progress' })
      return
    }

    const now = Date.now()
    if (state.lastTriggeredAt && now - state.lastTriggeredAt < minIntervalMs) {
      const retryAfterMs = minIntervalMs - (now - state.lastTriggeredAt)
      res.setHeader('Retry-After', Math.ceil(retryAfterMs / 1000).toString())
      respondJson(res, 429, {
        error: 'Manual reconciliation rate limited',
        retryAfterMs,
      })
      return
    }

    state.inFlight = true
    const telemetry = createOrchestrationTelemetry({
      operation: 'workspace_reconciler.manual_trigger',
      metadata: {
        source: 'http',
      },
      captureOnError: true,
    })

    log.info('Manual reconciliation requested')

    try {
      const result = await workspaceReconciler.reconcile()

      if (!result) {
        const { durationMs } = telemetry.recordSuccess({
          status: 'skipped_already_running',
        })
        log.warn(
          {
            durationMs,
            incidentDashboardUrl: getIncidentDashboardUrl(),
          },
          'Manual reconciliation skipped because another run is in progress'
        )
        respondJson(res, 409, {
          status: 'skipped',
          reason: 'reconcile_in_progress',
          durationMs,
        })
        return
      }

      state.lastTriggeredAt = Date.now()
      const driftCount =
        result.added.length +
        result.removed.length +
        result.failedAdds.length +
        result.failedRemovals.length
      const { durationMs } = telemetry.recordSuccess({
        status: 'completed',
        driftCount,
        added: result.added.length,
        removed: result.removed.length,
        failedAdds: result.failedAdds.length,
        failedRemovals: result.failedRemovals.length,
      })

      log.info(
        {
          durationMs,
          driftCount,
          incidentDashboardUrl: getIncidentDashboardUrl(),
        },
        'Manual reconciliation completed successfully'
      )

      respondJson(res, 200, {
        status: 'completed',
        durationMs,
        result,
        driftCount,
        incidentDashboardUrl: getIncidentDashboardUrl(),
        triggeredAt: new Date(state.lastTriggeredAt).toISOString(),
      })
    } catch (error) {
      const { durationMs } = telemetry.recordFailure(error, { status: 'failed' })
      log.error(
        { error, durationMs, incidentDashboardUrl: getIncidentDashboardUrl() },
        'Manual reconciliation failed'
      )
      respondJson(res, 500, {
        status: 'failed',
        error: 'Internal server error',
        durationMs,
      })
    } finally {
      state.inFlight = false
    }
  }
}
