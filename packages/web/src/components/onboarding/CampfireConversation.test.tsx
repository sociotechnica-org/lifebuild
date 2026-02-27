import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '../../../tests/test-utils.js'
import { CampfireConversation } from './CampfireConversation.js'
import { CAMPFIRE_BOOTSTRAP_MESSAGE } from '../room-chat/internalMessages.js'

const mockUseRoomChat = vi.fn()

vi.mock('../../hooks/useRoomChat.js', () => ({
  useRoomChat: (...args: unknown[]) => mockUseRoomChat(...args),
}))

const createRoomChatState = (overrides?: Record<string, unknown>) => ({
  worker: {
    id: 'campfire-jarvis',
    name: 'Jarvis',
    roleDescription: 'Campfire Guide',
    systemPrompt: 'prompt',
    defaultModel: 'gpt-4o-mini',
    createdAt: new Date(),
    updatedAt: new Date(),
    roomId: 'campfire',
    roomKind: 'life-map',
    status: 'active' as const,
    isActive: true,
    avatar: null,
  },
  conversation: {
    id: 'campfire-conversation',
    title: 'Jarvis · Campfire',
    model: 'gpt-4o-mini',
    workerId: 'campfire-jarvis',
    roomId: 'campfire',
    roomKind: 'life-map',
    scope: 'workspace' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
    processingState: 'idle' as const,
  },
  messages: [],
  isProcessing: false,
  isProvisioning: false,
  isConversationArchived: false,
  isWorkerInactive: false,
  messageText: '',
  setMessageText: vi.fn(),
  sendMessage: vi.fn(),
  sendDirectMessage: vi.fn(),
  sendInternalMessage: vi.fn(() => true),
  ...overrides,
})

describe('CampfireConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends the internal campfire bootstrap message once', async () => {
    const chatState = createRoomChatState()
    mockUseRoomChat.mockReturnValue(chatState)

    const { rerender } = render(<CampfireConversation onKeepExploring={vi.fn()} />)

    await waitFor(() => {
      expect(chatState.sendInternalMessage).toHaveBeenCalledWith(CAMPFIRE_BOOTSTRAP_MESSAGE)
    })

    rerender(<CampfireConversation onKeepExploring={vi.fn()} />)
    expect(chatState.sendInternalMessage).toHaveBeenCalledTimes(1)
  })

  it('calls keep exploring handler', () => {
    mockUseRoomChat.mockReturnValue(createRoomChatState())
    const onKeepExploring = vi.fn()

    render(<CampfireConversation onKeepExploring={onKeepExploring} />)

    fireEvent.click(screen.getByTestId('onboarding-campfire-keep-exploring'))
    expect(onKeepExploring).toHaveBeenCalledTimes(1)
  })

  it('surfaces status message when Jarvis is unavailable', () => {
    mockUseRoomChat.mockReturnValue(createRoomChatState({ isWorkerInactive: true }))

    render(<CampfireConversation onKeepExploring={vi.fn()} />)

    expect(screen.getByText('Jarvis is currently unavailable.')).toBeInTheDocument()
  })
})
