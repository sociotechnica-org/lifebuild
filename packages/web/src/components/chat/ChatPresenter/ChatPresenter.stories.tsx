import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { MessageList } from '../MessageList/MessageList.js'
import { ChatInput } from '../ChatInput/ChatInput.js'
import { ChatTypeModal } from '../ChatTypeModal/ChatTypeModal.js'
import type { ChatMessage, Conversation, Worker } from '@work-squared/shared/schema'
import { getAvatarColor } from '../../../utils/avatarColors.js'

// Simplified mock component for Storybook
const ChatPresenterMock: React.FC<{
  hasConversations?: boolean
  hasMessages?: boolean
  showChatPicker?: boolean
  isProcessing?: boolean
}> = ({
  hasConversations = false,
  hasMessages = false,
  showChatPicker = false,
  isProcessing = false,
}) => {
  const [messageText, setMessageText] = React.useState('')

  // Simple mock data
  const conversations: Conversation[] = hasConversations
    ? [
        {
          id: 'conv1',
          title: 'Chat with Assistant',
          createdAt: new Date(),
          updatedAt: new Date(),
          model: 'claude-sonnet-4-20250514',
          workerId: null,
        },
      ]
    : []

  const messages: ChatMessage[] = hasMessages
    ? [
        {
          id: 'msg1',
          conversationId: 'conv1',
          message: 'Hello, how can I help you today?',
          role: 'assistant',
          createdAt: new Date(),
          modelId: 'claude-sonnet-4-20250514',
          responseToMessageId: null,
          llmMetadata: null,
        },
      ]
    : []

  const currentWorker: Worker = {
    id: 'worker1',
    name: 'Assistant',
    avatar: '🤖',
    roleDescription: 'AI Assistant',
    systemPrompt: 'You are a helpful AI assistant.',
    defaultModel: 'claude-sonnet-4-20250514',
    isActive: true,
    createdAt: new Date(),
    updatedAt: null,
  }

  const workers: Worker[] = [currentWorker]

  return (
    <div className='h-full flex flex-col border-l border-gray-200'>
      {/* Chat header with worker info */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center gap-3 mb-3'>
          {/* Worker avatar */}
          <div
            className={`w-10 h-10 ${getAvatarColor(currentWorker.id)} rounded-full flex items-center justify-center text-white text-lg`}
          >
            {currentWorker.avatar}
          </div>

          {/* Worker info */}
          <div className='flex-1'>
            <div className='font-semibold text-gray-900'>{currentWorker.name}</div>
            <div className='text-sm text-gray-500'>{currentWorker.roleDescription}</div>
          </div>
        </div>

        {/* Conversation selector with new chat button */}
        <div className='flex items-center gap-2'>
          <select
            value={hasConversations ? 'conv1' : ''}
            onChange={() => {}}
            className='flex-1 p-2 border border-gray-200 rounded text-sm'
          >
            <option value=''>Chat with {currentWorker.name}</option>
            {conversations.map(conv => (
              <option key={conv.id} value={conv.id}>
                {conv.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => {}}
            className='w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors'
            aria-label='New chat'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='w-5 h-5'
            >
              <line x1='12' y1='5' x2='12' y2='19'></line>
              <line x1='5' y1='12' x2='19' y2='12'></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isProcessing={isProcessing}
        conversationTitle={hasConversations ? 'Chat with Assistant' : undefined}
      />

      {/* Input */}
      <ChatInput
        messageText={messageText}
        onMessageTextChange={setMessageText}
        onSendMessage={() => {}}
        disabled={isProcessing}
        placeholder='Type your message...'
      />

      {/* Modal */}
      {showChatPicker && (
        <ChatTypeModal availableWorkers={workers} onClose={() => {}} onSelectChatType={() => {}} />
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
        component: 'Chat interface with conversation selection and messaging.',
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

export const Empty: Story = {
  args: {},
}

export const WithConversation: Story = {
  args: {
    hasConversations: true,
    hasMessages: true,
  },
}

export const Processing: Story = {
  args: {
    hasConversations: true,
    hasMessages: true,
    isProcessing: true,
  },
}

export const ChatTypePicker: Story = {
  args: {
    showChatPicker: true,
  },
}
