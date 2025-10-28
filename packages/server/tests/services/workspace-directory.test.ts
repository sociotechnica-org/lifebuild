import { describe, it, expect, vi } from 'vitest'
import { AuthWorkerWorkspaceDirectory } from '../../src/services/workspace-directory.js'

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init })

describe('AuthWorkerWorkspaceDirectory', () => {
  it('fetches workspaces with bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        workspaces: [{ instanceId: 'workspace-1', userId: 'user-1' }],
      })
    )

    const directory = new AuthWorkerWorkspaceDirectory({
      baseUrl: 'https://auth.example.com/',
      serverBypassToken: 'token-123',
      fetcher: fetchMock,
    })

    const workspaces = await directory.listWorkspaces()
    expect(workspaces).toEqual([{ instanceId: 'workspace-1', userId: 'user-1' }])
    expect(fetchMock).toHaveBeenCalledWith('https://auth.example.com/internal/workspaces', {
      method: 'GET',
      headers: { Authorization: 'Bearer token-123' },
    })
  })

  it('throws when Auth Worker responds with error status', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('error', {
        status: 500,
      })
    )

    const directory = new AuthWorkerWorkspaceDirectory({
      baseUrl: 'https://auth.example.com',
      serverBypassToken: 'token-123',
      fetcher: fetchMock,
    })

    await expect(directory.listWorkspaces()).rejects.toThrow(
      /Auth Worker responded with status 500/
    )
  })

  it('throws when response JSON is invalid', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('not-json', {
        status: 200,
      })
    )

    const directory = new AuthWorkerWorkspaceDirectory({
      baseUrl: 'https://auth.example.com',
      serverBypassToken: 'token-123',
      fetcher: fetchMock,
    })

    await expect(directory.listWorkspaces()).rejects.toThrow(/Invalid JSON/)
  })
})
