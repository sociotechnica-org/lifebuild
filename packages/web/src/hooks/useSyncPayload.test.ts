import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SyncPayload } from '@lifebuild/shared/auth'

const mockUseAuth = vi.fn()

vi.mock('../contexts/AuthContext.js', () => ({
  useAuth: mockUseAuth,
}))

const getHook = () => import('./useSyncPayload.js')

describe('useSyncPayload', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
  })

  it('returns undefined authToken when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      getCurrentToken: vi.fn(),
      handleConnectionError: vi.fn(),
    })

    const { useSyncPayload } = await getHook()
    const { result } = renderHook(() => useSyncPayload({ instanceId: 'instance-1' }))

    expect(result.current.syncPayload).toEqual<SyncPayload>({
      instanceId: 'instance-1',
      authToken: undefined,
    })

    await act(async () => {
      await result.current.updateSyncPayload()
    })

    expect(result.current.syncPayload.authToken).toBeUndefined()
  })

  it('sets authToken when a valid token is returned', async () => {
    const getCurrentToken = vi.fn().mockResolvedValue('token-123')
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      getCurrentToken,
      handleConnectionError: vi.fn(),
    })

    const { useSyncPayload } = await getHook()
    const { result } = renderHook(() => useSyncPayload({ instanceId: 'instance-2' }))

    await act(async () => {
      await result.current.updateSyncPayload()
    })

    expect(getCurrentToken).toHaveBeenCalled()
    expect(result.current.syncPayload).toEqual<SyncPayload>({
      instanceId: 'instance-2',
      authToken: 'token-123',
    })
  })

  it('surfaces auth errors when token retrieval fails', async () => {
    const getCurrentToken = vi.fn().mockResolvedValue(null)
    const handleConnectionError = vi.fn().mockResolvedValue(false)

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      getCurrentToken,
      handleConnectionError,
    })

    const { useSyncPayload } = await getHook()
    const { result } = renderHook(() => useSyncPayload({ instanceId: 'instance-3' }))

    await act(async () => {
      await result.current.updateSyncPayload()
    })

    expect(handleConnectionError).toHaveBeenCalled()
    expect(result.current.syncPayload.authToken).toBeUndefined()
    expect(result.current.syncPayload.authError).toBe('TOKEN_MISSING')
  })
})
