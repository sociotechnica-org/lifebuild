import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ChatPresenter } from '../ChatPresenter/ChatPresenter.js'
import type { ChatData } from '../../../hooks/useChatData.js'

// Test the presenter component directly with mock data instead of the complex container
// This avoids the memory leak issues from the LiveStore reactive queries

const mockChatData: ChatData = {
  // Data
  conversations: [],
  availableWorkers: [],
  messages: [],
  selectedConversation: null,
  currentWorker: null,

  // State
  selectedConversationId: null,
  processingConversations: new Set(),
  messageText: '',
  showChatPicker: false,

  // Actions (mock functions)
  onConversationChange: vi.fn(),
  onCreateConversation: vi.fn(),
  onSendMessage: vi.fn(),
  onMessageTextChange: vi.fn(),
  onShowChatPicker: vi.fn(),
  onHideChatPicker: vi.fn(),
  onChatTypeSelect: vi.fn(),
}

describe('ChatPresenter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render basic UI elements when no conversations exist', () => {
    render(
      <MemoryRouter>
        <ChatPresenter {...mockChatData} />
      </MemoryRouter>
    )

    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('Welcome to Chat!')).toBeInTheDocument()
    expect(screen.getAllByText('Start New Chat')).toHaveLength(2) // ConversationSelector + ChatPresenter
  })

  it('should show + button when conversations exist', () => {
    const mockConversations = [
      {
        id: 'conv1',
        title: 'Test Conversation',
        createdAt: new Date(),
        updatedAt: new Date(),
        model: 'gpt-4',
        workerId: null,
      },
    ] as const

    const chatDataWithConversations = {
      ...mockChatData,
      conversations: mockConversations,
    }

    render(
      <MemoryRouter>
        <ChatPresenter {...chatDataWithConversations} />
      </MemoryRouter>
    )

    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByLabelText('New Chat')).toBeInTheDocument() // + button should be visible
    expect(screen.getByText('Select a conversation...')).toBeInTheDocument() // conversation selector
  })

  it('renders copy button for chat messages', () => {
    const mockConversation = {
      id: 'conv1',
      title: 'Test Conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
      model: 'gpt-4',
      workerId: null,
    } as const

    const mockMessages = [
      {
        id: 'msg1',
        conversationId: 'conv1',
        message: 'Hello world',
        role: 'assistant',
        createdAt: new Date(),
        modelId: null,
        responseToMessageId: null,
        llmMetadata: null,
      },
    ] as const

    const chatDataWithMessage = {
      ...mockChatData,
      conversations: [mockConversation],
      selectedConversation: mockConversation,
      selectedConversationId: 'conv1',
      messages: mockMessages,
    }

    const { container } = render(
      <MemoryRouter>
        <ChatPresenter {...chatDataWithMessage} />
      </MemoryRouter>
    )

    // Look for the copy button by finding the unique clipboard SVG path
    const clipboardIcon = container.querySelector(
      'svg path[d*="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638"]'
    )
    expect(clipboardIcon).toBeInTheDocument()
  })

  it('hides copy button for placeholder messages', () => {
    const mockConversation = {
      id: 'conv1',
      title: 'Test Conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
      model: 'gpt-4',
      workerId: null,
    } as const

    const mockMessages = [
      {
        id: 'msg1',
        conversationId: 'conv1',
        message: 'No response generated',
        role: 'assistant',
        createdAt: new Date(),
        modelId: null,
        responseToMessageId: null,
        llmMetadata: null,
      },
    ] as const

    const chatDataWithPlaceholder = {
      ...mockChatData,
      conversations: [mockConversation],
      selectedConversation: mockConversation,
      selectedConversationId: 'conv1',
      messages: mockMessages,
    }

    const { container } = render(
      <MemoryRouter>
        <ChatPresenter {...chatDataWithPlaceholder} />
      </MemoryRouter>
    )

    // Look for copy button by finding the unique clipboard SVG path - should not be present
    const clipboardIcon = container.querySelector(
      'svg path[d*="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638"]'
    )
    expect(clipboardIcon).not.toBeInTheDocument()
  })
})
