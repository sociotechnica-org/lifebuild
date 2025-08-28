import React from 'react'
import type { ChatData } from '../../../hooks/useChatData.js'
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
    <div className='h-full flex flex-col'>
      {/* Simple conversation selector */}
      <div className='p-4 border-b'>
        <select
          value={selectedConversationId || ''}
          onChange={e => onConversationChange(e.target.value)}
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
          onClick={onShowChatPicker}
          className='w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
        >
          New Chat
        </button>
      </div>

      {/* Messages area */}
      <MessageList
        messages={messages}
        isProcessing={isProcessing}
        conversationTitle={selectedConversation?.title}
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
