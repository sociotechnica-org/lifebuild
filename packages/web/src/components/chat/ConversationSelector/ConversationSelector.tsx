import React from 'react'
import type { Conversation } from '@lifebuild/shared/schema'

interface ConversationSelectorProps {
  conversations: readonly Conversation[]
  selectedConversationId: string | null
  onConversationChange: (conversationId: string) => void
  onNewChatClick: () => void
}

export const ConversationSelector: React.FC<ConversationSelectorProps> = ({
  conversations,
  selectedConversationId,
  onConversationChange,
  onNewChatClick,
}) => {
  if (conversations.length === 0) {
    return (
      <div className='flex flex-col items-center p-8 text-gray-500'>
        <p className='mb-4'>No conversation selected</p>
        <button
          onClick={onNewChatClick}
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
        >
          Start New Chat
        </button>
      </div>
    )
  }

  return (
    <div className='flex items-center gap-2 p-4 border-b'>
      <select
        value={selectedConversationId || ''}
        onChange={e => onConversationChange(e.target.value)}
        className='flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
      >
        <option value=''>Select a conversation...</option>
        {conversations.map(conversation => (
          <option key={conversation.id} value={conversation.id}>
            {conversation.title}
          </option>
        ))}
      </select>

      <button
        onClick={onNewChatClick}
        className='p-2 text-gray-500 hover:text-gray-700 transition-colors'
        aria-label='New Chat'
      >
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
        </svg>
      </button>
    </div>
  )
}
