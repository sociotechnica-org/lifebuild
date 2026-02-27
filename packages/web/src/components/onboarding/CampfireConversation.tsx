import { CAMPFIRE_ROOM } from '@lifebuild/shared/rooms'
import React from 'react'
import { useRoomChat } from '../../hooks/useRoomChat.js'
import { RoomChatPanel } from '../room-chat/RoomChatPanel.js'
import { CAMPFIRE_BOOTSTRAP_MESSAGE } from '../room-chat/internalMessages.js'

type CampfireConversationProps = {
  onKeepExploring: () => void
}

export const CampfireConversation: React.FC<CampfireConversationProps> = ({ onKeepExploring }) => {
  const chat = useRoomChat(CAMPFIRE_ROOM)
  const bootstrapSentRef = React.useRef(false)

  React.useEffect(() => {
    if (bootstrapSentRef.current) {
      return
    }

    const wasSent = chat.sendInternalMessage(CAMPFIRE_BOOTSTRAP_MESSAGE)
    if (!wasSent) {
      return
    }

    bootstrapSentRef.current = true
  }, [chat.sendInternalMessage])

  const statusMessage = chat.isConversationArchived
    ? 'This campfire conversation is archived.'
    : chat.isWorkerInactive
      ? 'Jarvis is currently unavailable.'
      : null

  return (
    <section
      className='pointer-events-none absolute inset-x-0 bottom-4 z-[22] flex justify-center px-4 md:inset-y-4 md:left-[4.75rem] md:right-auto md:bottom-auto md:justify-start md:px-0'
      data-testid='onboarding-campfire-panel'
    >
      <div className='pointer-events-auto h-[min(70vh,560px)] w-full max-w-xl md:h-full md:w-96 md:max-w-[calc(100vw-5.5rem)]'>
        <div className='relative h-full'>
          <button
            type='button'
            onClick={onKeepExploring}
            className='absolute left-3 top-3 z-[2] rounded-md border border-[#d8cab3] bg-[#fff8ec] px-2 py-1 text-xs font-semibold text-[#5f4a36] transition-colors hover:bg-white'
            data-testid='onboarding-campfire-keep-exploring'
          >
            Keep exploring for now
          </button>

          <RoomChatPanel
            worker={chat.worker}
            conversation={chat.conversation}
            messages={chat.messages}
            isProcessing={chat.isProcessing}
            messageText={chat.messageText}
            onMessageTextChange={chat.setMessageText}
            onSendMessage={chat.sendMessage}
            isReadOnly={chat.isConversationArchived || chat.isWorkerInactive}
            statusMessage={statusMessage}
          />
        </div>
      </div>
    </section>
  )
}
