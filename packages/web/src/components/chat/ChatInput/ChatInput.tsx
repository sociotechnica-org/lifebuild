import React from 'react'

interface ChatInputProps {
  messageText: string
  onMessageTextChange: (text: string) => void
  onSendMessage: (e: React.FormEvent) => void
  disabled?: boolean
  placeholder?: string
}

export const ChatInput: React.FC<ChatInputProps> = ({
  messageText,
  onMessageTextChange,
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px` // Max height of 120px
    }
  }, [messageText])

  // Reset textarea height when message is sent
  React.useEffect(() => {
    if (!messageText && textareaRef.current) {
      textareaRef.current.style.height = '80px'
    }
  }, [messageText])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSendMessage(e as any)
    }
  }

  const canSend = messageText.trim().length > 0 && !disabled

  return (
    <div className='border-t bg-white p-4'>
      <form onSubmit={onSendMessage} className='flex gap-3'>
        <textarea
          ref={textareaRef}
          value={messageText}
          onChange={e => onMessageTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className='flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
          style={{ minHeight: '80px', maxHeight: '120px' }}
          rows={1}
        />

        <button
          type='submit'
          disabled={!canSend}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            canSend
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Send
        </button>
      </form>

      {!disabled && (
        <p className='text-xs text-gray-500 mt-2'>Press Enter to send, Shift+Enter for new line</p>
      )}
    </div>
  )
}
