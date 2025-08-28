import React from 'react'
import type { ChatMessage } from '@work-squared/shared/schema'
import { MarkdownRenderer } from '../../markdown/MarkdownRenderer.js'

interface MessageListProps {
  messages: readonly ChatMessage[]
  isProcessing: boolean
  conversationTitle?: string
}

interface MessageItemProps {
  message: ChatMessage
  onCopy: (text: string) => void
  onRetry?: (message: ChatMessage) => void
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onCopy, onRetry }) => {
  // Tool result notifications - render as special cards
  if (message.llmMetadata?.source === 'tool-result') {
    return (
      <div className='px-2'>
        <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
          <div className='flex items-start gap-2 text-green-700 text-sm font-medium mb-2'>
            <svg className='w-4 h-4 mt-0.5' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                clipRule='evenodd'
              />
            </svg>
            <div className='flex-1'>
              <div className='whitespace-pre-line text-sm text-green-800'>{message.message}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Status messages
  if (message.llmMetadata?.source === 'status') {
    return (
      <div className='p-3 rounded-lg bg-gray-50 mr-8 flex items-center gap-2 text-sm text-gray-600'>
        <svg className='w-4 h-4 animate-spin text-gray-400' viewBox='0 0 24 24'>
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
            fill='none'
          />
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
          />
        </svg>
        <span>{message.message}</span>
      </div>
    )
  }

  // Regular chat messages
  const shouldShowCopyButton =
    message.message && message.message.trim() && message.message !== 'No response generated'

  return (
    <div
      className={`p-3 rounded-lg ${
        message.role === 'user'
          ? 'bg-blue-50 ml-8'
          : message.role === 'assistant'
            ? 'bg-gray-50 mr-8'
            : 'bg-yellow-50'
      }`}
    >
      <div className='text-xs text-gray-500 mb-1 font-medium'>
        {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Assistant' : 'System'}
        {message.modelId && ` (${message.modelId})`}
      </div>

      {/* Tool call indicators */}
      {message.llmMetadata?.toolCalls && Array.isArray(message.llmMetadata.toolCalls) ? (
        <div className='mb-2'>
          {(message.llmMetadata.toolCalls as any[]).map((toolCall: any) => (
            <div key={toolCall.id} className='flex items-center gap-2 text-xs text-blue-600 mb-1'>
              <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
              </svg>
              <span>Tool: {toolCall.function?.name || 'Unknown'}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Message content */}
      {shouldShowCopyButton && (
        <>
          {message.role === 'assistant' ? (
            <MarkdownRenderer content={message.message} className='' />
          ) : (
            <div className='text-sm text-gray-900'>{message.message}</div>
          )}

          {/* Action buttons */}
          <div className='mt-2 flex justify-end gap-2'>
            <button
              onClick={() => onCopy(message.message as string)}
              className='flex items-center p-1 rounded text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer'
            >
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184'
                />
              </svg>
            </button>
            {message.llmMetadata?.source === 'error' && message.responseToMessageId && onRetry && (
              <button
                onClick={() => onRetry(message)}
                className='text-xs text-blue-600 hover:underline'
              >
                Retry
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const LoadingIndicator: React.FC = () => (
  <div className='p-3 rounded-lg bg-gray-50 mr-8 flex items-center gap-2 text-sm text-gray-600'>
    <svg className='w-4 h-4 animate-spin text-gray-400' viewBox='0 0 24 24'>
      <circle
        className='opacity-25'
        cx='12'
        cy='12'
        r='10'
        stroke='currentColor'
        strokeWidth='4'
        fill='none'
      />
      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z' />
    </svg>
    <span>Assistant is thinking...</span>
  </div>
)

const EmptyState: React.FC<{ title: string }> = ({ title }) => (
  <div className='text-center text-gray-500 py-8'>
    <p className='text-sm'>Conversation: {title}</p>
    <p className='text-xs mt-2'>Send a message to get started.</p>
  </div>
)

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isProcessing,
  conversationTitle,
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isProcessing])

  const handleCopy = React.useCallback((text: string) => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy message', err)
      })
    } else {
      console.error('Clipboard API not available')
    }
  }, [])

  // TODO: Implement retry functionality
  const handleRetry = React.useCallback((message: ChatMessage) => {
    console.log('Retry not yet implemented:', message)
  }, [])

  return (
    <div className='flex-1 overflow-y-auto p-4 min-h-0'>
      {messages.length > 0 ? (
        <div className='space-y-4'>
          {messages.map(message => (
            <MessageItem
              key={message.id}
              message={message}
              onCopy={handleCopy}
              onRetry={handleRetry}
            />
          ))}

          {/* Loading indicator */}
          {isProcessing && <LoadingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      ) : (
        <EmptyState title={conversationTitle || 'New Conversation'} />
      )}
    </div>
  )
}
