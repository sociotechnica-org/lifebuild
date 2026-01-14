import React from 'react'
import type { ChatMessage, Conversation, Worker } from '@lifebuild/shared/schema'
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

const ScrollToBottomButton: React.FC<{ onClick: () => void; visible: boolean }> = ({
  onClick,
  visible,
}) => {
  if (!visible) return null

  return (
    <button
      onClick={onClick}
      className='absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-orange-100 hover:bg-orange-200 rounded-lg flex items-center justify-center shadow-md transition-all duration-150 border border-orange-200'
      aria-label='Scroll to bottom'
    >
      <svg
        className='w-4 h-4 text-orange-600'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M19 14l-7 7m0 0l-7-7m7 7V3'
        />
      </svg>
    </button>
  )
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
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null)
  const isInputDisabled = isReadOnly || !conversation

  // Track scroll state
  const [showScrollButton, setShowScrollButton] = React.useState(false)
  const hasInitialScrolledRef = React.useRef(false)
  const prevConversationIdRef = React.useRef<string | null | undefined>(conversation?.id)
  const prevMessagesLengthRef = React.useRef(messages.length)

  const SCROLL_THRESHOLD = 100

  // Check if user is near the bottom
  const checkIfNearBottom = React.useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return true
    const { scrollTop, scrollHeight, clientHeight } = container
    return scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD
  }, [])

  // Handle scroll events
  const handleScroll = React.useCallback(() => {
    setShowScrollButton(!checkIfNearBottom())
  }, [checkIfNearBottom])

  // Instant scroll to bottom
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
    setShowScrollButton(false)
  }, [])

  // Scroll to bottom on initial load (when messages exist)
  // Use requestAnimationFrame to ensure DOM has updated before scrolling
  React.useEffect(() => {
    if (!hasInitialScrolledRef.current && messages.length > 0) {
      hasInitialScrolledRef.current = true
      // Wait for DOM to update before scrolling
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }, [messages.length, scrollToBottom])

  // Scroll on conversation change
  React.useEffect(() => {
    if (conversation?.id !== prevConversationIdRef.current) {
      prevConversationIdRef.current = conversation?.id
      scrollToBottom()
    }
  }, [conversation?.id, scrollToBottom])

  // Auto-scroll when new messages arrive (if near bottom)
  React.useEffect(() => {
    const hadNewMessages = messages.length > prevMessagesLengthRef.current
    prevMessagesLengthRef.current = messages.length

    if (hadNewMessages && checkIfNearBottom()) {
      // Wait for DOM to update before scrolling
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
    // Update button visibility after content changes
    requestAnimationFrame(() => {
      setShowScrollButton(!checkIfNearBottom())
    })
  }, [messages.length, isProcessing, checkIfNearBottom, scrollToBottom])

  return (
    <div
      data-testid='room-chat-panel'
      className='flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 text-sm'
    >
      <header className='border-b border-gray-200 pb-3'>
        <h2 className='text-lg font-semibold text-gray-900'>{workerName}</h2>
      </header>

      {!conversation && (
        <p className='text-xs font-medium uppercase tracking-wide text-gray-400'>Preparing chat…</p>
      )}

      <section className='relative flex-1 min-h-0'>
        <div ref={scrollContainerRef} className='h-full overflow-y-auto' onScroll={handleScroll}>
          <RoomChatMessageList
            messages={messages}
            workerName={workerName}
            isProcessing={isProcessing}
          />
          <div ref={messagesEndRef} />
        </div>
        <ScrollToBottomButton onClick={scrollToBottom} visible={showScrollButton} />
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
