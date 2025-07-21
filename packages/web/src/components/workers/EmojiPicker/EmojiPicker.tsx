import React, { useState } from 'react'

const ROBOT_EMOJIS = [
  '🤖',
  '🛸',
  '👾',
  '🚀',
  '⚡',
  '🔧',
  '⚙️',
  '🔩',
  '🔌',
  '💻',
  '📡',
  '🎯',
  '🔬',
  '🧪',
  '⚗️',
  '🔭',
  '📱',
  '⌚',
  '🖥️',
  '🎮',
] as const

interface EmojiPickerProps {
  value?: string
  onChange: (emoji: string) => void
  className?: string
  id?: string
}

export function EmojiPicker({ value, onChange, className = '', id }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleEmojiSelect = (emoji: string) => {
    onChange(emoji)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type='button'
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className='w-full px-3 py-2 border border-gray-300 rounded-md text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
      >
        <span className='text-lg'>{value || '🤖'}</span>
        <span className='ml-2 text-sm text-gray-500'>Click to change</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className='fixed inset-0 z-[60]' onClick={() => setIsOpen(false)} />

          {/* Emoji grid */}
          <div className='absolute z-[70] mt-1 p-3 bg-white border border-gray-300 rounded-md shadow-lg grid grid-cols-5 gap-2 w-64'>
            {ROBOT_EMOJIS.map(emoji => (
              <button
                key={emoji}
                type='button'
                onClick={() => handleEmojiSelect(emoji)}
                className={`p-2 text-lg rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  value === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
