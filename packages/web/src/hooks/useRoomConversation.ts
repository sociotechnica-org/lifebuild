import React from 'react'
import { useQuery, useStore } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { getConversationByRoom$ } from '@work-squared/shared/queries'
import type { StaticRoomDefinition } from '@work-squared/shared/rooms'

const pendingConversationCreations = new Map<string, Promise<void>>()
const FALLBACK_ROOM_ID = '__room_chat_no_room__'

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `room_${Math.random().toString(36).slice(2)}`
}

export const useRoomConversation = (room?: StaticRoomDefinition | null) => {
  const { store } = useStore()
  const roomId = room?.roomId ?? FALLBACK_ROOM_ID

  const conversationQuery = React.useMemo(() => getConversationByRoom$(roomId), [roomId])
  const conversationResult = useQuery(conversationQuery)
  const conversationQueryReady = conversationResult !== undefined
  const conversation = roomId === FALLBACK_ROOM_ID ? null : (conversationResult?.[0] ?? null)

  React.useEffect(() => {
    if (!room || roomId === FALLBACK_ROOM_ID) return
    if (!conversationQueryReady) return
    if (conversation) return
    if (pendingConversationCreations.has(roomId)) return

    const promise = Promise.resolve(
      store.commit(
        events.conversationCreatedV2({
          id: generateId(),
          title: room.conversationTitle,
          model: room.worker.defaultModel,
          workerId: room.worker.id,
          roomId: room.roomId,
          roomKind: room.roomKind,
          scope: room.scope,
          createdAt: new Date(),
        })
      )
    )
    pendingConversationCreations.set(roomId, promise)
    promise.finally(() => {
      pendingConversationCreations.delete(roomId)
    })
  }, [room, conversation, conversationQueryReady, store, roomId])

  return {
    conversation,
    isProvisioning: Boolean(room) && !conversation,
  }
}
