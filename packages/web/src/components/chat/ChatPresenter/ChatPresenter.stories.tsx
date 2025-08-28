import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { MessageList } from '../MessageList/MessageList.js'
import { ChatInput } from '../ChatInput/ChatInput.js'
import { ChatTypeModal } from '../ChatTypeModal/ChatTypeModal.js'
import type { ChatMessage, Conversation, Worker } from '@work-squared/shared/schema'

// Mock ChatPresenter component for Storybook that doesn't use useChatData
const ChatPresenterMock: React.FC<{
  conversations?: Conversation[]
  messages?: ChatMessage[]
  availableWorkers?: Worker[]
  selectedConversationId?: string | null
  showChatPicker?: boolean
}> = ({
  conversations = [],
  messages = [],
  availableWorkers = [],
  selectedConversationId = null,
  showChatPicker = false,
}) => {
  const [messageText, setMessageText] = React.useState('')
  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null
  const currentWorker = selectedConversation?.workerId
    ? availableWorkers.find(w => w.id === selectedConversation.workerId) || null
    : null

  return (
    <div className='h-full flex flex-col'>
      {/* Simple conversation selector */}
      <div className='p-4 border-b'>
        <select
          value={selectedConversationId || ''}
          onChange={() => {}}
          className='w-full p-2 border rounded mb-2'
        >
          <option value=''>Select a conversation...</option>
          {conversations.map(conversation => (
            <option key={conversation.id} value={conversation.id}>
              {conversation.title}
            </option>
          ))}
        </select>
        <button
          onClick={() => {}}
          className='w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
        >
          New Chat
        </button>
      </div>

      {/* Messages area */}
      <MessageList
        messages={messages}
        isProcessing={false}
        conversationTitle={selectedConversation?.title}
      />

      {/* Input area */}
      <ChatInput
        messageText={messageText}
        onMessageTextChange={setMessageText}
        onSendMessage={() => {}}
        disabled={false}
        placeholder={currentWorker ? `Message ${currentWorker.name}...` : 'Type your message...'}
      />

      {/* Chat Type Picker Modal */}
      {showChatPicker && (
        <ChatTypeModal
          availableWorkers={availableWorkers}
          onClose={() => {}}
          onSelectChatType={() => {}}
        />
      )}
    </div>
  )
}

const meta: Meta<typeof ChatPresenterMock> = {
  title: 'Components/Chat/ChatPresenter',
  component: ChatPresenterMock,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Chat interface component with conversation selection and messaging. This story uses mock data for demonstration.',
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

const mockConversations: Conversation[] = [
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
]

const mockWorkers: Worker[] = [
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
]

const mockMessages: ChatMessage[] = [
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
]

export const Default: Story = {
  args: {
    conversations: [],
    messages: [],
    availableWorkers: mockWorkers,
  },
}

export const WithConversations: Story = {
  args: {
    conversations: mockConversations,
    messages: [],
    availableWorkers: mockWorkers,
  },
}

export const WithSelectedConversation: Story = {
  args: {
    conversations: mockConversations,
    messages: mockMessages,
    availableWorkers: mockWorkers,
    selectedConversationId: 'conv1',
  },
}

export const ChatPickerOpen: Story = {
  args: {
    conversations: mockConversations,
    messages: [],
    availableWorkers: mockWorkers,
    showChatPicker: true,
  },
}
