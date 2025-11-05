import { useQuery, useStore } from '@livestore/react'
import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getConversations$,
  getConversationMessages$,
  getWorkerById$,
  getWorkers$,
} from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import type { Conversation, ChatMessage, Worker } from '@work-squared/shared/schema'
import { DEFAULT_MODEL } from '../utils/models.js'
import { useNavigationContext } from './useNavigationContext.js'

export interface ChatData {
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
  onCreateConversation: (workerId?: string) => void
  onSendMessage: (e: React.FormEvent) => void
  onMessageTextChange: (text: string) => void
  onShowChatPicker: () => void
  onHideChatPicker: () => void
  onChatTypeSelect: (workerId?: string) => void
}

export const useChatData = (): ChatData => {
  const { store } = useStore()
  const location = useLocation()
  const navigate = useNavigate()

  // Basic queries
  const conversations = useQuery(getConversations$) ?? []
  const availableWorkers = useQuery(getWorkers$) ?? []

  // Local state
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null)
  const [showChatPicker, setShowChatPicker] = React.useState(false)
  const [messageText, setMessageText] = React.useState('')

  // Calculate processing conversations from conversation state
  const processingConversations = React.useMemo(() => {
    const processing = new Set<string>()
    conversations.forEach(conversation => {
      if (conversation.processingState === 'processing') {
        processing.add(conversation.id)
      }
    })
    return processing
  }, [conversations])

  // Handle URL parameters for conversation selection
  React.useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlConversationId = params.get('conversationId')

    if (urlConversationId && conversations.some(c => c.id === urlConversationId)) {
      setSelectedConversationId(urlConversationId)
    }
  }, [location.search, conversations])

  // Get selected conversation and worker
  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null

  // Query for worker if conversation has workerId - use stable queries to avoid hooks issues
  const workerQuery = React.useMemo(() => {
    return selectedConversation?.workerId ? getWorkerById$(selectedConversation.workerId) : null
  }, [selectedConversation?.workerId])

  const workerResult = useQuery(workerQuery || getWorkerById$('__no_worker__'))
  const currentWorker = selectedConversation?.workerId && workerResult?.[0] ? workerResult[0] : null

  // Get messages for selected conversation
  const queryConversationId = selectedConversationId ?? '__no_conversation__'
  const allMessages = useQuery(getConversationMessages$(queryConversationId)) ?? []
  const messages = selectedConversationId ? allMessages : []

  // Get current navigation context for LLM
  const navigationContext = useNavigationContext()

  // Action handlers
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
          navigationContext: navigationContext ? JSON.stringify(navigationContext) : undefined,
          createdAt: new Date(),
        })
      )

      setMessageText('')
    },
    [messageText, selectedConversationId, store, navigationContext]
  )

  const handleShowChatPicker = React.useCallback(() => {
    setShowChatPicker(true)
  }, [])

  const handleHideChatPicker = React.useCallback(() => {
    setShowChatPicker(false)
  }, [])

  const handleChatTypeSelect = React.useCallback(
    (workerId?: string) => {
      setShowChatPicker(false)
      handleCreateConversation(workerId)
    },
    [handleCreateConversation]
  )

  return {
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
    onConversationChange: handleConversationChange,
    onCreateConversation: handleCreateConversation,
    onSendMessage: handleSendMessage,
    onMessageTextChange: setMessageText,
    onShowChatPicker: handleShowChatPicker,
    onHideChatPicker: handleHideChatPicker,
    onChatTypeSelect: handleChatTypeSelect,
  }
}
