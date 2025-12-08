import React from 'react'
import { useQuery, useStore } from '@livestore/react'
import type { StaticRoomDefinition } from '@lifebuild/shared/rooms'
import { getConversationMessages$ } from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import { useNavigationContext } from './useNavigationContext.js'
import { useRoomAgent } from './useRoomAgent.js'
import { useRoomConversation } from './useRoomConversation.js'

const FALLBACK_CONVERSATION_ID = '__room_chat_no_conversation__'
const generateMessageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `msg_${Math.random().toString(36).slice(2)}`
}

export const useRoomChat = (room: StaticRoomDefinition | null) => {
  const { store } = useStore()
  const navigationContext = useNavigationContext()
  const { worker, isProvisioning: workerPending } = useRoomAgent(room)
  const { conversation, isProvisioning: conversationPending } = useRoomConversation(room)
  const conversationId = conversation?.id ?? FALLBACK_CONVERSATION_ID

  const messages = useQuery(getConversationMessages$(conversationId)) ?? []
  const [messageText, setMessageText] = React.useState('')

  const isConversationArchived = Boolean(conversation?.archivedAt)
  const isWorkerInactive = worker ? worker.status !== 'active' : false
  const isReady =
    Boolean(worker) && Boolean(conversation) && !isWorkerInactive && !isConversationArchived
  const visibleMessages = conversation ? messages : []

  const handleSend = React.useCallback(() => {
    if (!isReady || !room || !messageText.trim()) return

    store.commit(
      events.chatMessageSent({
        id: generateMessageId(),
        conversationId: conversation!.id,
        message: messageText.trim(),
        role: 'user',
        navigationContext: navigationContext ? JSON.stringify(navigationContext) : undefined,
        createdAt: new Date(),
      })
    )
    setMessageText('')
  }, [conversation, isReady, messageText, navigationContext, room, store])

  // Send a message directly without going through state
  const sendDirectMessage = React.useCallback(
    (message: string) => {
      if (!isReady || !room || !message.trim()) return false

      store.commit(
        events.chatMessageSent({
          id: generateMessageId(),
          conversationId: conversation!.id,
          message: message.trim(),
          role: 'user',
          navigationContext: navigationContext ? JSON.stringify(navigationContext) : undefined,
          createdAt: new Date(),
        })
      )
      return true
    },
    [conversation, isReady, navigationContext, room, store]
  )

  return {
    worker,
    conversation,
    messages: visibleMessages,
    isProcessing: conversation?.processingState === 'processing' && !isConversationArchived,
    isProvisioning: workerPending || conversationPending,
    isConversationArchived,
    isWorkerInactive,
    messageText,
    setMessageText,
    sendMessage: handleSend,
    sendDirectMessage,
  }
}
