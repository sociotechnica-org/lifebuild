import React from 'react'
import type { ChatData } from '../../../hooks/useChatData.js'
import { ConversationSelector } from '../ConversationSelector/ConversationSelector.js'
import { MessageList } from '../MessageList/MessageList.js'
import { ChatInput } from '../ChatInput/ChatInput.js'
import { ChatTypeModal } from '../ChatTypeModal/ChatTypeModal.js'

interface ChatPresenterProps extends ChatData {}

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
  onCreateConversation: _onCreateConversation,
  onSendMessage,
  onMessageTextChange,
  onShowChatPicker,
  onHideChatPicker,
  onChatTypeSelect,
}) => {
  const isProcessing = selectedConversationId
    ? processingConversations.has(selectedConversationId)
    : false

  return (
    <div className='h-full flex flex-col bg-white'>
      {/* Header */}
      <div className='flex-shrink-0 p-4 border-b'>
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>Chat</h1>

        <ConversationSelector
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onConversationChange={onConversationChange}
          onNewChatClick={onShowChatPicker}
        />
      </div>

      {/* Chat Content */}
      <div className='flex-1 flex flex-col min-h-0'>
        {selectedConversation ? (
          <>
            {/* Messages Area */}
            <MessageList
              messages={messages}
              isProcessing={isProcessing}
              conversationTitle={selectedConversation.title}
            />

            {/* Input Area */}
            <ChatInput
              messageText={messageText}
              onMessageTextChange={onMessageTextChange}
              onSendMessage={onSendMessage}
              disabled={isProcessing}
              placeholder={
                currentWorker ? `Message ${currentWorker.name}...` : 'Type your message...'
              }
            />
          </>
        ) : (
          /* Empty State */
          <div className='flex-1 flex items-center justify-center'>
            {conversations.length === 0 ? (
              <div className='text-center text-gray-500'>
                <h2 className='text-lg font-medium mb-2'>Welcome to Chat!</h2>
                <p className='mb-4'>Start your first conversation</p>
                <button
                  onClick={onShowChatPicker}
                  className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
                >
                  Start New Chat
                </button>
              </div>
            ) : (
              <div className='text-center text-gray-500'>
                <h2 className='text-lg font-medium mb-2'>No conversation selected</h2>
                <p>Choose a conversation from the dropdown above</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Type Picker Modal */}
      {showChatPicker && (
        <ChatTypeModal
          availableWorkers={availableWorkers}
          onClose={onHideChatPicker}
          onSelectChatType={onChatTypeSelect}
        />
      )}
    </div>
  )
}
