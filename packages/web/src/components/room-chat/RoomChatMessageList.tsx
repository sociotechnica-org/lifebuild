import React from 'react'
import type { ChatMessage } from '@work-squared/shared/schema'
import { MarkdownRenderer } from '../markdown/MarkdownRenderer.js'

export type RoomChatMessageListProps = {
  messages: readonly ChatMessage[]
  workerName?: string
  isProcessing: boolean
}

export const RoomChatMessageList: React.FC<RoomChatMessageListProps> = ({
  messages,
  workerName = 'Assistant',
  isProcessing,
}) => {
  if (messages.length === 0 && !isProcessing) {
    return <p className='text-sm text-gray-500'>Start a conversation to see messages here.</p>
  }

  return (
    <div className='space-y-3'>
      {messages.map(message => (
        <div
          key={message.id}
          className={`rounded border px-3 py-2 text-sm ${
            message.role === 'user' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
          }`}
        >
          <div className='mb-1 text-xs font-semibold text-gray-500'>
            {message.role === 'user' ? 'You' : workerName}
          </div>
          <div className='text-gray-800'>
            {message.role === 'assistant' ? (
              <MarkdownRenderer
                content={message.message}
                className='prose prose-sm max-w-none text-gray-800'
              />
            ) : (
              <div className='whitespace-pre-wrap'>{message.message}</div>
            )}
          </div>
        </div>
      ))}

      {isProcessing && (
        <div className='rounded border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500'>
          {workerName} is thinking…
        </div>
      )}
    </div>
  )
}
