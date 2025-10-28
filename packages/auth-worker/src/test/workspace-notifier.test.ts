import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  notifyWorkspaceEvent,
  type WorkspaceEventPayload,
  type WorkspaceEnv,
} from '../workspace-notifier.js'

const basePayload: WorkspaceEventPayload = {
  event: 'workspace.created',
  instanceId: 'workspace-123',
  userId: 'user-456',
  timestamp: new Date().toISOString(),
}

describe('notifyWorkspaceEvent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('skips notification when SERVER_WEBHOOK_URL is not configured', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response)
    const env: WorkspaceEnv = { SERVER_WEBHOOK_URL: '', WEBHOOK_SECRET: 'secret' }

    await notifyWorkspaceEvent(env, basePayload)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('skips notification when WEBHOOK_SECRET is not configured', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response)
    const env: WorkspaceEnv = {
      SERVER_WEBHOOK_URL: 'https://example.com/webhook',
      WEBHOOK_SECRET: '',
    }

    await notifyWorkspaceEvent(env, basePayload)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends webhook when configuration is present', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response)
    const env: WorkspaceEnv = {
      SERVER_WEBHOOK_URL: 'https://example.com/webhook',
      WEBHOOK_SECRET: 'secret',
    }

    await notifyWorkspaceEvent(env, basePayload)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      env.SERVER_WEBHOOK_URL,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-Webhook-Secret': env.WEBHOOK_SECRET }),
      })
    )
  })

  it('retries on failure and eventually succeeds', async () => {
    const responses = [
      { ok: false, status: 500 } as Response,
      { ok: false, status: 500 } as Response,
      { ok: true } as Response,
    ]
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(responses.shift()!))

    const env: WorkspaceEnv = {
      SERVER_WEBHOOK_URL: 'https://example.com/webhook',
      WEBHOOK_SECRET: 'secret',
    }

    const promise = notifyWorkspaceEvent(env, basePayload)

    await vi.runAllTimersAsync()
    await promise

    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
