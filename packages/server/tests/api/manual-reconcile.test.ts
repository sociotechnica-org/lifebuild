import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'http'
import type {
  ReconciliationResult,
  WorkspaceReconciler,
  WorkspaceReconcilerStatus,
} from '../../src/services/workspace-reconciler.js'
import {
  createManualReconcileHandler,
  createManualReconcileState,
  type ManualReconcileState,
} from '../../src/api/manual-reconcile.js'

type EnabledStatus = Extract<WorkspaceReconcilerStatus, { enabled: true }>

const createEnabledStatus = (overrides: Partial<EnabledStatus> = {}): EnabledStatus => ({
  enabled: true,
  intervalMs: 60_000,
  isRunning: false,
  lastRunStartedAt: undefined,
  lastRunCompletedAt: undefined,
  lastSuccessAt: undefined,
  lastDurationMs: undefined,
  totals: { runs: 0, successes: 0, failures: 0 },
  lastResult: undefined,
  lastError: undefined,
  ...overrides,
})

const createRequest = (options?: {
  method?: string
  headers?: Record<string, string>
}): IncomingMessage => {
  const method = options?.method ?? 'POST'
  const headerEntries = Object.entries(options?.headers ?? {}).map(([key, value]) => [
    key.toLowerCase(),
    value,
  ])

  return {
    method,
    headers: Object.fromEntries(headerEntries),
  } as unknown as IncomingMessage
}

const createResponse = () => {
  let statusCode: number | null = null
  const headers: Record<string, string> = {}
  let body: string | null = null

  const res: Partial<ServerResponse> = {}

  res.writeHead = (status: number, responseHeaders?: Record<string, string>) => {
    statusCode = status
    if (responseHeaders) {
      for (const [key, value] of Object.entries(responseHeaders)) {
        headers[key.toLowerCase()] = value
      }
    }
  }

  res.setHeader = (key: string, value: string | number) => {
    headers[key.toLowerCase()] = String(value)
  }

  res.end = (payload?: string | Buffer | undefined) => {
    body = payload ? payload.toString() : null
  }

  return {
    res: res as ServerResponse,
    getStatus: () => statusCode,
    getHeader: (key: string) => headers[key.toLowerCase()],
    getBody: <T>() => (body ? (JSON.parse(body) as T) : null),
  }
}

describe('manual reconcile handler', () => {
  let reconciler: WorkspaceReconciler
  let state: ManualReconcileState
  let status: EnabledStatus
  const token = 'secret-token'
  const minIntervalMs = 60_000

  const mockResult: ReconciliationResult = {
    added: ['workspace-1'],
    removed: [],
    failedAdds: [],
    failedRemovals: [],
    authoritativeCount: 1,
    monitoredCount: 1,
    driftCount: 0,
  }

  beforeEach(() => {
    state = createManualReconcileState()
    status = createEnabledStatus()
    reconciler = {
      reconcile: vi.fn().mockResolvedValue(mockResult),
      stop: vi.fn(),
      start: vi.fn(),
      getStatus: vi.fn(() => status),
    } as unknown as WorkspaceReconciler
  })

  it('rejects requests without valid authentication', async () => {
    const handler = createManualReconcileHandler({
      workspaceReconciler: reconciler,
      serverBypassToken: token,
      minIntervalMs,
      state,
    })

    const { res, getStatus, getBody } = createResponse()

    await handler(createRequest(), res)

    expect(getStatus()).toBe(401)
    expect(getBody<{ error: string }>()?.error).toBe('Unauthorized')
    expect((reconciler.reconcile as any)).not.toHaveBeenCalled()
  })

  it('runs reconciliation and updates state on success', async () => {
    const handler = createManualReconcileHandler({
      workspaceReconciler: reconciler,
      serverBypassToken: token,
      minIntervalMs,
      state,
    })

    const { res, getStatus, getBody } = createResponse()
    const request = createRequest({
      headers: { Authorization: `Bearer ${token}` },
    })

    await handler(request, res)

    expect(getStatus()).toBe(200)
    const body = getBody<{
      status: string
      durationMs: number
      result: ReconciliationResult
      triggeredAt: string
    }>()
    expect(body?.status).toBe('completed')
    expect(body?.result).toEqual(mockResult)
    expect(state.lastTriggeredAt).not.toBeNull()
    expect(state.inFlight).toBe(false)
  })

  it('enforces rate limiting based on min interval', async () => {
    const handler = createManualReconcileHandler({
      workspaceReconciler: reconciler,
      serverBypassToken: token,
      minIntervalMs,
      state,
    })

    const authRequest = createRequest({ headers: { Authorization: `Bearer ${token}` } })
    const firstResponse = createResponse()
    await handler(authRequest, firstResponse.res)

    const secondResponse = createResponse()
    await handler(authRequest, secondResponse.res)

    expect(secondResponse.getStatus()).toBe(429)
    expect(secondResponse.getHeader('retry-after')).toBeDefined()
  })

  it('returns conflict when reconciliation is already running before request', async () => {
    status.isRunning = true

    const handler = createManualReconcileHandler({
      workspaceReconciler: reconciler,
      serverBypassToken: token,
      minIntervalMs,
      state,
    })

    const { res, getStatus } = createResponse()
    const request = createRequest({ headers: { Authorization: `Bearer ${token}` } })

    await handler(request, res)

    expect(getStatus()).toBe(409)
    expect((reconciler.reconcile as any)).not.toHaveBeenCalled()
  })

  it('returns conflict when a concurrent run starts mid-flight', async () => {
    ;(reconciler.reconcile as any).mockImplementationOnce(async () => {
      status.isRunning = true
      return null
    })

    const handler = createManualReconcileHandler({
      workspaceReconciler: reconciler,
      serverBypassToken: token,
      minIntervalMs,
      state,
    })

    const { res, getStatus, getBody } = createResponse()
    const request = createRequest({ headers: { Authorization: `Bearer ${token}` } })

    await handler(request, res)

    expect(getStatus()).toBe(409)
    expect(getBody<{ status: string }>()?.status).toBe('skipped')
    expect(state.lastTriggeredAt).toBeNull()
  })

  it('returns failure when reconciliation finishes with an error', async () => {
    status.lastError = { timestamp: new Date().toISOString(), message: 'boom' }
    ;(reconciler.reconcile as any).mockResolvedValueOnce(null)

    const handler = createManualReconcileHandler({
      workspaceReconciler: reconciler,
      serverBypassToken: token,
      minIntervalMs,
      state,
    })

    const { res, getStatus, getBody } = createResponse()
    const request = createRequest({ headers: { Authorization: `Bearer ${token}` } })

    await handler(request, res)

    expect(getStatus()).toBe(500)
    expect(getBody<{ status: string }>()?.status).toBe('failed')
    expect(state.lastTriggeredAt).toBeNull()
  })
})
