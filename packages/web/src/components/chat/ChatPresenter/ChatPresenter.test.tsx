import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatPresenter } from './ChatPresenter.js'
import type { ChatMessage, Conversation, Worker } from '@work-squared/shared/schema'

describe('ChatPresenter', () => {
  const mockWorker: Worker = {
    id: 'worker-1',
    name: 'Assistant',
    avatar: '🤖',
    roleDescription: 'AI Assistant',
    systemPrompt: 'Be helpful',
    defaultModel: 'claude-sonnet-4-20250514',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: null,
  }

  const mockConversation: Conversation = {
    id: 'conversation-1',
    title: 'Strategy Session',
    createdAt: new Date('2024-01-01T01:00:00Z'),
    updatedAt: new Date('2024-01-01T01:05:00Z'),
    model: 'claude-sonnet-4-20250514',
    workerId: 'worker-1',
  }

  const baseMessages: ChatMessage[] = []

  const baseHandlers = {
    onConversationChange: () => {},
    onSendMessage: () => {},
    onMessageTextChange: () => {},
    onShowChatPicker: () => {},
    onHideChatPicker: () => {},
    onChatTypeSelect: () => {},
  }

  it('renders a processing indicator when the selected conversation is processing', () => {
    render(
      <ChatPresenter
        conversations={[mockConversation]}
        availableWorkers={[mockWorker]}
        messages={baseMessages}
        selectedConversation={mockConversation}
        currentWorker={mockWorker}
        selectedConversationId={mockConversation.id}
        processingConversations={new Set([mockConversation.id])}
        messageText=''
        showChatPicker={false}
        {...baseHandlers}
      />
    )

    expect(screen.getByText('Assistant is thinking...')).toBeInTheDocument()
  })

  it('marks processing conversations in the dropdown options', () => {
    render(
      <ChatPresenter
        conversations={[mockConversation]}
        availableWorkers={[mockWorker]}
        messages={baseMessages}
        selectedConversation={mockConversation}
        currentWorker={mockWorker}
        selectedConversationId={mockConversation.id}
        processingConversations={new Set([mockConversation.id])}
        messageText=''
        showChatPicker={false}
        {...baseHandlers}
      />
    )

    expect(
      screen.getByRole('option', { name: 'Strategy Session (thinking...)' })
    ).toBeInTheDocument()
  })
})
