import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  UserInitializer,
  resetUserInitializationState,
} from '../../src/components/UserInitializer.js'

// Mock LiveStore hooks
const mockCommit = vi.fn()
const mockStore = { commit: mockCommit }

vi.mock('@livestore/react', () => ({
  useQuery: vi.fn(),
  useStore: vi.fn(() => ({ store: mockStore })),
}))

// Import after mocking
import { useQuery } from '@livestore/react'

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-user-id'),
})

describe('UserInitializer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetUserInitializationState()
  })

  it('should create a default user when no users exist and query has loaded', async () => {
    // Mock empty users array (query loaded, no users)
    mockUseQuery.mockReturnValue([])

    render(
      <UserInitializer>
        <div>App content</div>
      </UserInitializer>
    )

    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'v1.UserCreated',
          args: expect.objectContaining({
            id: 'test-user-id',
            name: 'Default User',
            avatarUrl: undefined,
            createdAt: expect.any(Date),
          }),
        })
      )
    })
  })

  it('should not create a user when users already exist', async () => {
    // Mock existing users
    mockUseQuery.mockReturnValue([
      {
        id: 'existing-user',
        name: 'Existing User',
        avatarUrl: null,
        createdAt: new Date(),
      },
    ])

    render(
      <UserInitializer>
        <div>App content</div>
      </UserInitializer>
    )

    // Wait a bit to ensure no user creation happens
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockCommit).not.toHaveBeenCalled()
  })

  it('should not create a user when query is still loading', async () => {
    // Mock loading state (query returns undefined)
    mockUseQuery.mockReturnValue(undefined)

    render(
      <UserInitializer>
        <div>App content</div>
      </UserInitializer>
    )

    // Wait a bit to ensure no user creation happens
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockCommit).not.toHaveBeenCalled()
  })

  it('should handle commit errors gracefully and allow retry', async () => {
    // Mock empty users array
    mockUseQuery.mockReturnValue([])

    // Mock commit to fail first time, succeed second time
    mockCommit.mockRejectedValueOnce(new Error('Commit failed'))
    mockCommit.mockResolvedValueOnce(undefined)

    const { unmount } = render(
      <UserInitializer>
        <div>App content</div>
      </UserInitializer>
    )

    // Wait for first attempt to fail
    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalledTimes(1)
    })

    // Unmount and render new component to trigger retry
    unmount()

    render(
      <UserInitializer>
        <div>App content</div>
      </UserInitializer>
    )

    // Wait for retry to succeed
    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalledTimes(2)
    })
  })

  it('should not create multiple users due to race conditions', async () => {
    // Mock empty users array
    mockUseQuery.mockReturnValue([])

    // Render multiple instances quickly
    render(
      <UserInitializer>
        <div>App content 1</div>
      </UserInitializer>
    )

    render(
      <UserInitializer>
        <div>App content 2</div>
      </UserInitializer>
    )

    // Wait and ensure only one user creation attempt
    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalledTimes(1)
    })
  })

  it('should render children regardless of initialization state', () => {
    mockUseQuery.mockReturnValue([])

    const { getByText } = render(
      <UserInitializer>
        <div>App content</div>
      </UserInitializer>
    )

    expect(getByText('App content')).toBeInTheDocument()
  })
})
