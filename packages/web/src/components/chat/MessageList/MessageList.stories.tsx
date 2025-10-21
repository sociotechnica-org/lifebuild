import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { MessageList } from './MessageList.js'
import type { ChatMessage, Worker } from '@work-squared/shared/schema'

const meta = {
  title: 'Components/Chat/MessageList',
  component: MessageList,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a list of chat messages with different types and states',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div style={{ height: '400px', width: '600px', border: '1px solid #ccc' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MessageList>

export default meta
type Story = StoryObj<typeof meta>

const mockWorker: Worker = {
  id: 'worker-1',
  name: 'Diligent Aide',
  avatar: '☀️',
  roleDescription: 'Project Manager',
  systemPrompt: 'You are a helpful project management assistant.',
  defaultModel: 'claude-sonnet-4-20250514',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: null,
}

const basicMessages: ChatMessage[] = [
  {
    id: 'msg1',
    conversationId: 'conv1',
    message: 'Hello! Can you help me create some tasks?',
    role: 'user',
    navigationContext: null,
    createdAt: new Date('2025-01-01T12:00:00'),
    modelId: null,
    responseToMessageId: null,
    llmMetadata: null,
  },
  {
    id: 'msg2',
    conversationId: 'conv1',
    message:
      "Of course! I'd be happy to help you create tasks. What tasks would you like to create?",
    role: 'assistant',
    navigationContext: null,
    createdAt: new Date('2025-01-01T12:00:10'),
    modelId: 'claude-sonnet-4-20250514',
    responseToMessageId: 'msg1',
    llmMetadata: null,
  },
]

const toolCallMessages: ChatMessage[] = [
  {
    id: 'msg1',
    conversationId: 'conv1',
    message: 'Create a task called "Review PR"',
    role: 'user',
    navigationContext: null,
    createdAt: new Date('2025-01-01T12:00:00'),
    modelId: null,
    responseToMessageId: null,
    llmMetadata: null,
  },
  {
    id: 'msg2',
    conversationId: 'conv1',
    message: 'Using create_task tool...',
    role: 'assistant',
    navigationContext: null,
    createdAt: new Date('2025-01-01T12:00:10'),
    modelId: 'claude-sonnet-4-20250514',
    responseToMessageId: 'msg1',
    llmMetadata: {
      toolCalls: [
        {
          id: 'call_123',
          function: { name: 'create_task' },
        },
      ],
    },
  },
  {
    id: 'msg3',
    conversationId: 'conv1',
    message:
      'Task created successfully: "Review PR" on board "Main Board" in column "Todo". Task ID: 123e4567-e89b-12d3-a456-426614174000',
    role: 'assistant',
    navigationContext: null,
    createdAt: new Date('2025-01-01T12:00:15'),
    modelId: null,
    responseToMessageId: 'msg1',
    llmMetadata: { source: 'tool-result' },
  },
]

export const Default: Story = {
  args: {
    messages: basicMessages,
    isProcessing: false,
    conversationTitle: 'Test Conversation',
    currentWorker: mockWorker,
  },
}

export const WithToolCalls: Story = {
  args: {
    messages: toolCallMessages,
    isProcessing: false,
    conversationTitle: 'Tool Call Example',
    currentWorker: mockWorker,
  },
}

export const Processing: Story = {
  args: {
    messages: basicMessages,
    isProcessing: true,
    conversationTitle: 'Processing...',
    currentWorker: mockWorker,
  },
}

export const Empty: Story = {
  args: {
    messages: [],
    isProcessing: false,
    conversationTitle: 'New Conversation',
    currentWorker: mockWorker,
  },
}

export const LongConversation: Story = {
  args: {
    messages: [
      ...basicMessages,
      ...toolCallMessages,
      {
        id: 'msg4',
        conversationId: 'conv1',
        message: 'Great! Now create another task called "Write documentation"',
        role: 'user',
        navigationContext: null,
        createdAt: new Date('2025-01-01T12:01:00'),
        modelId: null,
        responseToMessageId: null,
        llmMetadata: null,
      },
      {
        id: 'msg5',
        navigationContext: null,
        conversationId: 'conv1',
        message: "I'll create that documentation task for you right away.",
        role: 'assistant',
        createdAt: new Date('2025-01-01T12:01:10'),
        modelId: 'claude-sonnet-4-20250514',
        responseToMessageId: 'msg4',
        llmMetadata: null,
      },
    ],
    isProcessing: false,
    conversationTitle: 'Long Conversation',
    currentWorker: mockWorker,
  },
}
