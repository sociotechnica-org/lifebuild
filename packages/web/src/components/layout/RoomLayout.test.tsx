import React from 'react'
import { render, screen, fireEvent } from '../../../tests/test-utils.js'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { RoomLayout } from './RoomLayout.js'
import { LIFE_MAP_ROOM } from '@lifebuild/shared/rooms'

vi.mock('../../lib/analytics.js', () => ({
  usePostHog: () => ({
    capture: vi.fn(),
  }),
}))

vi.mock('../../contexts/AuthContext.js', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
  }),
}))

vi.mock('../../livestore-compat.js', () => ({
  useQuery: () => [],
  useStore: () => ({ store: { commit: vi.fn() } }),
}))

const mockSendMessage = vi.fn()
const mockSetMessageText = vi.fn()

vi.mock('../../hooks/useRoomChat.js', () => ({
  useRoomChat: () => ({
    worker: {
      id: 'life-map-mesa',
      name: 'Life Map',
      roleDescription: 'Inactive room attendant',
      defaultModel: 'gpt-4o-mini',
      systemPrompt: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      roomId: 'life-map',
      roomKind: 'life-map',
      status: 'inactive',
      isActive: false,
      avatar: null,
    },
    conversation: {
      id: 'conversation-1',
      title: 'Life Map',
      model: 'gpt-4o-mini',
      workerId: 'life-map-mesa',
      roomId: 'life-map',
      roomKind: 'life-map',
      scope: 'workspace',
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null,
      processingState: 'idle',
    },
    messages: [],
    isProcessing: false,
    isProvisioning: false,
    messageText: '',
    setMessageText: mockSetMessageText,
    sendMessage: mockSendMessage,
    isConversationArchived: false,
    isWorkerInactive: true,
  }),
}))

describe('RoomLayout', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockSendMessage.mockReset()
    mockSetMessageText.mockReset()
  })

  it('renders children and toggles chat panel', () => {
    render(
      <MemoryRouter>
        <RoomLayout room={LIFE_MAP_ROOM}>
          <div>Life Map Content</div>
        </RoomLayout>
      </MemoryRouter>
    )

    expect(screen.getByText('Life Map Content')).toBeInTheDocument()

    const toggle = screen.getByRole('button', { name: /open chat/i })
    fireEvent.click(toggle)

    expect(screen.getByRole('button', { name: /close chat/i })).toBeInTheDocument()
    expect(screen.getByText('Send')).toBeInTheDocument()
  })

  it('renders chat panel in closed state by default', () => {
    render(
      <MemoryRouter>
        <RoomLayout room={LIFE_MAP_ROOM}>
          <div>Life Map Content</div>
        </RoomLayout>
      </MemoryRouter>
    )

    expect(screen.getByText('Life Map Content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open chat/i })).toBeInTheDocument()
    // Chat panel should not be visible when closed
    expect(screen.queryByText('Send')).not.toBeInTheDocument()
  })

  it('preserves shell padding for full-height room layouts', () => {
    render(
      <MemoryRouter>
        <RoomLayout room={LIFE_MAP_ROOM}>
          <div>Life Map Content</div>
        </RoomLayout>
      </MemoryRouter>
    )

    expect(screen.getByRole('main')).toHaveClass('p-3.5')
  })
})
