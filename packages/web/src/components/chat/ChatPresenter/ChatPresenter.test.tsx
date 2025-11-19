import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatPresenter } from './ChatPresenter.js'
import type { ChatMessage, Conversation, Worker } from '@work-squared/shared/schema'
import { DEFAULT_MODEL_STRING } from '@work-squared/shared'

// Mock scrollIntoView for tests
Object.defineProperty(window.Element.prototype, 'scrollIntoView', {
  writable: true,
  value: () => {},
})

describe('ChatPresenter', () => {
  const mockWorker: Worker = {
    id: 'worker-1',
    name: 'Assistant',
    avatar: '🤖',
    roleDescription: 'AI Assistant',
    systemPrompt: 'Be helpful',
    defaultModel: DEFAULT_MODEL_STRING,
    isActive: true,
    roomId: null,
    roomKind: null,
    status: 'active',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: null,
  }

  const mockConversation: Conversation = {
    id: 'conversation-1',
    title: 'Strategy Session',
    createdAt: new Date('2024-01-01T01:00:00Z'),
    updatedAt: new Date('2024-01-01T01:05:00Z'),
    model: DEFAULT_MODEL_STRING,
    workerId: 'worker-1',
    roomId: null,
    roomKind: null,
    scope: 'workspace',
    processingState: 'idle',
  }

  const baseMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      conversationId: 'conversation-1',
      message: 'Hello',
      role: 'user',
      navigationContext: null,
      createdAt: new Date('2024-01-01T02:00:00Z'),
      modelId: null,
      responseToMessageId: null,
      llmMetadata: null,
    },
  ]

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

    expect(screen.getByRole('option', { name: 'Strategy Session 🔄' })).toBeInTheDocument()
  })
})
