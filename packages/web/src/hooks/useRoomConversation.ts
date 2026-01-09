import React from 'react'
import { useQuery, useStore } from '../livestore-compat.js'
import { events } from '@lifebuild/shared/schema'
import { getConversationByRoom$ } from '@lifebuild/shared/queries'
import type { StaticRoomDefinition } from '@lifebuild/shared/rooms'
import { usePostHog } from '../lib/analytics.js'

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
  const posthog = usePostHog()
  const roomId = room?.roomId ?? FALLBACK_ROOM_ID

  const conversationQuery = React.useMemo(() => getConversationByRoom$(roomId), [roomId])
  const conversationResult = useQuery(conversationQuery)
  const conversationQueryReady = conversationResult !== undefined
  const conversation = roomId === FALLBACK_ROOM_ID ? null : (conversationResult?.[0] ?? null)

  const provisioningStartRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!room || roomId === FALLBACK_ROOM_ID) return
    if (!conversationQueryReady) return
    if (conversation) return
    if (pendingConversationCreations.has(roomId)) return

    provisioningStartRef.current =
      typeof performance !== 'undefined' ? performance.now() : Date.now()

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

  React.useEffect(() => {
    if (!room) return
    if (!conversation) return
    if (provisioningStartRef.current === null) return

    const startedAt = provisioningStartRef.current
    provisioningStartRef.current = null
    const finishedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()

    posthog?.capture('room_chat_conversation_ready', {
      roomId: room.roomId,
      roomKind: room.roomKind,
      durationMs: Math.max(0, Math.round(finishedAt - startedAt)),
    })
  }, [conversation, posthog, room])

  return {
    conversation,
    isProvisioning: Boolean(room) && !conversation,
  }
}
