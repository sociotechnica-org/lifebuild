import React from 'react'
import type { ChatMessage, Conversation, Worker } from '@work-squared/shared/schema'
import { RoomChatInput } from './RoomChatInput.js'
import { RoomChatMessageList } from './RoomChatMessageList.js'

export type RoomChatPanelProps = {
  worker?: Worker | null
  conversation?: Conversation | null
  messages: readonly ChatMessage[]
  isProcessing: boolean
  messageText: string
  onMessageTextChange: (value: string) => void
  onSendMessage: () => void
  isReadOnly?: boolean
  statusMessage?: string | null
}

export const RoomChatPanel: React.FC<RoomChatPanelProps> = ({
  worker,
  conversation,
  messages,
  isProcessing,
  messageText,
  onMessageTextChange,
  onSendMessage,
  isReadOnly = false,
  statusMessage,
}) => {
  const workerName = worker?.name ?? 'Assistant'
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null)
  const isInputDisabled = isReadOnly || !conversation

  const scrollToBottom = React.useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const targetTop = container.scrollHeight
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      })
    } else {
      container.scrollTop = targetTop
    }
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [scrollToBottom, conversation?.id, messages.length])

  return (
    <div
      data-testid='room-chat-panel'
      className='flex h-full flex-col gap-4 overflow-hidden rounded border border-gray-200 bg-white p-4 text-sm'
    >
      <header className='border-b border-gray-200 pb-3'>
        <h2 className='text-lg font-semibold text-gray-900'>{workerName}</h2>
      </header>

      {!conversation && (
        <p className='text-xs font-medium uppercase tracking-wide text-gray-400'>Preparing chat…</p>
      )}

      <section ref={scrollContainerRef} className='flex-1 min-h-0 overflow-y-auto'>
        <RoomChatMessageList
          messages={messages}
          workerName={workerName}
          isProcessing={isProcessing}
        />
      </section>

      {statusMessage && (
        <p className='text-xs text-gray-500' data-testid='room-chat-status'>
          {statusMessage}
        </p>
      )}

      <section>
        <RoomChatInput
          value={messageText}
          onChange={onMessageTextChange}
          onSend={onSendMessage}
          disabled={isInputDisabled}
        />
      </section>
    </div>
  )
}
