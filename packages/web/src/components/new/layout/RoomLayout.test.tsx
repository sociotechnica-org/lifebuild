import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { RoomLayout } from './RoomLayout.js'
import { LIFE_MAP_ROOM } from '@work-squared/shared/rooms'

const mockShouldEnableRoomChat = vi.fn(() => true)

vi.mock('../../../constants/featureFlags.js', () => ({
  shouldEnableRoomChat: () => mockShouldEnableRoomChat(),
}))

vi.mock('../../../lib/analytics.js', () => ({
  usePostHog: () => ({
    capture: vi.fn(),
  }),
}))

const mockSendMessage = vi.fn()
const mockSetMessageText = vi.fn()

vi.mock('../../../hooks/useRoomChat.js', () => ({
  useRoomChat: () => ({
    worker: {
      id: 'life-map-mesa',
      name: 'MESA',
      roleDescription: 'Life Map Navigator',
      defaultModel: 'gpt-4o-mini',
      systemPrompt: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      roomId: 'life-map',
      roomKind: 'life-map',
      status: 'active',
      isActive: true,
      avatar: null,
    },
    conversation: {
      id: 'conversation-1',
      title: 'MESA Chat',
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
    isWorkerInactive: false,
  }),
}))

describe('RoomLayout', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockSendMessage.mockReset()
    mockSetMessageText.mockReset()
    mockShouldEnableRoomChat.mockReturnValue(true)
  })

  it('renders children and toggles chat panel', () => {
    render(
      <RoomLayout room={LIFE_MAP_ROOM}>
        <div>Life Map Content</div>
      </RoomLayout>
    )

    expect(screen.getByText('Life Map Content')).toBeInTheDocument()

    const toggle = screen.getByRole('button', { name: /show chat/i })
    fireEvent.click(toggle)

    expect(screen.getByRole('button', { name: /hide chat/i })).toBeInTheDocument()
    expect(screen.getByText('Send')).toBeInTheDocument()
  })

  it('falls back to NewUiShell when feature disabled', () => {
    mockShouldEnableRoomChat.mockReturnValue(false)

    render(
      <RoomLayout room={LIFE_MAP_ROOM}>
        <div>Life Map Content</div>
      </RoomLayout>
    )

    expect(screen.getByText('Life Map Content')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /chat/i })).not.toBeInTheDocument()
  })
})
