import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '../../../tests/test-utils.js'
import { RoomChatMessageList } from './RoomChatMessageList.js'
import type { ChatMessage } from '@lifebuild/shared/schema'
import { SANCTUARY_FIRST_VISIT_BOOTSTRAP_PREFIX } from '../../constants/sanctuary.js'
import { WORKSHOP_FIRST_VISIT_BOOTSTRAP_PREFIX } from './internalMessages.js'

const baseMessage: ChatMessage = {
  id: 'msg',
  conversationId: 'conv',
  message: 'Hello',
  role: 'user',
  modelId: null,
  responseToMessageId: null,
  navigationContext: null,
  createdAt: new Date(),
  llmMetadata: null,
}

describe('RoomChatMessageList', () => {
  it('renders markdown for assistant messages', () => {
    const { container } = render(
      <RoomChatMessageList
        messages={[
          { ...baseMessage, id: 'assistant', role: 'assistant', message: '**Bold** response' },
        ]}
        isProcessing={false}
        workerName='Life Map'
      />
    )

    const strong = container.querySelector('strong')
    expect(strong?.textContent).toBe('Bold')
  })

  it('shows empty state when there are no messages', () => {
    render(<RoomChatMessageList messages={[]} workerName='Life Map' isProcessing={false} />)
    expect(screen.getByText(/start a conversation to see messages here/i)).toBeInTheDocument()
  })

  it('hides internal sanctuary first-visit bootstrap messages', () => {
    render(
      <RoomChatMessageList
        messages={[
          {
            ...baseMessage,
            id: 'bootstrap',
            role: 'user',
            message: `${SANCTUARY_FIRST_VISIT_BOOTSTRAP_PREFIX} hidden bootstrap`,
          },
          {
            ...baseMessage,
            id: 'assistant',
            role: 'assistant',
            message: 'Welcome to your Sanctuary.',
          },
        ]}
        workerName='Jarvis'
        isProcessing={false}
      />
    )

    expect(screen.queryByText(/hidden bootstrap/i)).not.toBeInTheDocument()
    expect(screen.getByText('Welcome to your Sanctuary.')).toBeInTheDocument()
  })

  it('hides internal workshop bootstrap messages from the transcript', () => {
    render(
      <RoomChatMessageList
        messages={[
          {
            ...baseMessage,
            id: 'internal-bootstrap',
            message: `${WORKSHOP_FIRST_VISIT_BOOTSTRAP_PREFIX}\nBootstrap`,
          },
          {
            ...baseMessage,
            id: 'assistant-visible',
            role: 'assistant',
            message: 'Welcome to the Workshop.',
          },
        ]}
        workerName='Marvin'
        isProcessing={false}
      />
    )

    expect(screen.queryByText(/Bootstrap/i)).not.toBeInTheDocument()
    expect(screen.getByText('Welcome to the Workshop.')).toBeInTheDocument()
  })
})
