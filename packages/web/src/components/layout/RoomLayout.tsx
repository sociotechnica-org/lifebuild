import React, { createContext, useContext, useCallback } from 'react'
import type { StaticRoomDefinition } from '@lifebuild/shared/rooms'
import { NewUiShell } from './NewUiShell.js'
import { RoomChatPanel } from '../room-chat/RoomChatPanel.js'
import { useRoomChat } from '../../hooks/useRoomChat.js'
import { usePostHog } from '../../lib/analytics.js'

type RoomLayoutProps = {
  room: StaticRoomDefinition
  children: React.ReactNode
  /** When true, disables scrolling on main content (children handle their own scrolling) */
  noScroll?: boolean
}

// Context for child components to control the chat
type RoomChatContextValue = {
  openChat: () => void
  isChatOpen: boolean
  conversationId: string | null
  sendDirectMessage: (message: string) => boolean
}

const RoomChatContext = createContext<RoomChatContextValue | null>(null)

export const useRoomChatControl = () => {
  const context = useContext(RoomChatContext)
  if (!context) {
    throw new Error('useRoomChatControl must be used within a RoomLayout')
  }
  return context
}

const usePersistentChatToggle = (roomId: string) => {
  const storageKey = React.useMemo(() => `room-chat:${roomId}:open`, [roomId])
  const [isOpen, setIsOpen] = React.useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(storageKey) === 'true'
  })

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, String(isOpen))
  }, [storageKey, isOpen])

  // Note: We intentionally don't reset to 'false' on unmount
  // so that chat state persists across page transitions within the same room

  return [isOpen, setIsOpen] as const
}

export const RoomLayout: React.FC<RoomLayoutProps> = ({ room, children, noScroll = false }) => {
  const posthog = usePostHog()
  const [isChatOpen, setIsChatOpen] = usePersistentChatToggle(room.roomId)
  const chat = useRoomChat(room)
  const isLifeMapRoom = room.roomId === 'life-map'
  const previousOpenRef = React.useRef(isChatOpen)
  const previousRoomIdRef = React.useRef(room.roomId)
  const disabledReason = chat.isConversationArchived
    ? 'This chat is archived.'
    : chat.isWorkerInactive
      ? "This room's agent is inactive."
      : null

  React.useEffect(() => {
    // Reset tracking state when navigating to a different room
    if (previousRoomIdRef.current !== room.roomId) {
      previousOpenRef.current = isChatOpen
      previousRoomIdRef.current = room.roomId
      return
    }

    if (isChatOpen && !previousOpenRef.current) {
      posthog?.capture('room_chat_opened', {
        roomId: room.roomId,
        roomKind: room.roomKind,
      })
    }
    if (!isChatOpen && previousOpenRef.current) {
      posthog?.capture('room_chat_closed', {
        roomId: room.roomId,
        roomKind: room.roomKind,
      })
    }
    previousOpenRef.current = isChatOpen
  }, [isChatOpen, posthog, room.roomId, room.roomKind])

  const openChat = useCallback(() => {
    setIsChatOpen(true)
  }, [setIsChatOpen])

  const chatContextValue: RoomChatContextValue = {
    openChat,
    isChatOpen,
    conversationId: chat.conversation?.id ?? null,
    sendDirectMessage: chat.sendDirectMessage,
  }
  const contentContainerClasses = isLifeMapRoom
    ? 'h-full flex'
    : `h-full flex gap-4 ${isChatOpen ? 'mr-[25rem]' : ''}`

  return (
    <RoomChatContext.Provider value={chatContextValue}>
      <NewUiShell
        isChatOpen={isChatOpen}
        onChatToggle={() => setIsChatOpen(open => !open)}
        fullHeight
        noScroll={noScroll || isLifeMapRoom}
        fullBleed={isLifeMapRoom}
      >
        <div className={contentContainerClasses}>
          <div className='h-full flex-1 min-w-0'>{children}</div>
        </div>
        {isChatOpen && (
          <div className='fixed right-4 top-[86px] bottom-[156px] w-96'>
            <RoomChatPanel
              worker={chat.worker}
              conversation={chat.conversation}
              messages={chat.messages}
              isProcessing={chat.isProcessing}
              messageText={chat.messageText}
              onMessageTextChange={chat.setMessageText}
              onSendMessage={chat.sendMessage}
              isReadOnly={chat.isConversationArchived || chat.isWorkerInactive}
              statusMessage={disabledReason}
            />
          </div>
        )}
      </NewUiShell>
    </RoomChatContext.Provider>
  )
}
