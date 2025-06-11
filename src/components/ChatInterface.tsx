import { useQuery, useStore } from '@livestore/react'
import React from 'react'

import { events } from '../livestore/schema.js'
import { getConversations$, getConversationMessages$, getUsers$ } from '../livestore/queries.js'
import type { Conversation, ChatMessage } from '../livestore/schema.js'
import { getInitials } from '../util/initials.js'

async function callLLMAPI(userMessage: string): Promise<string> {
  console.log('🔗 Calling LLM API via proxy...')

  // Use relative path for production, fallback to localhost for local development
  const proxyUrl = import.meta.env.PROD ? '/api/llm/chat' : 'http://localhost:8787/api/llm/chat'
  const requestBody = { message: userMessage }

  console.log('🔗 Making request to:', proxyUrl)
  console.log('🔗 Request body:', requestBody)

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('🔗 Response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('🔗 Error response:', errorData)
      throw new Error(`API call failed: ${response.status} ${errorData.error || 'Unknown error'}`)
    }

    const data = await response.json()
    console.log('🔗 Response data:', data)

    const responseMessage = data.message || 'No response generated'

    console.log(`✅ Got LLM response: ${responseMessage.substring(0, 100)}...`)
    return responseMessage
  } catch (fetchError) {
    console.error('🔗 Fetch error:', fetchError)
    throw fetchError
  }
}

export const ChatInterface: React.FC = () => {
  const { store } = useStore()
  const conversations = useQuery(getConversations$) ?? []
  const users = useQuery(getUsers$) ?? []
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null)
  const [messageText, setMessageText] = React.useState('')
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Get first user as current user
  const currentUser = users[0]

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
          role: 'user',
          createdAt: new Date(),
        })
      )

      setMessageText('')
    },
    [store, messageText, selectedConversationId]
  )

  // Listen for user messages and trigger LLM responses
  React.useEffect(() => {
    if (!selectedConversationId) return

    const userMessagesQuery = getConversationMessages$(selectedConversationId)

    const unsubscribe = store.subscribe(userMessagesQuery, {
      onUpdate: async messages => {
        // Find the most recent user message that hasn't been responded to
        const userMessages = messages.filter(m => m.role === 'user')
        const assistantMessages = messages.filter(m => m.role === 'assistant')

        // Check if there's a user message without a corresponding assistant response
        const lastUserMessage = userMessages[userMessages.length - 1]
        if (!lastUserMessage) return

        // Check if we already have a response for this specific user message
        const hasResponse = assistantMessages.some(
          response => response.responseToMessageId === lastUserMessage.id
        )

        if (!hasResponse) {
          console.log('🤖 Processing user message for LLM:', lastUserMessage.message)

          try {
            const llmResponse = await callLLMAPI(lastUserMessage.message)

            store.commit(
              events.llmResponseReceived({
                id: crypto.randomUUID(),
                conversationId: selectedConversationId,
                message: llmResponse,
                role: 'assistant',
                modelId: 'gpt-4o',
                responseToMessageId: lastUserMessage.id,
                createdAt: new Date(),
                metadata: { source: 'braintrust' },
              })
            )

            console.log('✅ LLM response sent')
          } catch (error) {
            console.error('❌ Error calling LLM:', error)

            store.commit(
              events.llmResponseReceived({
                id: crypto.randomUUID(),
                conversationId: selectedConversationId,
                message: 'Sorry, I encountered an error processing your message. Please try again.',
                role: 'assistant',
                modelId: 'error',
                responseToMessageId: lastUserMessage.id,
                createdAt: new Date(),
                metadata: { source: 'error' },
              })
            )
          }
        }
      },
    })

    return unsubscribe
  }, [store, selectedConversationId])

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
          {/* Only show + button and user avatar when conversations exist */}
          {conversations.length > 0 && currentUser && (
            <div
              className='w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium'
              title={currentUser.name}
            >
              {getInitials(currentUser.name)}
            </div>
          )}
        </div>

        {/* Conversation Selector with + button inline */}
        {conversations.length > 0 && (
          <div className='flex items-center gap-2'>
            <select
              value={selectedConversationId || ''}
              onChange={e => setSelectedConversationId(e.target.value)}
              className='flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value=''>Select a conversation...</option>
              {conversations.map((conversation: Conversation) => (
                <option key={conversation.id} value={conversation.id}>
                  {conversation.title}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateConversation}
              className='bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors flex-shrink-0'
              aria-label='New Chat'
              title='New Chat'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v16m8-8H4'
                />
              </svg>
            </button>
          </div>
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
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-50 ml-8'
                          : message.role === 'assistant'
                            ? 'bg-gray-50 mr-8'
                            : 'bg-yellow-50'
                      }`}
                    >
                      <div className='text-xs text-gray-500 mb-1 font-medium'>
                        {message.role === 'user'
                          ? 'You'
                          : message.role === 'assistant'
                            ? 'Assistant'
                            : 'System'}
                        {message.modelId && ` (${message.modelId})`}
                      </div>
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
