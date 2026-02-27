import React from 'react'
import { render, screen, fireEvent } from '../../../tests/test-utils.js'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LIFE_MAP_ROOM } from '@lifebuild/shared/rooms'
import { AttendantRailProvider } from './AttendantRailProvider.js'
import { RoomLayout } from './RoomLayout.js'

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

const renderLayout = () => {
  return render(
    <MemoryRouter>
      <AttendantRailProvider>
        <RoomLayout room={LIFE_MAP_ROOM}>
          <div>Life Map Content</div>
        </RoomLayout>
      </AttendantRailProvider>
    </MemoryRouter>
  )
}

describe('RoomLayout', () => {
  beforeEach(() => {
    mockSendMessage.mockReset()
    mockSetMessageText.mockReset()
  })

  it('renders children and attendant rail interactions', () => {
    renderLayout()

    expect(screen.getByText('Life Map Content')).toBeInTheDocument()
    expect(screen.getByTestId('attendant-rail-avatar-jarvis')).toBeInTheDocument()
    expect(screen.getByTestId('attendant-rail-avatar-marvin')).toBeInTheDocument()

    const jarvisToggle = screen.getByRole('button', { name: /open jarvis chat/i })
    fireEvent.click(jarvisToggle)

    expect(screen.getByTestId('attendant-chat-panel')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /close jarvis chat/i }))
    expect(screen.queryByTestId('attendant-chat-panel')).not.toBeInTheDocument()
  })

  it('does not render the legacy header chat bubble', () => {
    renderLayout()

    expect(screen.queryByRole('button', { name: /open chat/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /close chat/i })).not.toBeInTheDocument()
  })

  it('uses full-bleed shell mode for life map layouts', () => {
    renderLayout()

    expect(screen.getByRole('main')).not.toHaveClass('p-3.5')
  })
})
