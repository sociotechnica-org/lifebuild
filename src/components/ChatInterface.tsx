import { useQuery, useStore } from '@livestore/react'
import React from 'react'
import { useLocation } from 'react-router-dom'

import { events } from '../livestore/schema.js'
import {
  getConversations$,
  getConversationMessages$,
  getUsers$,
  getBoardById$,
} from '../livestore/queries.js'
import type { Conversation, ChatMessage } from '../livestore/schema.js'
import { getInitials } from '../util/initials.js'
import { MarkdownRenderer } from './MarkdownRenderer.js'
import { executeLLMTool } from '../utils/llm-tools.js'

interface LLMAPIResponse {
  message: string
  toolCalls?: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }>
}

async function callLLMAPI(
  userMessage: string,
  conversationHistory?: ChatMessage[],
  currentBoard?: { id: string; name: string }
): Promise<LLMAPIResponse> {
  console.log('🔗 Calling LLM API via proxy...')

  // Use relative path for production, fallback to localhost for local development
  const proxyUrl = import.meta.env.PROD ? '/api/llm/chat' : 'http://localhost:8787/api/llm/chat'

  // Build conversation history for API
  const historyForAPI =
    conversationHistory?.map(msg => ({
      role: msg.role,
      content: msg.message,
    })) || []

  const requestBody = {
    message: userMessage,
    conversationHistory: historyForAPI,
    currentBoard,
  }

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

    return {
      message: data.message || 'No response generated',
      toolCalls: data.toolCalls || [],
    }
  } catch (fetchError) {
    console.error('🔗 Fetch error:', fetchError)
    throw fetchError
  }
}

export const ChatInterface: React.FC = () => {
  const { store } = useStore()
  const location = useLocation()
  const conversations = useQuery(getConversations$) ?? []
  const users = useQuery(getUsers$) ?? []
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null)
  const [messageText, setMessageText] = React.useState('')
  const [processingToolCalls, setProcessingToolCalls] = React.useState<Set<string>>(new Set())
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Extract current board ID from URL
  const getCurrentBoardId = () => {
    const path = location.pathname
    const match = path.match(/^\/board\/([^\/]+)/)
    return match ? match[1] : null
  }

  const currentBoardId = getCurrentBoardId()
  const boardResult = currentBoardId ? useQuery(getBoardById$(currentBoardId)) : null
  const currentBoard = boardResult?.[0] as any

  // Get first user as current user
  const currentUser = users[0]

  // Use a stable conversation ID for the query to avoid hook order issues
  const queryConversationId = selectedConversationId ?? '__no_conversation__'
  const allMessages = useQuery(getConversationMessages$(queryConversationId)) ?? []
  // Only show messages if we have a real conversation selected
  const messages = selectedConversationId ? allMessages : []

  const resetTextareaHeight = React.useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '80px'
    }
  }, [])

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
      resetTextareaHeight()
    },
    [store, messageText, selectedConversationId, resetTextareaHeight]
  )

  // Listen for user messages and trigger LLM responses
  React.useEffect(() => {
    if (!selectedConversationId) return

    const userMessagesQuery = getConversationMessages$(selectedConversationId)
    let isProcessing = false // Prevent race conditions

    const unsubscribe = store.subscribe(userMessagesQuery, {
      onUpdate: async messages => {
        if (isProcessing) return // Skip if already processing

        const userMessages = messages.filter(m => m.role === 'user')
        const assistantMessages = messages.filter(m => m.role === 'assistant')

        // Find ALL user messages that don't have responses yet
        const unansweredMessages = userMessages.filter(
          userMsg =>
            !assistantMessages.some(assistantMsg => assistantMsg.responseToMessageId === userMsg.id)
        )

        if (unansweredMessages.length === 0) return

        isProcessing = true

        try {
          // Process each unanswered message sequentially to avoid race conditions
          for (const userMessage of unansweredMessages) {
            console.log('🤖 Processing user message for LLM:', userMessage.message)

            try {
              // Get conversation history for context
              const conversationHistory = messages.filter(m => m.createdAt < userMessage.createdAt)
              const boardContext = currentBoard
                ? { id: currentBoard.id, name: currentBoard.name }
                : undefined
              const llmResponse = await callLLMAPI(
                userMessage.message,
                conversationHistory,
                boardContext
              )

              // Handle tool calls if present
              if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
                console.log('🔧 LLM wants to call tools:', llmResponse.toolCalls.length)

                // Create initial response with tool calls
                const responseId = crypto.randomUUID()
                store.commit(
                  events.llmResponseReceived({
                    id: responseId,
                    conversationId: selectedConversationId,
                    message:
                      llmResponse.message || "I'll help you with that. Let me create some tasks...",
                    role: 'assistant',
                    modelId: 'gpt-4o',
                    responseToMessageId: userMessage.id,
                    createdAt: new Date(),
                    metadata: {
                      source: 'braintrust',
                      toolCalls: llmResponse.toolCalls,
                    },
                  })
                )

                // Process tool calls
                for (const toolCall of llmResponse.toolCalls) {
                  try {
                    setProcessingToolCalls(prev => new Set(prev).add(toolCall.id))
                    console.log(
                      '🔧 Executing tool:',
                      toolCall.function.name,
                      toolCall.function.arguments
                    )

                    const toolArgs = JSON.parse(toolCall.function.arguments)
                    const toolResult = await executeLLMTool(store, {
                      name: toolCall.function.name,
                      parameters: toolArgs,
                    })

                    setProcessingToolCalls(prev => {
                      const newSet = new Set(prev)
                      newSet.delete(toolCall.id)
                      return newSet
                    })

                    // Create follow-up message with tool result
                    if (toolResult.success) {
                      let confirmationMessage = ''

                      if (toolCall.function.name === 'create_task') {
                        confirmationMessage = `✅ Created task "${toolResult.taskTitle}" on ${toolResult.boardName} in ${toolResult.columnName}${
                          toolResult.assigneeName ? ` (assigned to ${toolResult.assigneeName})` : ''
                        }`
                      } else if (toolCall.function.name === 'list_boards') {
                        const boardList =
                          toolResult.boards
                            ?.map((b: any) => `- ${b.name} (ID: ${b.id})`)
                            .join('\n') || 'No boards found'
                        confirmationMessage = `📋 Available boards:\n${boardList}`
                      } else {
                        confirmationMessage = `✅ Tool executed successfully`
                      }

                      store.commit(
                        events.llmResponseReceived({
                          id: crypto.randomUUID(),
                          conversationId: selectedConversationId,
                          message: confirmationMessage,
                          role: 'assistant',
                          modelId: 'gpt-4o',
                          responseToMessageId: userMessage.id,
                          createdAt: new Date(),
                          metadata: {
                            source: 'tool-result',
                            toolCall: toolCall,
                            toolResult: toolResult,
                          },
                        })
                      )
                    } else {
                      const errorMessage =
                        toolCall.function.name === 'create_task'
                          ? `❌ Failed to create task: ${toolResult.error}`
                          : `❌ Failed to execute ${toolCall.function.name}: ${toolResult.error}`

                      store.commit(
                        events.llmResponseReceived({
                          id: crypto.randomUUID(),
                          conversationId: selectedConversationId,
                          message: errorMessage,
                          role: 'assistant',
                          modelId: 'gpt-4o',
                          responseToMessageId: userMessage.id,
                          createdAt: new Date(),
                          metadata: {
                            source: 'tool-error',
                            toolCall: toolCall,
                            toolResult: toolResult,
                          },
                        })
                      )
                    }
                  } catch (toolError) {
                    console.error('❌ Tool execution error:', toolError)
                    setProcessingToolCalls(prev => {
                      const newSet = new Set(prev)
                      newSet.delete(toolCall.id)
                      return newSet
                    })

                    store.commit(
                      events.llmResponseReceived({
                        id: crypto.randomUUID(),
                        conversationId: selectedConversationId,
                        message: `❌ Error executing tool: ${(toolError as Error).message}`,
                        role: 'assistant',
                        modelId: 'error',
                        responseToMessageId: userMessage.id,
                        createdAt: new Date(),
                        metadata: {
                          source: 'tool-error',
                          toolCall: toolCall,
                          error: (toolError as Error).message,
                        },
                      })
                    )
                  }
                }
              } else {
                // Normal text response without tools
                store.commit(
                  events.llmResponseReceived({
                    id: crypto.randomUUID(),
                    conversationId: selectedConversationId,
                    message: llmResponse.message,
                    role: 'assistant',
                    modelId: 'gpt-4o',
                    responseToMessageId: userMessage.id,
                    createdAt: new Date(),
                    metadata: { source: 'braintrust' },
                  })
                )
              }

              console.log('✅ LLM response sent for message:', userMessage.id)
            } catch (error) {
              console.error('❌ Error calling LLM for message:', userMessage.id, error)

              store.commit(
                events.llmResponseReceived({
                  id: crypto.randomUUID(),
                  conversationId: selectedConversationId,
                  message:
                    'Sorry, I encountered an error processing your message. Please try again.',
                  role: 'assistant',
                  modelId: 'error',
                  responseToMessageId: userMessage.id,
                  createdAt: new Date(),
                  metadata: { source: 'error' },
                })
              )
            }
          }
        } finally {
          isProcessing = false
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

                      {/* Tool call indicators */}
                      {message.metadata?.toolCalls && Array.isArray(message.metadata.toolCalls) && (
                        <div className='mb-2'>
                          {message.metadata.toolCalls.map((toolCall: any) => (
                            <div
                              key={toolCall.id}
                              className='flex items-center gap-2 text-xs text-blue-600 mb-1'
                            >
                              {processingToolCalls.has(toolCall.id) ? (
                                <>
                                  <div className='w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin' />
                                  <span>Creating task...</span>
                                </>
                              ) : (
                                <>
                                  <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                    <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
                                  </svg>
                                  <span>Tool: {toolCall.function.name}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Task creation link */}
                      {message.metadata?.source === 'tool-result' &&
                        (message.metadata.toolResult as any)?.success && (
                          <div className='mb-2 p-2 bg-green-50 border border-green-200 rounded text-xs'>
                            <div className='flex items-center gap-2 text-green-700'>
                              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                                <path
                                  fillRule='evenodd'
                                  d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                  clipRule='evenodd'
                                />
                              </svg>
                              <span>Task created successfully</span>
                            </div>
                            {(message.metadata.toolResult as any)?.taskId && (
                              <div className='mt-1'>
                                <button
                                  onClick={() => {
                                    // Navigate to the task - simplified for now
                                    console.log(
                                      'Navigate to task:',
                                      (message.metadata!.toolResult as any).taskId
                                    )
                                  }}
                                  className='text-blue-600 hover:text-blue-800 underline'
                                >
                                  View task: {(message.metadata!.toolResult as any).taskTitle}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                      {message.role === 'assistant' ? (
                        <MarkdownRenderer content={message.message} className='' />
                      ) : (
                        <div className='text-sm text-gray-900'>{message.message}</div>
                      )}
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
            <div className='flex-shrink-0 bg-gray-50 border-t border-gray-200 relative'>
              <form onSubmit={handleSendMessage} className='h-full'>
                <textarea
                  ref={textareaRef}
                  value={messageText}
                  onChange={handleTextareaChange}
                  placeholder='Type your message...'
                  rows={1}
                  className='w-full h-full px-4 py-4 pr-14 bg-transparent border-none text-sm resize-none focus:outline-none placeholder-gray-500 overflow-y-auto'
                  style={{ minHeight: '80px', maxHeight: '200px', height: '80px' }}
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
