import React from 'react'
import { render } from '../../../../tests/test-utils.js'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { UserInitializer, resetUserInitializationState } from './UserInitializer.js'

// Mock LiveStore hooks
const mockCommit = vi.fn()
const mockStore = { commit: mockCommit }

vi.mock('../../../livestore-compat.js', () => ({
  useQuery: vi.fn(),
  useStore: vi.fn(() => ({ store: mockStore })),
}))

// Import after mocking
import { useQuery } from '../../../livestore-compat.js'

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>

describe('UserInitializer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetUserInitializationState()
  })

  it('should not create a default user (now handled by AuthUserSync)', () => {
    // Mock empty users array (query loaded, no users)
    mockUseQuery.mockReturnValue([])

    render(
      <UserInitializer>
        <div>App content</div>
      </UserInitializer>
    )

    // UserInitializer should no longer create default users
    expect(mockCommit).not.toHaveBeenCalled()
  })

  it('should not create a user when users already exist', () => {
    // Mock existing users
    mockUseQuery.mockReturnValue([
      {
        id: 'existing-user',
        name: 'Existing User',
        email: 'existing@example.com',
        avatarUrl: null,
        isAdmin: false,
        createdAt: new Date(),
        syncedAt: null,
      },
    ])

    render(
      <UserInitializer>
        <div>App content</div>
      </UserInitializer>
    )

    expect(mockCommit).not.toHaveBeenCalled()
  })

  it('should not create a user when query is still loading', () => {
    // Mock loading state (query returns undefined)
    mockUseQuery.mockReturnValue(undefined)

    render(
      <UserInitializer>
        <div>App content</div>
      </UserInitializer>
    )

    expect(mockCommit).not.toHaveBeenCalled()
  })

  it('should always render children', () => {
    mockUseQuery.mockReturnValue([])

    const { getByText } = render(
      <UserInitializer>
        <div>App content</div>
      </UserInitializer>
    )

    expect(getByText('App content')).toBeInTheDocument()
  })
})
