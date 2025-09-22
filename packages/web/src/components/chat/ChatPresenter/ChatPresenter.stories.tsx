import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ChatPresenter, type ChatPresenterProps } from './ChatPresenter.js'
import type { ChatMessage, Conversation, Worker } from '@work-squared/shared/schema'

const meta: Meta<ChatPresenterProps> = {
  title: 'Components/Chat/ChatPresenter',
  component: ChatPresenter as any,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Presentational chat interface component. Displays conversations, messages, and handles user interactions.',
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

// Mock data
const mockWorker: Worker = {
  id: 'worker-1',
  name: 'Assistant',
  avatar: '🤖',
  roleDescription: 'AI Assistant',
  systemPrompt: 'You are a helpful AI assistant.',
  defaultModel: 'claude-sonnet-4-20250514',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: null,
}

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Project Planning Discussion',
    createdAt: new Date('2024-01-01T10:00:00'),
    updatedAt: new Date('2024-01-01T10:30:00'),
    model: 'claude-sonnet-4-20250514',
    workerId: 'worker-1',
  },
  {
    id: 'conv-2',
    title: 'Code Review Session',
    createdAt: new Date('2024-01-01T14:00:00'),
    updatedAt: new Date('2024-01-01T14:45:00'),
    model: 'claude-sonnet-4-20250514',
    workerId: 'worker-1',
  },
]

const mockMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    message: 'Hello! How can I help you with your project today?',
    role: 'assistant',
    createdAt: new Date('2024-01-01T10:00:00'),
    modelId: 'claude-sonnet-4-20250514',
    responseToMessageId: null,
    llmMetadata: null,
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    message: 'I need help planning the architecture for a new feature',
    role: 'user',
    createdAt: new Date('2024-01-01T10:01:00'),
    modelId: null,
    responseToMessageId: null,
    llmMetadata: null,
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    message:
      "I'd be happy to help you plan the architecture. Let's start by understanding the requirements...",
    role: 'assistant',
    createdAt: new Date('2024-01-01T10:02:00'),
    modelId: 'claude-sonnet-4-20250514',
    responseToMessageId: 'msg-2',
    llmMetadata: null,
  },
]

// Default props for stories
const defaultProps: ChatPresenterProps = {
  conversations: [],
  availableWorkers: [mockWorker],
  messages: [],
  selectedConversation: null,
  currentWorker: null,
  selectedConversationId: null,
  processingConversations: new Set(),
  messageText: '',
  showChatPicker: false,
  onConversationChange: () => {},
  onSendMessage: () => {},
  onMessageTextChange: () => {},
  onShowChatPicker: () => {},
  onHideChatPicker: () => {},
  onChatTypeSelect: () => {},
}

export const Empty: Story = {
  args: defaultProps,
}

export const WithConversations: Story = {
  args: {
    ...defaultProps,
    conversations: mockConversations,
    currentWorker: mockWorker,
  },
}

export const WithSelectedConversation: Story = {
  args: {
    ...defaultProps,
    conversations: mockConversations,
    messages: mockMessages,
    selectedConversation: mockConversations[0],
    selectedConversationId: 'conv-1',
    currentWorker: mockWorker,
  },
}

export const Processing: Story = {
  args: {
    ...defaultProps,
    conversations: mockConversations,
    messages: mockMessages,
    selectedConversation: mockConversations[0],
    selectedConversationId: 'conv-1',
    currentWorker: mockWorker,
    processingConversations: new Set(['conv-1']),
  },
}

export const WithMessageDraft: Story = {
  args: {
    ...defaultProps,
    conversations: mockConversations,
    messages: mockMessages,
    selectedConversation: mockConversations[0],
    selectedConversationId: 'conv-1',
    currentWorker: mockWorker,
    messageText: 'This is a draft message that the user is typing...',
  },
}

export const ChatPickerOpen: Story = {
  args: {
    ...defaultProps,
    conversations: mockConversations,
    currentWorker: mockWorker,
    showChatPicker: true,
    availableWorkers: [
      mockWorker,
      {
        ...mockWorker,
        id: 'worker-2',
        name: 'Code Reviewer',
        avatar: '👨‍💻',
        roleDescription: 'Specialized in code reviews',
      },
      {
        ...mockWorker,
        id: 'worker-3',
        name: 'Project Manager',
        avatar: '📋',
        roleDescription: 'Project planning and management',
      },
    ],
  },
}

export const LongConversation: Story = {
  args: {
    ...defaultProps,
    conversations: mockConversations,
    messages: [
      ...mockMessages,
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `msg-long-${i}`,
        conversationId: 'conv-1',
        message:
          i % 2 === 0
            ? `User message ${i}: This is a longer message to demonstrate scrolling behavior in the message list.`
            : `Assistant response ${i}: This is a detailed response with multiple paragraphs.\n\nIt includes line breaks and formatting to show how the component handles longer content.`,
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        createdAt: new Date(`2024-01-01T10:${10 + i}:00`),
        modelId: i % 2 === 1 ? 'claude-sonnet-4-20250514' : null,
        responseToMessageId: i > 0 ? `msg-long-${i - 1}` : null,
        llmMetadata: null,
      })),
    ],
    selectedConversation: mockConversations[0],
    selectedConversationId: 'conv-1',
    currentWorker: mockWorker,
  },
}
