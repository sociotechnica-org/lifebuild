import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RoomChatMessageList } from './RoomChatMessageList.js'
import type { ChatMessage } from '@work-squared/shared/schema'

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
        workerName='MESA'
      />
    )

    const strong = container.querySelector('strong')
    expect(strong?.textContent).toBe('Bold')
  })

  it('shows empty state when there are no messages', () => {
    render(<RoomChatMessageList messages={[]} workerName='MESA' isProcessing={false} />)
    expect(screen.getByText(/start a conversation to see messages here/i)).toBeInTheDocument()
  })
})
