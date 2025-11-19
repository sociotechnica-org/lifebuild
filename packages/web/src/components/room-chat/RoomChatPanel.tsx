import React from 'react'
import type { ChatMessage, Conversation, Worker } from '@work-squared/shared/schema'
import { RoomChatInput } from './RoomChatInput.js'
import { RoomChatMessageList } from './RoomChatMessageList.js'

export type RoomChatPanelProps = {
  roomTitle: string
  worker?: Worker | null
  conversation?: Conversation | null
  messages: readonly ChatMessage[]
  isProcessing: boolean
  messageText: string
  onMessageTextChange: (value: string) => void
  onSendMessage: () => void
}

export const RoomChatPanel: React.FC<RoomChatPanelProps> = ({
  roomTitle,
  worker,
  conversation,
  messages,
  isProcessing,
  messageText,
  onMessageTextChange,
  onSendMessage,
}) => {
  const workerName = worker?.name ?? 'Assistant'
  const workerRole = worker?.roleDescription ?? 'AI Assistant'

  return (
    <div className='flex h-full flex-col gap-4 rounded border border-gray-200 bg-white p-4 text-sm'>
      <header className='space-y-1 border-b border-gray-200 pb-3'>
        <p className='text-xs uppercase tracking-wide text-gray-500'>Room</p>
        <h2 className='text-lg font-semibold text-gray-900'>{roomTitle}</h2>
        <p className='text-gray-600'>
          {workerName} · {workerRole}
        </p>
        {!conversation && <p className='text-xs text-gray-500'>Creating workspace conversation…</p>}
      </header>

      <section className='flex-1 overflow-y-auto'>
        <RoomChatMessageList
          messages={messages}
          workerName={workerName}
          isProcessing={isProcessing}
        />
      </section>

      <section>
        <RoomChatInput
          value={messageText}
          onChange={onMessageTextChange}
          onSend={onSendMessage}
          disabled={!conversation}
        />
      </section>
    </div>
  )
}
