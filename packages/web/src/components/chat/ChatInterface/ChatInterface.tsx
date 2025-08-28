import { useQuery, useStore } from '@livestore/react'
import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { events } from '@work-squared/shared/schema'
import {
  getConversations$,
  getConversationMessages$,
  getWorkerById$,
  getWorkers$,
} from '@work-squared/shared/queries'
import type { Conversation, ChatMessage } from '@work-squared/shared/schema'
import { MarkdownRenderer } from '../../markdown/MarkdownRenderer.js'
import { DEFAULT_MODEL } from '../../../util/models.js'
import { getAvatarColor } from '../../../utils/avatarColors.js'

// Client-side LLM processing removed - all processing happens server-side

export const ChatInterface: React.FC = () => {
  const { store } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const conversations = useQuery(getConversations$) ?? []
  const availableWorkers = useQuery(getWorkers$) ?? []
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null)
  const [showChatPicker, setShowChatPicker] = React.useState(false)
  const [processingConversations, setProcessingConversations] = React.useState<Set<string>>(
    new Set()
  )

  // Handle URL parameters for conversation selection
  React.useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlConversationId = params.get('conversationId')

    if (urlConversationId && conversations.some(c => c.id === urlConversationId)) {
      setSelectedConversationId(urlConversationId)
    }
  }, [location.search, conversations])
  const [messageText, setMessageText] = React.useState('')
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Get selected conversation object to check for workerId
  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  // Query for worker if conversation has workerId
  const workerQuery = React.useMemo(() => {
    return selectedConversation?.workerId ? getWorkerById$(selectedConversation.workerId) : null
  }, [selectedConversation?.workerId])

  const workerResult = useQuery(workerQuery || getWorkerById$('__no_worker__'))
  const currentWorker = selectedConversation?.workerId && workerResult?.[0] ? workerResult[0] : null

  // Use a stable conversation ID for the query to avoid hook order issues
  const queryConversationId = selectedConversationId ?? '__no_conversation__'
  const allMessages = useQuery(getConversationMessages$(queryConversationId)) ?? []
  // Only show messages if we have a real conversation selected
  const messages = selectedConversationId ? allMessages : []

  // Track processing state based on message flow
  React.useEffect(() => {
    if (!selectedConversationId || !messages) return

    // Check if the last message is a user message without a following assistant response
    const lastMessage = messages[messages.length - 1]
    const hasUnrespondedUserMessage = lastMessage && lastMessage.role === 'user'

    setProcessingConversations(prev => {
      const next = new Set(prev)
      
      if (hasUnrespondedUserMessage) {
        next.add(selectedConversationId)
      } else {
        next.delete(selectedConversationId)
      }
      
      return next.size !== prev.size || next.has(selectedConversationId) !== prev.has(selectedConversationId) ? next : prev
    })
  }, [selectedConversationId, messages])

  const resetTextareaHeight = React.useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '80px'
    }
  }, [])

  const handleConversationChange = React.useCallback(
    (conversationId: string) => {
      const conversation = conversations.find(c => c.id === conversationId)

      if (conversation) {
        setSelectedConversationId(conversationId)

        // Update URL parameters
        const params = new URLSearchParams(location.search)
        params.set('conversationId', conversationId)

        if (conversation.workerId) {
          params.set('workerId', conversation.workerId)
        } else {
          params.delete('workerId')
        }

        navigate(`${location.pathname}?${params.toString()}`, { replace: true })
      }
    },
    [conversations, location, navigate]
  )

  const handleCreateConversation = React.useCallback(
    (workerId?: string) => {
      const id = crypto.randomUUID()
      const title = workerId
        ? `Chat with ${availableWorkers.find(w => w.id === workerId)?.name || 'Worker'} - ${new Date().toLocaleTimeString()}`
        : `New Chat ${new Date().toLocaleTimeString()}`

      store.commit(
        events.conversationCreated({
          id,
          title,
          model: DEFAULT_MODEL,
          workerId,
          createdAt: new Date(),
        })
      )

      // Navigate immediately without waiting for query to update
      setSelectedConversationId(id)

      // Update URL parameters directly
      const params = new URLSearchParams(location.search)
      params.set('conversationId', id)

      if (workerId) {
        params.set('workerId', workerId)
      } else {
        params.delete('workerId')
      }

      navigate(`${location.pathname}?${params.toString()}`, { replace: true })
    },
    [store, availableWorkers, location, navigate]
  )

  const handleNewChatClick = React.useCallback(() => {
    setShowChatPicker(true)
  }, [])

  const handleChatTypeSelect = React.useCallback(
    (workerId?: string) => {
      setShowChatPicker(false)
      handleCreateConversation(workerId)
    },
    [handleCreateConversation]
  )

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
      resetTextareaHeight()
    },
    [store, messageText, selectedConversationId, resetTextareaHeight]
  )

  const handleRetry = React.useCallback(
    (failedMessage: ChatMessage) => {
      if (!selectedConversationId) return
      const original = messages.find(m => m.id === failedMessage.responseToMessageId)
      if (!original) return
      store.commit(
        events.chatMessageSent({
          id: crypto.randomUUID(),
          conversationId: selectedConversationId,
          message: original.message,
          role: 'user',
          createdAt: new Date(),
        })
      )
    },
    [messages, selectedConversationId, store]
  )

  // Server handles all LLM processing - no client-side processing needed

  // Auto-select first conversation if none selected
  React.useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0]?.id || null)
    }
  }, [selectedConversationId, conversations])

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Handle focus for mobile to show keyboard
  React.useEffect(() => {
    // Only autofocus on mobile if there's a selected conversation
    if (selectedConversationId && textareaRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [selectedConversationId])

  // Auto-resize textarea
  const handleTextareaChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value)

    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    const scrollHeight = textarea.scrollHeight
    const maxHeight = 200
    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
  }, [])

  return (
    <div className='h-full bg-white md:border md:border-gray-200 md:rounded-lg md:shadow-sm flex flex-col'>
      {/* Chat Header - Fixed */}
      <div className='flex-shrink-0 p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between mb-2'>
          {currentWorker ? (
            <div className='flex items-center gap-3'>
              <div
                className={`w-10 h-10 ${getAvatarColor(currentWorker.id)} text-white rounded-full flex items-center justify-center text-lg font-medium`}
              >
                {currentWorker.avatar || '🤖'}
              </div>
              <div>
                <h2 className='text-lg font-semibold text-gray-900'>{currentWorker.name}</h2>
                {currentWorker.roleDescription && (
                  <p className='text-sm text-gray-600'>{currentWorker.roleDescription}</p>
                )}
                <p className='text-xs text-gray-500'>Model: {currentWorker.defaultModel}</p>
              </div>
            </div>
          ) : (
            <h2 className='text-lg font-semibold text-gray-900'>Chat</h2>
          )}
        </div>

        {/* Conversation Selector with + button inline */}
        {conversations.length > 0 && (
          <div className='flex items-center gap-2'>
            <select
              value={selectedConversationId || ''}
              onChange={e => handleConversationChange(e.target.value)}
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
              onClick={handleNewChatClick}
              className='bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors flex-shrink-0 cursor-pointer'
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
                  {messages.map((message: ChatMessage) => {
                    // Tool result notifications - render as special cards
                    if (message.llmMetadata?.source === 'tool-result') {
                      return (
                        <div key={message.id} className='px-2'>
                          {(message.llmMetadata?.toolResult as any)?.success && (
                            <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
                              <div className='flex items-center gap-2 text-green-700 text-sm font-medium mb-2'>
                                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                                  <path
                                    fillRule='evenodd'
                                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                    clipRule='evenodd'
                                  />
                                </svg>
                                <span>Task created successfully</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    }

                    // Regular chat messages
                    if (message.llmMetadata?.source === 'status') {
                      return (
                        <div
                          key={message.id}
                          className='p-3 rounded-lg bg-gray-50 mr-8 flex items-center gap-2 text-sm text-gray-600'
                        >
                          <svg className='w-4 h-4 animate-spin text-gray-400' viewBox='0 0 24 24'>
                            <circle
                              className='opacity-25'
                              cx='12'
                              cy='12'
                              r='10'
                              stroke='currentColor'
                              strokeWidth='4'
                              fill='none'
                            />
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
                            />
                          </svg>
                          <span>{message.message}</span>
                        </div>
                      )
                    }
                    return (
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

                        {/* Tool call indicators */}
                        {(() => {
                          if (
                            !message.llmMetadata?.toolCalls ||
                            !Array.isArray(message.llmMetadata.toolCalls)
                          ) {
                            return null
                          }
                          return (
                            <div className='mb-2'>
                              {(message.llmMetadata.toolCalls as any[]).map((toolCall: any) => (
                                <div
                                  key={toolCall.id}
                                  className='flex items-center gap-2 text-xs text-blue-600 mb-1'
                                >
                                  <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                    <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
                                  </svg>
                                  <span>Tool: {toolCall.function.name}</span>
                                </div>
                              ))}
                            </div>
                          )
                        })()}

                        {/* Only show message content if it exists and isn't the placeholder */}
                        {message.message &&
                          message.message.trim() &&
                          message.message !== 'No response generated' &&
                          (message.role === 'assistant' ? (
                            <MarkdownRenderer content={message.message} className='' />
                          ) : (
                            <div className='text-sm text-gray-900'>{message.message}</div>
                          ))}

                        {message.message &&
                          message.message.trim() &&
                          message.message !== 'No response generated' && (
                            <div className='mt-2 flex justify-end gap-2'>
                              <button
                                onClick={() => {
                                  if (
                                    navigator.clipboard &&
                                    typeof navigator.clipboard.writeText === 'function'
                                  ) {
                                    navigator.clipboard
                                      .writeText(message.message as string)
                                      .catch(err => {
                                        console.error('Failed to copy message', err)
                                      })
                                  } else {
                                    console.error('Clipboard API not available')
                                  }
                                }}
                                className='flex items-center p-1 rounded text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer'
                              >
                                <svg
                                  className='w-3.5 h-3.5'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={1.5}
                                    d='M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184'
                                  />
                                </svg>
                              </button>
                              {message.llmMetadata?.source === 'error' &&
                                message.responseToMessageId && (
                                  <button
                                    onClick={() => handleRetry(message)}
                                    className='text-xs text-blue-600 hover:underline'
                                  >
                                    Retry
                                  </button>
                                )}
                            </div>
                          )}
                      </div>
                    )
                  })}

                  {/* Loading indicator for processing conversations */}
                  {selectedConversationId && processingConversations.has(selectedConversationId) && (
                    <div className='p-3 rounded-lg bg-gray-50 mr-8 flex items-center gap-2 text-sm text-gray-600'>
                      <svg className='w-4 h-4 animate-spin text-gray-400' viewBox='0 0 24 24'>
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                          fill='none'
                        />
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
                        />
                      </svg>
                      <span>Assistant is thinking...</span>
                    </div>
                  )}
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
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input - Fixed at bottom */}
            <div className='flex-shrink-0 bg-gray-50 border-t border-gray-200'>
              {/* Message Input */}
              <div className='relative'>
                <form onSubmit={handleSendMessage} className='h-full'>
                  <textarea
                    ref={textareaRef}
                    value={messageText}
                    onChange={handleTextareaChange}
                    placeholder='Type your message...'
                    rows={1}
                    className='w-full h-full px-4 py-4 pr-14 bg-transparent border-none text-base resize-none focus:outline-none placeholder-gray-500 overflow-y-auto'
                    style={{
                      minHeight: '80px',
                      maxHeight: '200px',
                      height: '80px',
                      fontSize: '16px',
                    }}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                  />
                  <button
                    type='submit'
                    disabled={!messageText.trim()}
                    className='absolute bottom-4 right-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors shadow-sm'
                    title='Send message (Enter)'
                  >
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 10l7-7m0 0l7 7m-7-7v18'
                      />
                    </svg>
                  </button>
                </form>
              </div>
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
                    onClick={handleNewChatClick}
                    className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer'
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

      {/* Chat Type Picker Modal */}
      {showChatPicker && (
        <div
          className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-50'
          onClick={e => {
            if (e.target === e.currentTarget) setShowChatPicker(false)
          }}
        >
          <div className='bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>Choose Chat Type</h3>
            <div className='space-y-2'>
              {/* Generic Chat Option */}
              <button
                onClick={() => handleChatTypeSelect()}
                className='w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer flex items-center'
              >
                <div className='w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3'>
                  💬
                </div>
                <div>
                  <div className='font-medium text-gray-900'>Generic Chat</div>
                  <div className='text-sm text-gray-500'>General purpose AI assistant</div>
                </div>
              </button>

              {/* Worker Options */}
              {availableWorkers.map(worker => (
                <button
                  key={worker.id}
                  onClick={() => handleChatTypeSelect(worker.id)}
                  className='w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer flex items-center'
                >
                  <div
                    className={`w-8 h-8 ${getAvatarColor(worker.id)} text-white rounded-full flex items-center justify-center text-sm font-medium mr-3`}
                  >
                    {worker.avatar || '🤖'}
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>{worker.name}</div>
                    <div className='text-sm text-gray-500'>
                      {worker.roleDescription || 'AI Worker'}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowChatPicker(false)}
              className='mt-4 w-full px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer'
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
