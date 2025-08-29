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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px` // Max height of 200px
    }
  }, [messageText])

  // Reset textarea height when message is sent
  React.useEffect(() => {
    if (!messageText && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
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
    <div className='border-t border-gray-200 bg-white'>
      <form onSubmit={onSendMessage} className='relative'>
        <textarea
          ref={textareaRef}
          value={messageText}
          onChange={e => onMessageTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className='w-full resize-none border-0 px-6 py-5 pr-16 text-base focus:outline-none focus:ring-0 disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-400'
          style={{ minHeight: '80px', maxHeight: '200px' }}
          rows={1}
        />

        <button
          type='submit'
          disabled={!canSend}
          className={`absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            canSend
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          aria-label='Send message'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='w-5 h-5'
          >
            <line x1='22' y1='2' x2='11' y2='13'></line>
            <polygon points='22 2 15 22 11 13 2 9 22 2'></polygon>
          </svg>
        </button>
      </form>
    </div>
  )
}
