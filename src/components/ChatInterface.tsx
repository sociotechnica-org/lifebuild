import { useQuery, useStore } from '@livestore/react'
import React from 'react'

import { events } from '../livestore/schema.js'
import { getConversations$, getConversationMessages$ } from '../livestore/queries.js'
import type { Conversation, ChatMessage } from '../livestore/schema.js'

export const ChatInterface: React.FC = () => {
  const { store } = useStore()
  const conversations = useQuery(getConversations$) ?? []
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null)
  const [messageText, setMessageText] = React.useState('')
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Use a stable conversation ID for the query to avoid hook order issues
  const queryConversationId = selectedConversationId ?? '__no_conversation__'
  const allMessages = useQuery(getConversationMessages$(queryConversationId)) ?? []
  // Only show messages if we have a real conversation selected
  const messages = selectedConversationId ? allMessages : []

  const handleCreateConversation = React.useCallback(() => {
    const id = crypto.randomUUID()
    const title = `New Chat ${new Date().toLocaleTimeString()}`

    store.commit(
      events.conversationCreated({
        id,
        title,
        createdAt: new Date(),
      })
    )

    setSelectedConversationId(id)
  }, [store])

  const handleSendMessage = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (!messageText.trim() || !selectedConversationId) return

      const messageId = crypto.randomUUID()

      store.commit(
        events.chatMessageSent({
          id: messageId,
          conversationId: selectedConversationId,
          message: messageText.trim(),
          createdAt: new Date(),
        })
      )

      setMessageText('')
    },
    [store, messageText, selectedConversationId]
  )

  // Auto-select first conversation if none selected
  React.useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0]?.id || null)
    }
  }, [selectedConversationId, conversations])

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  return (
    <div className='w-96 h-screen bg-white border-l border-gray-200 flex flex-col'>
      {/* Chat Header - Fixed */}
      <div className='flex-shrink-0 p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between mb-2'>
          <h2 className='text-lg font-semibold text-gray-900'>LLM Chat</h2>
          <button
            onClick={handleCreateConversation}
            className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors'
          >
            New Chat
          </button>
        </div>

        {/* Conversation Selector */}
        {conversations.length > 0 && (
          <select
            value={selectedConversationId || ''}
            onChange={e => setSelectedConversationId(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>Select a conversation...</option>
            {conversations.map((conversation: Conversation) => (
              <option key={conversation.id} value={conversation.id}>
                {conversation.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Chat Content - Flexible */}
      <div className='flex-1 flex flex-col min-h-0'>
        {selectedConversation ? (
          <>
            {/* Messages Area - Scrollable */}
            <div className='flex-1 overflow-y-auto p-4 min-h-0'>
              {messages && messages.length > 0 ? (
                <div className='space-y-4'>
                  {messages.map((message: ChatMessage) => (
                    <div key={message.id} className='bg-blue-50 p-3 rounded-lg'>
                      <div className='text-sm text-gray-900'>{message.message}</div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className='text-center text-gray-500 py-8'>
                  <p className='text-sm'>Conversation: {selectedConversation.title}</p>
                  <p className='text-xs mt-1 text-gray-400'>
                    Created {selectedConversation.createdAt.toLocaleString()}
                  </p>
                  <p className='text-sm mt-4'>Ready for messages.</p>
                  <p className='text-xs mt-1'>Send a message to start chatting with the LLM.</p>
                </div>
              )}
            </div>

            {/* Message Input - Fixed at bottom */}
            <div className='flex-shrink-0 p-4 bg-gray-50 border-t border-gray-200'>
              <form onSubmit={handleSendMessage} className='flex flex-col gap-2'>
                <input
                  type='text'
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder='Type your message...'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
                <button
                  type='submit'
                  disabled={!messageText.trim()}
                  className='bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className='flex-1 flex items-center justify-center p-4'>
            <div className='text-center text-gray-500'>
              <h3 className='text-sm font-medium mb-2'>No conversation selected</h3>
              {conversations.length === 0 ? (
                <>
                  <p className='text-xs mb-3'>Create your first chat to get started.</p>
                  <button
                    onClick={handleCreateConversation}
                    className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                  >
                    Start New Chat
                  </button>
                </>
              ) : (
                <p className='text-xs'>Select a conversation from the dropdown above.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
