import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ChatPresenter } from './ChatPresenter.js'
import type { ChatData } from '../../../hooks/useChatData.js'

const meta: Meta<typeof ChatPresenter> = {
  title: 'Components/Chat/ChatPresenter',
  component: ChatPresenter,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main chat interface presenter component with conversation selection and messaging',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div style={{ height: '600px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

const mockChatData: ChatData = {
  // Data
  conversations: [
    {
      id: 'conv1',
      title: 'New Chat 12:49:30 PM',
      createdAt: new Date('2025-01-01T12:49:30'),
      updatedAt: new Date('2025-01-01T12:50:00'),
      model: 'claude-sonnet-4-20250514',
      workerId: null,
    },
    {
      id: 'conv2',
      title: 'Chat with Alice - 1:15:22 PM',
      createdAt: new Date('2025-01-01T13:15:22'),
      updatedAt: new Date('2025-01-01T13:16:00'),
      model: 'claude-sonnet-4-20250514',
      workerId: 'worker1',
    },
  ],
  availableWorkers: [
    {
      id: 'worker1',
      name: 'Alice',
      avatar: '👩‍💻',
      roleDescription: 'Frontend Developer',
      systemPrompt: 'You are a helpful frontend developer.',
      defaultModel: 'claude-sonnet-4-20250514',
      isActive: true,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      id: 'worker2',
      name: 'Bob',
      avatar: '👨‍🎨',
      roleDescription: 'UX Designer',
      systemPrompt: 'You are a creative UX designer.',
      defaultModel: 'claude-sonnet-4-20250514',
      isActive: true,
      createdAt: new Date(),
      updatedAt: null,
    },
  ],
  messages: [
    {
      id: 'msg1',
      conversationId: 'conv1',
      message: 'Create two tasks: "meet and greet" and "Complete sale and handover"',
      role: 'user',
      createdAt: new Date('2025-01-01T12:49:35'),
      modelId: null,
      responseToMessageId: null,
      llmMetadata: null,
    },
    {
      id: 'msg2',
      conversationId: 'conv1',
      message:
        'Task created successfully: "meet and greet" on board "undefined" in column "Todo". Task ID: 6b89de9c-46db-4d63-ae5c-03a306c65ce1',
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:49:40'),
      modelId: null,
      responseToMessageId: 'msg1',
      llmMetadata: { source: 'tool-result' },
    },
    {
      id: 'msg3',
      conversationId: 'conv1',
      message: 'Using create_task tool...',
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:49:45'),
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
      id: 'msg4',
      conversationId: 'conv1',
      message:
        'Task created successfully: "Complete sale and handover" on board "undefined" in column "Todo". Task ID: 934eb19d-5b3c-48d5-b234-9db5b0c3c6b9',
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:49:50'),
      modelId: null,
      responseToMessageId: 'msg1',
      llmMetadata: { source: 'tool-result' },
    },
    {
      id: 'msg5',
      conversationId: 'conv1',
      message: 'Now let me create a document with poster text for your dog sale:',
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:49:55'),
      modelId: 'claude-sonnet-4-20250514',
      responseToMessageId: 'msg1',
      llmMetadata: null,
    },
    {
      id: 'msg6',
      conversationId: 'conv1',
      message: 'Using create_document tool...',
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:50:00'),
      modelId: 'claude-sonnet-4-20250514',
      responseToMessageId: 'msg1',
      llmMetadata: {
        toolCalls: [
          {
            id: 'call_456',
            function: { name: 'create_document' },
          },
        ],
      },
    },
    {
      id: 'msg7',
      conversationId: 'conv1',
      message: 'Document created successfully:',
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:50:05'),
      modelId: null,
      responseToMessageId: 'msg1',
      llmMetadata: { source: 'tool-result' },
    },
  ],
  selectedConversation: null,
  currentWorker: null,

  // State
  selectedConversationId: null,
  processingConversations: new Set(),
  messageText: '',
  showChatPicker: false,

  // Actions (mock functions)
  onConversationChange: () => {},
  onCreateConversation: () => {},
  onSendMessage: () => {},
  onMessageTextChange: () => {},
  onShowChatPicker: () => {},
  onHideChatPicker: () => {},
  onChatTypeSelect: () => {},
}

export const Default: Story = {
  args: {
    ...mockChatData,
  },
}

export const WithSelectedConversation: Story = {
  args: {
    ...mockChatData,
    selectedConversationId: 'conv1',
    selectedConversation: mockChatData.conversations[0],
  },
}

export const WithWorkerConversation: Story = {
  args: {
    ...mockChatData,
    selectedConversationId: 'conv2',
    selectedConversation: mockChatData.conversations[1],
    currentWorker: mockChatData.availableWorkers[0],
    messages: [
      {
        id: 'worker-msg1',
        conversationId: 'conv2',
        message: 'Hi Alice! Can you help me with the frontend?',
        role: 'user',
        createdAt: new Date(),
        modelId: null,
        responseToMessageId: null,
        llmMetadata: null,
      },
      {
        id: 'worker-msg2',
        conversationId: 'conv2',
        message:
          "Of course! I'd be happy to help with the frontend work. What specifically are you working on?",
        role: 'assistant',
        createdAt: new Date(),
        modelId: 'claude-sonnet-4-20250514',
        responseToMessageId: 'worker-msg1',
        llmMetadata: null,
      },
    ],
  },
}

export const Processing: Story = {
  args: {
    ...mockChatData,
    selectedConversationId: 'conv1',
    selectedConversation: mockChatData.conversations[0],
    processingConversations: new Set(['conv1']),
  },
}

export const EmptyState: Story = {
  args: {
    ...mockChatData,
    conversations: [],
  },
}

export const ChatPickerOpen: Story = {
  args: {
    ...mockChatData,
    showChatPicker: true,
  },
}
