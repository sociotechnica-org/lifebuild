import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ChatInterface } from './ChatInterface.js'

// Mock the LiveStore hooks
vi.mock('@livestore/react', () => ({
  useQuery: vi.fn(() => []),
  useStore: vi.fn(() => ({
    store: {
      commit: vi.fn(),
      subscribe: vi.fn(() => vi.fn()), // Return unsubscribe function
    },
  })),
}))

// Import after mocking
import { useQuery } from '@livestore/react'
const mockUseQuery = useQuery as ReturnType<typeof vi.fn>

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render basic UI elements when no conversations exist', () => {
    mockUseQuery.mockReturnValue([])
    render(
      <MemoryRouter>
        <ChatInterface />
      </MemoryRouter>
    )

    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('No conversation selected')).toBeInTheDocument()
    expect(screen.getByText('Start New Chat')).toBeInTheDocument()

    // + button should not be visible when no conversations exist
    expect(screen.queryByLabelText('New Chat')).not.toBeInTheDocument()
  })

  it('should show + button when conversations exist', () => {
    const mockConversations = [
      { id: 'conv1', title: 'Test Conversation', createdAt: new Date(), updatedAt: new Date() },
    ]

    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getConversations')) return mockConversations
      return []
    })

    render(
      <MemoryRouter>
        <ChatInterface />
      </MemoryRouter>
    )

    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByLabelText('New Chat')).toBeInTheDocument() // + button should be visible
    expect(screen.getByDisplayValue('')).toBeInTheDocument() // conversation selector
  })

  it('renders copy button for chat messages', () => {
    const mockConversations = [
      { id: 'conv1', title: 'Test Conversation', createdAt: new Date(), updatedAt: new Date() },
    ]

    const mockMessages = [
      {
        id: 'msg1',
        conversationId: 'conv1',
        message: 'Hello world',
        role: 'assistant',
        createdAt: new Date(),
      },
    ]

    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getConversations')) return mockConversations
      if (query.label === 'getConversationMessages:conv1') return mockMessages
      return []
    })

    render(
      <MemoryRouter initialEntries={['/?conversationId=conv1']}>
        <ChatInterface />
      </MemoryRouter>
    )

    expect(screen.getByText('Copy')).toBeInTheDocument()
  })
})
