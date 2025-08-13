import { useQuery, useStore } from '@livestore/react'
import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { events } from '@work-squared/shared/schema'
import {
  getConversations$,
  getConversationMessages$,
  getBoardById$,
  getWorkerById$,
  getWorkers$,
} from '@work-squared/shared/queries'
import type { Conversation, ChatMessage } from '@work-squared/shared/schema'
import { MarkdownRenderer } from '../../markdown/MarkdownRenderer.js'
import { executeLLMTool } from '@work-squared/shared/llm-tools'
import { DEFAULT_MODEL } from '../../../util/models.js'
import { getAvatarColor } from '../../../utils/avatarColors.js'

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
  model: string,
  workerContext?: { systemPrompt: string; name: string; roleDescription?: string }
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
            llmMetadata: {
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
                  llmMetadata: {
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
            } else if (toolCall.function.name === 'create_document') {
              toolResultMessage = `Document created successfully:\n• Title: ${toolResult.title}\n• Document ID: ${toolResult.documentId}\n• Content length: ${toolResult.content?.length || 0} characters`
            } else if (toolCall.function.name === 'update_document') {
              toolResultMessage = `Document updated successfully:\n• Document ID: ${toolResult.document?.id}`
              if (toolResult.document?.title) {
                toolResultMessage += `\n• New title: ${toolResult.document.title}`
              }
              if (toolResult.document?.content !== undefined) {
                toolResultMessage += `\n• Content updated (${toolResult.document.content.length} characters)`
              }
            } else if (toolCall.function.name === 'add_document_to_project') {
              toolResultMessage = `Document successfully added to project:\n• Document ID: ${toolResult.association?.documentId}\n• Project ID: ${toolResult.association?.projectId}`
            } else if (toolCall.function.name === 'remove_document_from_project') {
              toolResultMessage = `Document successfully removed from project:\n• Document ID: ${toolResult.association?.documentId}\n• Project ID: ${toolResult.association?.projectId}`
            } else if (toolCall.function.name === 'archive_document') {
              toolResultMessage = `Document archived successfully:\n• Document ID: ${toolResult.document?.id}`
            } else if (toolCall.function.name === 'get_project_documents') {
              const documentList =
                toolResult.documents
                  ?.map(
                    (d: any) =>
                      `${d.title} (ID: ${d.id}) - Created: ${new Date(d.createdAt).toLocaleDateString()}`
                  )
                  .join('\n• ') || 'No documents found in project'
              toolResultMessage = `Project documents:\n• ${documentList}`
            } else if (toolCall.function.name === 'search_project_documents') {
              const searchResults =
                toolResult.results
                  ?.map((r: any) => `${r.title} (ID: ${r.id})\n  Snippet: ${r.snippet}`)
                  .join('\n\n• ') || 'No matching documents found in project'
              toolResultMessage = `Project search results:\n• ${searchResults}`
            } else if (toolCall.function.name === 'update_task') {
              toolResultMessage = `Task updated successfully:\n• Task ID: ${toolResult.task?.id}`
              if (toolResult.task?.title) {
                toolResultMessage += `\n• New title: ${toolResult.task.title}`
              }
              if (toolResult.task?.description !== undefined) {
                toolResultMessage += `\n• Description updated`
              }
              if (toolResult.task?.assigneeIds) {
                toolResultMessage += `\n• Assignees updated`
              }
            } else if (toolCall.function.name === 'move_task') {
              toolResultMessage = `Task moved successfully:\n• Task ID: ${toolResult.task?.id}\n• New column ID: ${toolResult.task?.columnId}\n• Position: ${toolResult.task?.position}`
            } else if (toolCall.function.name === 'move_task_to_project') {
              toolResultMessage = `Task moved to project:\n• Task ID: ${toolResult.task?.id}\n• New project ID: ${toolResult.task?.projectId || 'orphaned'}\n• New column ID: ${toolResult.task?.columnId}\n• Position: ${toolResult.task?.position}`
            } else if (toolCall.function.name === 'archive_task') {
              toolResultMessage = `Task archived successfully:\n• Task ID: ${toolResult.task?.id}`
            } else if (toolCall.function.name === 'unarchive_task') {
              toolResultMessage = `Task unarchived successfully:\n• Task ID: ${toolResult.task?.id}`
            } else if (toolCall.function.name === 'get_task_by_id') {
              if (toolResult.task) {
                const t = toolResult.task
                toolResultMessage = `Task details:\n• ID: ${t.id}\n• Title: ${t.title}\n• Project ID: ${t.projectId || 'none'}\n• Column ID: ${t.columnId || 'none'}\n• Description: ${t.description || 'none'}\n• Position: ${t.position}`
                if (t.assigneeIds?.length) {
                  toolResultMessage += `\n• Assignees: ${t.assigneeIds.join(', ')}`
                }
              } else {
                toolResultMessage = 'Task not found'
              }
            } else if (toolCall.function.name === 'get_project_tasks') {
              const taskList =
                toolResult.tasks
                  ?.map(
                    (t: any) =>
                      `${t.title} (ID: ${t.id}) - Column: ${t.columnId}, Position: ${t.position}`
                  )
                  .join('\n• ') || 'No tasks found in project'
              toolResultMessage = `Project tasks:\n• ${taskList}`
            } else if (toolCall.function.name === 'get_orphaned_tasks') {
              const taskList =
                toolResult.tasks
                  ?.map((t: any) => `${t.title} (ID: ${t.id}) - Position: ${t.position}`)
                  .join('\n• ') || 'No orphaned tasks found'
              toolResultMessage = `Orphaned tasks:\n• ${taskList}`
            } else if (toolCall.function.name === 'get_project_details') {
              if (toolResult.project) {
                const p = toolResult.project
                toolResultMessage = `Project details:\n• ID: ${p.id}\n• Name: ${p.name}\n• Description: ${p.description || 'none'}\n• Document count: ${p.documentCount}\n• Task count: ${p.taskCount}`
              } else {
                toolResultMessage = 'Project not found'
              }
            } else {
              // For any other tools, return the full result as JSON so the AI gets all the data
              toolResultMessage = `Tool executed successfully. Result: ${JSON.stringify(toolResult, null, 2)}`
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
          model,
          workerContext
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

        // Surface the error to the user instead of failing silently
        const errorMessage = (error as Error).message || 'Unknown error occurred'
        const isTimeout = errorMessage.includes('timed out')

        store.commit(
          events.llmResponseReceived({
            id: crypto.randomUUID(),
            conversationId: selectedConversationId,
            message: isTimeout
              ? 'The request timed out after 30 seconds. This can happen with complex tool operations. Please try again with a simpler request.'
              : `An error occurred while processing your request: ${errorMessage}`,
            role: 'assistant',
            modelId: 'error',
            responseToMessageId: userMessage.id,
            createdAt: new Date(),
            llmMetadata: {
              source: 'error',
              agenticIteration: iteration,
              errorType: isTimeout ? 'timeout' : 'continuation_error',
            },
          })
        )
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
            llmMetadata: {
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
  model?: string,
  workerContext?: { systemPrompt: string; name: string; roleDescription?: string }
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
    workerContext,
  }

  console.log('🔗 Making request to:', proxyUrl)
  console.log('🔗 Request body:', requestBody)
  console.log('🔗 History for API:', historyForAPI)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
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
    clearTimeout(timeoutId)
    if ((fetchError as any)?.name === 'AbortError') {
      console.error('🔗 Fetch timeout')
      throw new Error('Request timed out')
    }
    console.error('🔗 Fetch error:', fetchError)
    throw fetchError
  }
}

export const ChatInterface: React.FC = () => {
  const { store } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const conversations = useQuery(getConversations$) ?? []
  const availableWorkers = useQuery(getWorkers$) ?? []
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null)
  const [showChatPicker, setShowChatPicker] = React.useState(false)

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
  const [processingConversations, setProcessingConversations] = React.useState<Set<string>>(
    new Set()
  )

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

  // Listen for user messages and trigger LLM responses
  React.useEffect(() => {
    if (!selectedConversationId) return

    const userMessagesQuery = getConversationMessages$(selectedConversationId)
    let isProcessingInternal = false // Prevent race conditions
    const currentConversationId = selectedConversationId // Capture the conversation ID for this effect

    const unsubscribe = store.subscribe(userMessagesQuery, {
      onUpdate: async messages => {
        if (isProcessingInternal) return // Skip if already processing

        const userMessages = messages.filter(m => m.role === 'user')
        const assistantMessages = messages.filter(m => m.role === 'assistant')

        // Find ALL user messages that don't have responses yet
        const unansweredMessages = userMessages.filter(
          userMsg =>
            !assistantMessages.some(assistantMsg => assistantMsg.responseToMessageId === userMsg.id)
        )

        if (unansweredMessages.length === 0) return

        isProcessingInternal = true
        setProcessingConversations(prev => new Set(prev).add(currentConversationId))

        try {
          // Process each unanswered message sequentially to avoid race conditions
          for (const userMessage of unansweredMessages) {
            console.log('🤖 Processing user message for LLM:', userMessage.message)

            try {
              // Get conversation history for context
              const conversationHistory = messages.filter(
                m =>
                  m.createdAt < userMessage.createdAt &&
                  m.llmMetadata?.source !== 'status' &&
                  m.llmMetadata?.source !== 'error'
              )
              const boardContext = currentBoard
                ? { id: currentBoard.id, name: currentBoard.name }
                : undefined
              // Build worker context if this is a worker conversation
              const workerContext =
                currentWorker && currentWorker.systemPrompt
                  ? {
                      systemPrompt: currentWorker.systemPrompt,
                      name: currentWorker.name,
                      roleDescription: currentWorker.roleDescription || undefined,
                    }
                  : undefined

              const llmResponse = await callLLMAPI(
                userMessage.message,
                conversationHistory,
                boardContext,
                selectedConversation?.model || DEFAULT_MODEL,
                workerContext
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
                  selectedConversation?.model || DEFAULT_MODEL,
                  workerContext
                )
              } else {
                // Normal text response without tools
                store.commit(
                  events.llmResponseReceived({
                    id: crypto.randomUUID(),
                    conversationId: selectedConversationId,
                    message: llmResponse.message,
                    role: 'assistant',
                    modelId: selectedConversation?.model || DEFAULT_MODEL,
                    responseToMessageId: userMessage.id,
                    createdAt: new Date(),
                    llmMetadata: { source: 'braintrust' },
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
                  llmMetadata: { source: 'error' },
                })
              )
            }
          }
        } finally {
          isProcessingInternal = false
          setProcessingConversations(prev => {
            const newSet = new Set(prev)
            newSet.delete(currentConversationId)
            return newSet
          })
        }
      },
    })

    return () => {
      unsubscribe()
      // Clean up processing state when unmounting or switching conversations
      // Only clear if still processing this specific conversation
      setProcessingConversations(prev => {
        const newSet = new Set(prev)
        // Only delete if this conversation is still in the set
        // This prevents clearing the state if a new subscription has already started
        if (newSet.has(currentConversationId)) {
          newSet.delete(currentConversationId)
        }
        return newSet
      })
    }
  }, [store, selectedConversationId, currentWorker, selectedConversation, currentBoard])

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
                  {selectedConversationId &&
                    processingConversations.has(selectedConversationId) && (
                      <div className='p-3 text-sm text-gray-500'>Pondering...</div>
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
                  {selectedConversationId &&
                    processingConversations.has(selectedConversationId) && (
                      <div className='mt-4 text-sm text-gray-500'>Pondering...</div>
                    )}
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
