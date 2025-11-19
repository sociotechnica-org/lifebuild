import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import type { ChatMessage } from '@work-squared/shared/schema'
import { RoomChatPanel } from './RoomChatPanel.js'

const sampleMessages: ChatMessage[] = [
  {
    id: '1',
    conversationId: 'conv',
    message: 'What should I focus on this week?',
    role: 'user',
    modelId: null,
    responseToMessageId: null,
    navigationContext: null,
    createdAt: new Date(),
    llmMetadata: null,
  },
  {
    id: '2',
    conversationId: 'conv',
    message: 'Let’s plan three high-impact actions across your priorities.',
    role: 'assistant',
    modelId: null,
    responseToMessageId: '1',
    navigationContext: null,
    createdAt: new Date(),
    llmMetadata: null,
  },
]

const baseWorker = {
  id: 'life-map-mesa',
  name: 'MESA',
  roleDescription: 'Life Map Navigator',
  systemPrompt: '',
  defaultModel: 'gpt-4o-mini',
  createdAt: new Date(),
  updatedAt: new Date(),
  roomId: null,
  roomKind: null,
  status: 'active' as const,
  isActive: true,
  avatar: null,
}

const meta: Meta<typeof RoomChatPanel> = {
  title: 'New UI/RoomChat/RoomChatPanel',
  component: RoomChatPanel,
  args: {
    worker: baseWorker,
    messages: sampleMessages,
    isProcessing: false,
    messageText: '',
  },
} satisfies Meta<typeof RoomChatPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: args => {
    const [value, setValue] = React.useState(args.messageText)
    return (
      <RoomChatPanel
        {...args}
        messageText={value}
        onMessageTextChange={setValue}
        onSendMessage={() => setValue('')}
      />
    )
  },
}

export const ProcessingState: Story = {
  args: {
    messages: sampleMessages,
    isProcessing: true,
  },
  render: Default.render,
}
