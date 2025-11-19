import React from 'react'
import { render, screen } from '@testing-library/react'
import type { ChatMessage } from '@work-squared/shared/schema'
import { RoomChatPanel } from './RoomChatPanel.js'

const makeMessage = (overrides: Partial<ChatMessage>): ChatMessage => ({
  id: 'msg',
  conversationId: 'conv',
  message: 'Hello',
  role: 'user',
  modelId: null,
  responseToMessageId: null,
  navigationContext: null,
  createdAt: new Date(),
  llmMetadata: null,
  ...overrides,
})

describe('RoomChatPanel', () => {
  it('renders worker metadata and messages', () => {
    render(
      <RoomChatPanel
        roomTitle='Life Map'
        worker={{
          id: 'worker',
          name: 'MESA',
          roleDescription: 'Navigator',
          systemPrompt: '',
          defaultModel: 'gpt-4o-mini',
          createdAt: new Date(),
          updatedAt: new Date(),
          roomId: null,
          roomKind: null,
          status: 'active',
          isActive: true,
          avatar: null,
        }}
        messages={[makeMessage({ message: 'Ping', role: 'user' })]}
        isProcessing={false}
        messageText=''
        onMessageTextChange={() => {}}
        onSendMessage={() => {}}
      />
    )

    expect(screen.getByText('Life Map')).toBeInTheDocument()
    expect(screen.getByText(/MESA · Navigator/)).toBeInTheDocument()
    expect(screen.getByText('Ping')).toBeInTheDocument()
  })
})
