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
  const isNearBottomRef = React.useRef(true) // Track if user is near bottom (updated on scroll)
  const prevConversationIdRef = React.useRef<string | null | undefined>(undefined) // Start undefined to detect first load
  const prevMessagesLengthRef = React.useRef(0) // Start at 0 to detect initial messages
  const prevIsProcessingRef = React.useRef(false) // Track processing state changes

  const SCROLL_THRESHOLD = 100

  // Check if user is near the bottom
  const checkIfNearBottom = React.useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return true
    const { scrollTop, scrollHeight, clientHeight } = container
    return scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD
  }, [])

  // Handle scroll events - track position BEFORE new content arrives
  const handleScroll = React.useCallback(() => {
    const nearBottom = checkIfNearBottom()
    isNearBottomRef.current = nearBottom
    setShowScrollButton(!nearBottom)
  }, [checkIfNearBottom])

  // Smooth scroll to bottom
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollButton(false)
    isNearBottomRef.current = true // Reset state so next message can auto-scroll
  }, [])

  // Scroll on conversation change
  React.useEffect(() => {
    if (conversation?.id !== prevConversationIdRef.current) {
      prevConversationIdRef.current = conversation?.id
      // Double RAF to ensure DOM has fully updated after conversation change
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom()
        })
      })
    }
  }, [conversation?.id, scrollToBottom])

  // Auto-scroll when new messages arrive or "thinking" indicator appears
  React.useEffect(() => {
    const wasEmpty = prevMessagesLengthRef.current === 0
    const hadNewMessages = messages.length > prevMessagesLengthRef.current
    const processingJustStarted = isProcessing && !prevIsProcessingRef.current
    // Capture the near-bottom state BEFORE updating the refs
    const wasNearBottom = isNearBottomRef.current

    // Check if last message is from the user (they just sent it)
    const lastMessage = messages[messages.length - 1]
    const isUserMessage = hadNewMessages && lastMessage?.role === 'user'

    // Update refs
    prevMessagesLengthRef.current = messages.length
    prevIsProcessingRef.current = isProcessing

    // Always scroll on initial load (was empty, now has messages)
    // Always scroll for user's own messages (they just sent it)
    // Or scroll if user WAS near bottom when assistant messages arrive
    // Or scroll when "thinking" indicator appears (if user was near bottom)
    const shouldScroll =
      (wasEmpty && messages.length > 0) ||
      isUserMessage ||
      (hadNewMessages && wasNearBottom) ||
      (processingJustStarted && wasNearBottom)

    if (shouldScroll) {
      // Double RAF to ensure DOM has fully updated with new content
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom()
        })
      })
    }

    // Update button visibility after content changes
    requestAnimationFrame(() => {
      const nearBottom = checkIfNearBottom()
      isNearBottomRef.current = nearBottom
      setShowScrollButton(!nearBottom)
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
