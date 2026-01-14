import React from 'react'
import { MessageList } from '../MessageList/MessageList.js'
import { ChatInput } from '../ChatInput/ChatInput.js'
import { ChatTypeModal } from '../ChatTypeModal/ChatTypeModal.js'
import { getAvatarColor } from '../../../utils/avatarColors.js'
import type { ChatMessage, Conversation, Worker } from '@lifebuild/shared/schema'

interface ChatPresenterProps {
  // Data
  conversations: readonly Conversation[]
  availableWorkers: readonly Worker[]
  messages: readonly ChatMessage[]
  selectedConversation: Conversation | null
  currentWorker: Worker | null

  // State
  selectedConversationId: string | null
  processingConversations: Set<string>
  messageText: string
  showChatPicker: boolean

  // Actions
  onConversationChange: (conversationId: string) => void
  onSendMessage: (e: React.FormEvent) => void
  onMessageTextChange: (text: string) => void
  onShowChatPicker: () => void
  onHideChatPicker: () => void
  onChatTypeSelect: (workerId?: string) => void
  onClose?: () => void
}

/**
 * Presentational component for the chat interface
 * Receives all data and callbacks via props
 * Does not directly access LiveStore or hooks
 */
export const ChatPresenter: React.FC<ChatPresenterProps> = ({
  // Data
  conversations,
  availableWorkers,
  messages,
  selectedConversation,
  currentWorker,

  // State
  selectedConversationId,
  processingConversations,
  messageText,
  showChatPicker,

  // Actions
  onConversationChange,
  onSendMessage,
  onMessageTextChange,
  onShowChatPicker,
  onHideChatPicker,
  onChatTypeSelect,
  onClose,
}) => {
  const isProcessing = selectedConversationId
    ? processingConversations.has(selectedConversationId)
    : false

  const assistantName = currentWorker?.name || 'Assistant'

  return (
    <div className='h-full flex flex-col bg-white lg:border-l lg:border-gray-200'>
      {/* Chat header with worker info and conversation selector */}
      <div className='border-b border-gray-200 p-4'>
        <div className='mb-3 flex items-start justify-between gap-3'>
          <div className='flex items-center gap-3'>
            {/* Worker avatar */}
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg text-white ${currentWorker ? getAvatarColor(currentWorker.id) : 'bg-gray-500'}`}
            >
              {currentWorker?.avatar || '🤖'}
            </div>

            {/* Worker info */}
            <div>
              <div className='font-semibold text-gray-900'>
                {currentWorker?.name || 'Assistant'}
              </div>
              {currentWorker?.roleDescription ? (
                <div className='text-sm text-gray-500'>{currentWorker.roleDescription}</div>
              ) : null}
            </div>
          </div>

          {onClose && (
            <button
              type='button'
              onClick={onClose}
              className='inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              aria-label='Close chat panel'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='h-5 w-5'
              >
                <line x1='18' y1='6' x2='6' y2='18'></line>
                <line x1='6' y1='6' x2='18' y2='18'></line>
              </svg>
            </button>
          )}
        </div>

        {/* Conversation selector with new chat button */}
        <div className='flex items-center gap-2'>
          <select
            value={selectedConversationId || ''}
            onChange={e => onConversationChange(e.target.value)}
            className='flex-1 min-w-0 p-2 border border-gray-200 rounded text-sm truncate'
          >
            <option value=''>Chat with {assistantName}</option>
            {conversations.map(conversation => {
              const isConversationProcessing = processingConversations.has(conversation.id)
              const optionLabel = isConversationProcessing
                ? `${conversation.title} 🔄`
                : conversation.title

              return (
                <option key={conversation.id} value={conversation.id}>
                  {optionLabel}
                </option>
              )
            })}
          </select>

          <button
            onClick={onShowChatPicker}
            className='flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors'
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

      {/* Messages area */}
      <MessageList
        messages={messages}
        isProcessing={isProcessing}
        conversationTitle={selectedConversation?.title}
        currentWorker={currentWorker}
        conversationId={selectedConversationId}
      />

      {/* Input area */}
      <ChatInput
        messageText={messageText}
        onMessageTextChange={onMessageTextChange}
        onSendMessage={onSendMessage}
        disabled={isProcessing}
        placeholder={currentWorker ? `Message ${currentWorker.name}...` : 'Type your message...'}
      />

      {/* Chat Type Picker Modal */}
      <ChatTypeModal
        isOpen={showChatPicker}
        availableWorkers={availableWorkers}
        onClose={onHideChatPicker}
        onSelectChatType={onChatTypeSelect}
      />
    </div>
  )
}
