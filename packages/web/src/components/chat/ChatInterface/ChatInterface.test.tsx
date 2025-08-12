import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
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
import { useQuery, useStore } from '@livestore/react'
const mockUseQuery = useQuery as ReturnType<typeof vi.fn>
const mockUseStore = useStore as ReturnType<typeof vi.fn>

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

    expect(screen.getByText('Core AI')).toBeInTheDocument()
    expect(screen.getByLabelText('New Chat')).toBeInTheDocument() // + button should be visible
    expect(screen.getByDisplayValue('')).toBeInTheDocument() // conversation selector
  })

  it('filters conversations by current worker', () => {
    const mockConversations = [
      {
        id: 'conv1',
        title: 'Chat with Worker One',
        workerId: 'worker1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'conv2',
        title: 'Chat with Worker Two',
        workerId: 'worker2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const mockWorkers: Record<string, any[]> = {
      'getWorkerById:worker1': [{ id: 'worker1', name: 'Worker One', defaultModel: 'gpt' }],
      'getWorkerById:worker2': [{ id: 'worker2', name: 'Worker Two', defaultModel: 'gpt' }],
    }

    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getConversations')) return mockConversations
      if (mockWorkers[query.label as string]) return mockWorkers[query.label as string]
      return []
    })

    render(
      <MemoryRouter initialEntries={['/?conversationId=conv1']}>
        <ChatInterface />
      </MemoryRouter>
    )

    expect(screen.queryByRole('option', { name: 'Chat with Worker Two' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Chat with Worker One' })).toBeInTheDocument()
  })

  it('creates new conversation with current worker when plus clicked', () => {
    const mockConversations = [
      {
        id: 'conv1',
        title: 'Chat with Worker One',
        workerId: 'worker1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const mockWorkers: Record<string, any[]> = {
      'getWorkerById:worker1': [{ id: 'worker1', name: 'Worker One', defaultModel: 'gpt' }],
    }

    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getConversations')) return mockConversations
      if (mockWorkers[query.label as string]) return mockWorkers[query.label as string]
      return []
    })

    const commitMock = vi.fn()
    mockUseStore.mockReturnValue({
      store: { commit: commitMock, subscribe: vi.fn(() => vi.fn()) },
    })

    render(
      <MemoryRouter initialEntries={['/?conversationId=conv1']}>
        <ChatInterface />
      </MemoryRouter>
    )

    const plusButton = screen.getByLabelText('New Chat')
    fireEvent.click(plusButton)

    expect(commitMock).toHaveBeenCalled()
    const event = commitMock.mock.calls[0]?.[0] as any
    expect(event.args.workerId).toBe('worker1')
    expect(event.args.title).toContain('Worker One')
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

    const { container } = render(
      <MemoryRouter initialEntries={['/?conversationId=conv1']}>
        <ChatInterface />
      </MemoryRouter>
    )

    // Look for the copy button by finding the unique clipboard SVG path
    const clipboardIcon = container.querySelector(
      'svg path[d*="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638"]'
    )
    expect(clipboardIcon).toBeInTheDocument()
  })

  it('hides copy button for placeholder messages', () => {
    const mockConversations = [
      { id: 'conv1', title: 'Test Conversation', createdAt: new Date(), updatedAt: new Date() },
    ]

    const mockMessages = [
      {
        id: 'msg1',
        conversationId: 'conv1',
        message: 'No response generated',
        role: 'assistant',
        createdAt: new Date(),
      },
    ]

    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getConversations')) return mockConversations
      if (query.label === 'getConversationMessages:conv1') return mockMessages
      return []
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/?conversationId=conv1']}>
        <ChatInterface />
      </MemoryRouter>
    )

    // Look for copy button by finding the unique clipboard SVG path - should not be present
    const clipboardIcon = container.querySelector(
      'svg path[d*="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638"]'
    )
    expect(clipboardIcon).not.toBeInTheDocument()
  })
})
