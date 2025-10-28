import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PassThrough } from 'stream'
import type { IncomingMessage, ServerResponse } from 'http'
import { handleWorkspaceWebhook } from '../../src/api/workspace-webhooks.js'
import type { WorkspaceWebhookOptions } from '../../src/api/workspace-webhooks.js'

class MockResponse {
  status?: number
  headers: Record<string, string> = {}
  body?: string

  writeHead(status: number, headers: Record<string, string>) {
    this.status = status
    this.headers = headers
    return this
  }

  end(body?: string) {
    this.body = body
  }

  setHeader() {}
}

class FakeOrchestrator {
  private monitored = new Set<string>()
  ensureMonitored = vi.fn(async (storeId: string) => {
    this.monitored.add(storeId)
  })
  stopMonitoring = vi.fn(async (storeId: string) => {
    this.monitored.delete(storeId)
  })
  listMonitored = vi.fn(() => Array.from(this.monitored).sort())
}

function createRequest(
  payload: unknown,
  headers: Record<string, string> = {}
): IncomingMessage & { method: string; headers: Record<string, string> } {
  const stream = new PassThrough() as IncomingMessage & {
    method: string
    headers: Record<string, string>
  }
  stream.method = 'POST'
  stream.headers = { 'content-type': 'application/json', ...headers }
  if (typeof payload === 'string') {
    stream.end(payload)
  } else {
    stream.end(JSON.stringify(payload))
  }
  return stream
}

function createOptions(orchestrator: FakeOrchestrator, secret?: string): WorkspaceWebhookOptions {
  return {
    orchestrator: orchestrator as unknown as WorkspaceWebhookOptions['orchestrator'],
    secret,
  }
}

describe('handleWorkspaceWebhook', () => {
  const secret = 'super-secret'
  const basePayload = {
    event: 'workspace.created' as const,
    instanceId: 'workspace-123',
    userId: 'user-abc',
    timestamp: new Date().toISOString(),
  }

  let orchestrator: FakeOrchestrator

  beforeEach(() => {
    orchestrator = new FakeOrchestrator()
  })

  it('returns 401 when webhook secret does not match', async () => {
    const req = createRequest(basePayload, { 'x-webhook-secret': 'wrong' })
    const res = new MockResponse()

    await handleWorkspaceWebhook(req, res as unknown as ServerResponse, createOptions(orchestrator, secret))

    expect(res.status).toBe(401)
    expect(JSON.parse(res.body ?? '{}').error).toBe('Unauthorized')
    expect(orchestrator.ensureMonitored).not.toHaveBeenCalled()
  })

  it('returns 400 when payload is invalid JSON', async () => {
    const req = createRequest('{invalid-json', { 'x-webhook-secret': secret })
    const res = new MockResponse()

    await handleWorkspaceWebhook(req, res as unknown as ServerResponse, createOptions(orchestrator, secret))

    expect(res.status).toBe(400)
    expect(JSON.parse(res.body ?? '{}').error).toBe('Invalid JSON payload')
  })

  it('starts monitoring a workspace on creation events', async () => {
    const req = createRequest(basePayload, { 'x-webhook-secret': secret })
    const res = new MockResponse()

    await handleWorkspaceWebhook(req, res as unknown as ServerResponse, createOptions(orchestrator, secret))

    expect(orchestrator.ensureMonitored).toHaveBeenCalledWith(basePayload.instanceId)
    expect(res.status).toBe(200)
    const body = JSON.parse(res.body ?? '{}')
    expect(body.status).toBe('monitoring_started')
  })

  it('reports already monitored when workspace is already tracked', async () => {
    await orchestrator.ensureMonitored(basePayload.instanceId)

    const req = createRequest(basePayload, { 'x-webhook-secret': secret })
    const res = new MockResponse()

    await handleWorkspaceWebhook(req, res as unknown as ServerResponse, createOptions(orchestrator, secret))

    expect(res.status).toBe(200)
    const body = JSON.parse(res.body ?? '{}')
    expect(body.status).toBe('already_monitored')
    expect(orchestrator.ensureMonitored).toHaveBeenCalledTimes(2)
  })

  it('stops monitoring on deletion events', async () => {
    await orchestrator.ensureMonitored(basePayload.instanceId)

    const deletePayload = { ...basePayload, event: 'workspace.deleted' as const }
    const req = createRequest(deletePayload, { 'x-webhook-secret': secret })
    const res = new MockResponse()

    await handleWorkspaceWebhook(req, res as unknown as ServerResponse, createOptions(orchestrator, secret))

    expect(orchestrator.stopMonitoring).toHaveBeenCalledWith(basePayload.instanceId)
    expect(res.status).toBe(200)
    const body = JSON.parse(res.body ?? '{}')
    expect(body.status).toBe('monitoring_stopped')
  })

  it('handles repeated deletion idempotently', async () => {
    const deletePayload = { ...basePayload, event: 'workspace.deleted' as const }
    const req = createRequest(deletePayload, { 'x-webhook-secret': secret })
    const res = new MockResponse()

    await handleWorkspaceWebhook(req, res as unknown as ServerResponse, createOptions(orchestrator, secret))

    expect(orchestrator.stopMonitoring).toHaveBeenCalledWith(basePayload.instanceId)
    expect(res.status).toBe(200)
    const body = JSON.parse(res.body ?? '{}')
    expect(body.status).toBe('already_stopped')
  })
})
