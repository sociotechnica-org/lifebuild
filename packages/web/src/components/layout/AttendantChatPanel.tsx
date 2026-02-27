import React from 'react'
import { RoomChatPanel } from '../room-chat/RoomChatPanel.js'
import { useAttendantRail } from './AttendantRailProvider.js'

export const AttendantChatPanel: React.FC = () => {
  const { activeAttendantId, attendants, closeAttendant } = useAttendantRail()

  if (!activeAttendantId) {
    return null
  }

  const activeAttendant = attendants[activeAttendantId]
  const chat = activeAttendant.chat

  const statusMessage = chat.isConversationArchived
    ? 'This chat is archived.'
    : chat.isWorkerInactive
      ? 'This attendant is currently unavailable.'
      : null

  return (
    <div
      className='fixed left-[4.75rem] top-[86px] bottom-4 z-[120] w-96 max-w-[calc(100vw-5.5rem)]'
      data-testid='attendant-chat-panel'
    >
      <div className='relative h-full'>
        <button
          type='button'
          onClick={closeAttendant}
          className='absolute right-3 top-3 z-[2] rounded-md border border-[#d8cab3] bg-[#fff8ec] px-2 py-1 text-xs font-semibold text-[#5f4a36] transition-colors hover:bg-white'
          aria-label='Close attendant chat'
          data-testid='attendant-chat-close'
        >
          Close
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
  )
}
