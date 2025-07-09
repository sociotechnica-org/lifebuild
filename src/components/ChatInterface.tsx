import { useQuery, useStore } from '@livestore/react'
import React from 'react'
import { useLocation } from 'react-router-dom'

import { events } from '../livestore/schema.js'
import { getConversations$, getConversationMessages$, getBoardById$ } from '../livestore/queries.js'
import type { Conversation, ChatMessage } from '../livestore/schema.js'
import { MarkdownRenderer } from './MarkdownRenderer.js'
import { executeLLMTool } from '../utils/llm-tools.js'
import { ModelSelector } from './ModelSelector.js'
import { DEFAULT_MODEL } from '../util/models.js'

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

// Agentic loop to handle multi-step tool calling
async function runAgenticLoop(
  userMessage: ChatMessage,
  conversationHistory: ChatMessage[],
  initialLLMResponse: LLMAPIResponse,
  initialToolMessages: Array<{ role: string; content: string; tool_call_id?: string }>,
  boardContext: { id: string; name: string } | undefined,
  selectedConversationId: string,
  store: any,
  model: string
): Promise<void> {
  console.log('🚀 Starting agentic loop')

  const currentHistory = [...conversationHistory, { role: 'user', content: userMessage.message }]

  const maxIterations = 5 // Prevent infinite loops
  let iteration = 0
  let currentResponse = initialLLMResponse

  while (iteration < maxIterations) {
    iteration++
    console.log(`🔄 Agentic loop iteration ${iteration}`)

    // If we have tool calls to execute
    if (currentResponse.toolCalls && currentResponse.toolCalls.length > 0) {
      console.log(`🔧 Executing ${currentResponse.toolCalls.length} tool calls`)

      // Show tool call indicators in UI (if this is the first iteration or has a message)
      if (iteration === 1 || (currentResponse.message && currentResponse.message.trim())) {
        store.commit(
          events.llmResponseReceived({
            id: crypto.randomUUID(),
            conversationId: selectedConversationId,
            message: currentResponse.message || '',
            role: 'assistant',
            modelId: model,
            responseToMessageId: userMessage.id,
            createdAt: new Date(),
            metadata: {
              source: 'braintrust',
              toolCalls: currentResponse.toolCalls,
            },
          })
        )
      }

      // Add LLM's response to history
      currentHistory.push({
        role: 'assistant',
        content: currentResponse.message || '', // Ensure content is never null
        tool_calls: currentResponse.toolCalls,
      } as any)

      // Execute all tool calls
      const toolMessages: Array<{ role: string; content: string; tool_call_id?: string }> = []

      for (const toolCall of currentResponse.toolCalls) {
        try {
          console.log(`🔧 Executing tool: ${toolCall.function.name}`)

          const toolArgs = JSON.parse(toolCall.function.arguments)
          const toolResult = await executeLLMTool(store, {
            name: toolCall.function.name,
            parameters: toolArgs,
          })

          let toolResultMessage = ''
          if (toolResult.success) {
            if (toolCall.function.name === 'create_task') {
              toolResultMessage = `Task created successfully: "${toolResult.taskTitle}" on board "${toolResult.boardName}" in column "${toolResult.columnName}"${
                toolResult.assigneeName ? ` (assigned to ${toolResult.assigneeName})` : ''
              }. Task ID: ${toolResult.taskId}`

              // Show success notification in UI
              store.commit(
                events.llmResponseReceived({
                  id: crypto.randomUUID(),
                  conversationId: selectedConversationId,
                  message: `✅ Created task successfully`,
                  role: 'assistant',
                  modelId: model,
                  responseToMessageId: userMessage.id,
                  createdAt: new Date(),
                  metadata: {
                    source: 'tool-result',
                    toolCall: toolCall,
                    toolResult: toolResult,
                  },
                })
              )
            } else if (toolCall.function.name === 'list_projects') {
              const projectList =
                toolResult.projects
                  ?.map(
                    (p: any) =>
                      `${p.name} (ID: ${p.id})${p.description ? ` - ${p.description}` : ''}`
                  )
                  .join('\n• ') || 'No projects found'
              toolResultMessage = `Available projects:\n• ${projectList}`
            } else if (toolCall.function.name === 'list_documents') {
              const documentList =
                toolResult.documents
                  ?.map(
                    (d: any) =>
                      `${d.title} (ID: ${d.id}) - Updated: ${new Date(d.updatedAt).toLocaleDateString()}`
                  )
                  .join('\n• ') || 'No documents found'
              toolResultMessage = `Available documents:\n• ${documentList}`
            } else if (toolCall.function.name === 'read_document') {
              if (toolResult.document) {
                const doc = toolResult.document
                toolResultMessage = `Document: ${doc.title}\n\nContent:\n${doc.content}`
              } else {
                toolResultMessage = 'Document not found'
              }
            } else if (toolCall.function.name === 'search_documents') {
              const searchResults =
                toolResult.results
                  ?.map((r: any) => `${r.title} (ID: ${r.id})\n  Snippet: ${r.snippet}`)
                  .join('\n\n• ') || 'No matching documents found'
              toolResultMessage = `Search results:\n• ${searchResults}`
            } else {
              toolResultMessage = `Tool executed successfully`
            }
          } else {
            toolResultMessage = `Error: ${toolResult.error}`
          }

          toolMessages.push({
            role: 'tool',
            content: toolResultMessage,
            tool_call_id: toolCall.id,
          })
        } catch (toolError) {
          console.error('❌ Tool execution error:', toolError)
          toolMessages.push({
            role: 'tool',
            content: `Error executing tool: ${(toolError as Error).message}`,
            tool_call_id: toolCall.id,
          })
        }
      }

      // Add tool results to history
      currentHistory.push(
        ...toolMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          tool_call_id: msg.tool_call_id,
        }))
      )

      console.log(`🔄 Tool execution complete, getting LLM continuation...`)

      // Get LLM's next response
      try {
        currentResponse = await callLLMAPI(
          '', // Empty message since we're continuing with tool results
          currentHistory as any, // Mixed message types for OpenAI API
          boardContext,
          model
        )

        console.log(`🔄 Iteration ${iteration} LLM response:`, {
          hasMessage: !!currentResponse.message?.trim(),
          hasToolCalls: (currentResponse.toolCalls?.length || 0) > 0,
          messagePreview: currentResponse.message?.substring(0, 100),
        })

        // Continue the loop to process any new tool calls or final message
        continue
      } catch (error) {
        console.error(`❌ Error getting LLM continuation in iteration ${iteration}:`, error)
        break
      }
    } else {
      // No more tool calls - handle final response
      if (currentResponse.message && currentResponse.message.trim()) {
        console.log(`✅ Final LLM message: ${currentResponse.message.substring(0, 100)}...`)
        store.commit(
          events.llmResponseReceived({
            id: crypto.randomUUID(),
            conversationId: selectedConversationId,
            message: currentResponse.message,
            role: 'assistant',
            modelId: model,
            responseToMessageId: userMessage.id,
            createdAt: new Date(),
            metadata: {
              source: 'braintrust',
              isContinuation: iteration > 1,
              agenticIteration: iteration,
            },
          })
        )
      }

      console.log(`✅ Agentic loop completed after ${iteration} iterations`)
      break
    }
  }

  if (iteration >= maxIterations) {
    console.warn('⚠️ Agentic loop reached maximum iterations')
  }
}

async function callLLMAPI(
  userMessage: string,
  conversationHistory?: ChatMessage[],
  currentBoard?: { id: string; name: string },
  model?: string
): Promise<LLMAPIResponse> {
  console.log('🔗 Calling LLM API via proxy...')

  // Use relative path for production, fallback to localhost for local development
  const proxyUrl = import.meta.env.PROD ? '/api/llm/chat' : 'http://localhost:8787/api/llm/chat'
  console.log('🔗 PROD mode:', import.meta.env.PROD, 'Using URL:', proxyUrl)

  // Build conversation history for API
  const historyForAPI =
    conversationHistory?.map(msg => {
      // Handle both our ChatMessage format and OpenAI format
      const content = (msg as any).content || (msg as any).message || ''
      return {
        role: msg.role,
        content: content,
        // Include tool_calls if present
        ...((msg as any).tool_calls && { tool_calls: (msg as any).tool_calls }),
        // Include tool_call_id if present
        ...((msg as any).tool_call_id && { tool_call_id: (msg as any).tool_call_id }),
      }
    }) || []

  const requestBody = {
    message: userMessage,
    conversationHistory: historyForAPI,
    currentBoard,
    model: model || DEFAULT_MODEL,
  }

  console.log('🔗 Making request to:', proxyUrl)
  console.log('🔗 Request body:', requestBody)
  console.log('🔗 History for API:', historyForAPI)

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
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null)
  const [messageText, setMessageText] = React.useState('')
  const [selectedModelForNextMessage, setSelectedModelForNextMessage] =
    React.useState<string>(DEFAULT_MODEL)
  const selectedModelRef = React.useRef<string>(DEFAULT_MODEL)
  const userHasChangedModel = React.useRef<boolean>(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Extract current board ID from URL
  const getCurrentBoardId = () => {
    const path = location.pathname
    const match = path.match(/^\/board\/([^\/]+)/)
    return match ? match[1] : null
  }

  const currentBoardId = getCurrentBoardId()
  // Create a stable query using useMemo to avoid hooks order issues
  const boardQuery = React.useMemo(() => {
    return currentBoardId ? getBoardById$(currentBoardId) : null
  }, [currentBoardId])

  // Always call useQuery but conditionally use the result
  const boardResult = useQuery(boardQuery || getBoardById$('__no_board__'))
  const currentBoard = currentBoardId && boardResult?.[0] ? (boardResult[0] as any) : null

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
        model: DEFAULT_MODEL,
        createdAt: new Date(),
      })
    )

    setSelectedConversationId(id)
  }, [store])

  const handleModelChange = React.useCallback(
    (newModel: string) => {
      setSelectedModelForNextMessage(newModel)
      selectedModelRef.current = newModel // Keep ref in sync
      userHasChangedModel.current = true

      // Persist the model change to the database if we have a selected conversation
      if (selectedConversationId) {
        store.commit(
          events.conversationModelUpdated({
            id: selectedConversationId,
            model: newModel,
            updatedAt: new Date(),
          })
        )
      }
    },
    [selectedConversationId, store]
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
                boardContext,
                selectedModelRef.current // Use ref to get current model at processing time
              )

              // Handle tool calls if present - start agentic loop immediately
              if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
                console.log(
                  '🔧 LLM wants to call tools, starting agentic loop:',
                  llmResponse.toolCalls.length
                )

                // Start the agentic loop with the initial response
                await runAgenticLoop(
                  userMessage,
                  conversationHistory,
                  llmResponse,
                  [], // No initial tool messages - agentic loop will execute them
                  boardContext,
                  selectedConversationId,
                  store,
                  selectedModelRef.current // Use ref to get current model at processing time
                )
              } else {
                // Normal text response without tools
                store.commit(
                  events.llmResponseReceived({
                    id: crypto.randomUUID(),
                    conversationId: selectedConversationId,
                    message: llmResponse.message,
                    role: 'assistant',
                    modelId: selectedModelRef.current, // Use ref to get current model at processing time
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
  }, [store, selectedConversationId]) // Don't depend on selectedModelForNextMessage to avoid subscription churn

  // Auto-select first conversation if none selected
  React.useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0]?.id || null)
    }
  }, [selectedConversationId, conversations])

  // Get selected conversation object (needed for useEffect below)
  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  // Update selected model when conversation changes (but not on new messages)
  React.useEffect(() => {
    // Reset the user change flag when switching conversations
    userHasChangedModel.current = false

    if (selectedConversationId && selectedConversation) {
      // Use the conversation's stored model, or default if not set
      const model = selectedConversation.model || DEFAULT_MODEL
      setSelectedModelForNextMessage(model)
      selectedModelRef.current = model // Keep ref in sync
    } else {
      // No conversation selected, use default
      setSelectedModelForNextMessage(DEFAULT_MODEL)
      selectedModelRef.current = DEFAULT_MODEL // Keep ref in sync
    }
  }, [selectedConversationId, selectedConversation]) // Depend on conversation and its data

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
          <h2 className='text-lg font-semibold text-gray-900'>Chat</h2>
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
                  {messages.map((message: ChatMessage) => {
                    // Tool result notifications - render as special cards
                    if (message.metadata?.source === 'tool-result') {
                      return (
                        <div key={message.id} className='px-2'>
                          {(message.metadata?.toolResult as any)?.success && (
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
                            !message.metadata?.toolCalls ||
                            !Array.isArray(message.metadata.toolCalls)
                          ) {
                            return null
                          }
                          return (
                            <div className='mb-2'>
                              {(message.metadata.toolCalls as any[]).map((toolCall: any) => (
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
                      </div>
                    )
                  })}
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
            <div className='flex-shrink-0 bg-gray-50 border-t border-gray-200'>
              {/* Model Selector */}
              <div className='px-4 py-3 border-b border-gray-200'>
                <ModelSelector
                  selectedModel={selectedModelForNextMessage}
                  onModelChange={handleModelChange}
                />
              </div>

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
