import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { ConnectionState, type SyncPayload } from '@work-squared/shared/auth'

const hoistedMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useSyncPayload: vi.fn(),
}))

vi.mock('../../contexts/AuthContext.js', () => ({
  useAuth: hoistedMocks.useAuth,
}))

vi.mock('../../hooks/useSyncPayload.js', () => ({
  useSyncPayload: hoistedMocks.useSyncPayload,
}))

import { AuthStatusBanner } from './AuthStatusBanner.js'

const mockUseAuth = hoistedMocks.useAuth as ReturnType<typeof vi.fn>
const mockUseSyncPayload = hoistedMocks.useSyncPayload as ReturnType<typeof vi.fn>

type MockAuthContext = {
  connectionState: ConnectionState
  isAuthenticated: boolean
  refreshToken: () => Promise<boolean>
  logout: () => Promise<void>
}

type MockSyncReturn = {
  syncPayload: SyncPayload
  updateSyncPayload: () => Promise<void>
}

const createAuthReturn = (overrides: Partial<MockAuthContext> = {}): MockAuthContext => ({
  connectionState: ConnectionState.AUTHENTICATED,
  isAuthenticated: true,
  refreshToken: vi.fn().mockResolvedValue(true),
  logout: vi.fn().mockResolvedValue(undefined),
  ...overrides,
})

const createSyncPayloadReturn = (overrides: Partial<MockSyncReturn> = {}): MockSyncReturn => ({
  syncPayload: {
    instanceId: 'store-test',
    authToken: 'token-123',
    authError: undefined,
  },
  updateSyncPayload: vi.fn().mockResolvedValue(undefined),
  ...overrides,
})

describe('AuthStatusBanner', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
    mockUseSyncPayload.mockReset()
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
    }
  })

  it('does not render when session is healthy', () => {
    mockUseAuth.mockReturnValue(createAuthReturn())
    mockUseSyncPayload.mockReturnValue(createSyncPayloadReturn())

    const { container } = render(<AuthStatusBanner />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows reconnecting state while session refreshes', () => {
    mockUseAuth.mockReturnValue(createAuthReturn({ connectionState: ConnectionState.RECONNECTING }))
    mockUseSyncPayload.mockReturnValue(
      createSyncPayloadReturn({
        syncPayload: { instanceId: 'store-test', authToken: undefined, authError: undefined },
      })
    )

    render(<AuthStatusBanner />)

    expect(screen.getByText('Refreshing your session…')).toBeInTheDocument()
    expect(
      screen.getByText('We paused real-time updates while we renew your session.')
    ).toBeInTheDocument()
  })

  it('surfaces auth errors and allows retry', async () => {
    const refreshToken = vi.fn().mockResolvedValue(true)
    const updateSyncPayload = vi.fn().mockResolvedValue(undefined)

    mockUseAuth.mockReturnValue(
      createAuthReturn({ refreshToken, connectionState: ConnectionState.CONNECTED })
    )
    mockUseSyncPayload.mockReturnValue(
      createSyncPayloadReturn({
        syncPayload: {
          instanceId: 'store-test',
          authToken: undefined,
          authError: 'TOKEN_MISSING: Unable to retrieve access token for sync',
        },
        updateSyncPayload,
      })
    )

    render(<AuthStatusBanner />)

    expect(screen.getByText('Hold on — session needs attention')).toBeInTheDocument()
    expect(
      screen.getByText('We could not find a valid session token. Please try again.')
    ).toBeInTheDocument()

    const retryButton = screen.getByRole('button', { name: 'Try again' })
    await act(async () => {
      fireEvent.click(retryButton)
    })

    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(updateSyncPayload).toHaveBeenCalledTimes(1)
  })

  it('shows logout action when session can no longer be refreshed', async () => {
    const logout = vi.fn().mockResolvedValue(undefined)

    mockUseAuth.mockReturnValue(
      createAuthReturn({
        connectionState: ConnectionState.ERROR,
        logout,
      })
    )
    mockUseSyncPayload.mockReturnValue(
      createSyncPayloadReturn({
        syncPayload: { instanceId: 'store-test', authToken: undefined, authError: undefined },
      })
    )

    render(<AuthStatusBanner />)

    const logoutButton = screen.getByRole('button', { name: 'Log out' })

    await act(async () => {
      fireEvent.click(logoutButton)
    })

    expect(logout).toHaveBeenCalledTimes(1)
  })
})
