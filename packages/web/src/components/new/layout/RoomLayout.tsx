import React from 'react'
import type { StaticRoomDefinition } from '@work-squared/shared/rooms'
import { NewUiShell } from './NewUiShell.js'
import { RoomChatPanel } from '../../room-chat/RoomChatPanel.js'
import { useRoomChat } from '../../../hooks/useRoomChat.js'
import { usePostHog } from '../../../lib/analytics.js'

type RoomLayoutProps = {
  room: StaticRoomDefinition
  children: React.ReactNode
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

  React.useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return
      window.localStorage.setItem(storageKey, 'false')
    }
  }, [storageKey])

  return [isOpen, setIsOpen] as const
}

export const RoomLayout: React.FC<RoomLayoutProps> = ({ room, children }) => {
  const posthog = usePostHog()
  const [isChatOpen, setIsChatOpen] = usePersistentChatToggle(room.roomId)
  const chat = useRoomChat(room)
  const previousOpenRef = React.useRef(isChatOpen)
  const disabledReason = chat.isConversationArchived
    ? 'This chat is archived.'
    : chat.isWorkerInactive
      ? "This room's agent is inactive."
      : null

  React.useEffect(() => {
    if (isChatOpen && !previousOpenRef.current) {
      posthog?.capture('room_chat_opened', {
        roomId: room.roomId,
        roomKind: room.roomKind,
      })
    }
    previousOpenRef.current = isChatOpen
  }, [isChatOpen, posthog, room.roomId, room.roomKind])

  return (
    <NewUiShell isChatOpen={isChatOpen} onChatToggle={() => setIsChatOpen(open => !open)}>
      <div className='flex items-start gap-6'>
        <div className='flex-1 min-w-0'>{children}</div>
        {isChatOpen && (
          <div className='sticky top-4 w-96 flex-shrink-0'>
            <div className='h-[calc(100vh-10rem)]'>
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
          </div>
        )}
      </div>
    </NewUiShell>
  )
}
