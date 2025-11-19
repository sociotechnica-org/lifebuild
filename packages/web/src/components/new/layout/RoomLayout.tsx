import React from 'react'
import type { StaticRoomDefinition } from '@work-squared/shared/rooms'
import { NewUiShell } from './NewUiShell.js'
import { shouldEnableRoomChat } from '../../../constants/featureFlags.js'
import { RoomChatToggle } from '../../room-chat/RoomChatToggle.js'
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

  return [isOpen, setIsOpen] as const
}

export const RoomLayout: React.FC<RoomLayoutProps> = ({ room, children }) => {
  const posthog = usePostHog()
  const featureEnabled = shouldEnableRoomChat()
  const [isChatOpen, setIsChatOpen] = usePersistentChatToggle(room.roomId)
  const chat = useRoomChat(featureEnabled ? room : null)
  const previousOpenRef = React.useRef(isChatOpen)

  const showChatPanel = featureEnabled && isChatOpen

  React.useEffect(() => {
    if (!featureEnabled) return
    if (isChatOpen && !previousOpenRef.current) {
      posthog?.capture('room_chat_opened', {
        roomId: room.roomId,
        roomKind: room.roomKind,
      })
    }
    previousOpenRef.current = isChatOpen
  }, [featureEnabled, isChatOpen, posthog, room.roomId, room.roomKind])

  if (!featureEnabled) {
    return <NewUiShell>{children}</NewUiShell>
  }

  return (
    <NewUiShell>
      <div className='space-y-4 min-h-screen'>
        <div className='flex justify-end'>
          <RoomChatToggle isOpen={isChatOpen} onToggle={() => setIsChatOpen(open => !open)} />
        </div>

        <div className='flex items-start gap-6'>
          <div className='flex-1 min-w-0'>{children}</div>
          {showChatPanel && (
            <div className='sticky top-8 w-96 flex-shrink-0'>
              <div className='h-[calc(100vh-6rem)]'>
                <RoomChatPanel
                  worker={chat.worker}
                  conversation={chat.conversation}
                  messages={chat.messages}
                  isProcessing={chat.isProcessing}
                  messageText={chat.messageText}
                  onMessageTextChange={chat.setMessageText}
                  onSendMessage={chat.sendMessage}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </NewUiShell>
  )
}
