import React from 'react'
import { motion } from 'framer-motion'
import { PROJECT_MODAL_DURATION, EASE_SMOOTH } from '../life-map/animationTimings.js'
import { CHAT_WINDOW_WIDTH } from './chatConstants.js'

interface ChatWindowProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * ChatWindow - AI chat interface panel
 * Persistent panel positioned to the right of left rail, below navbar
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose }) => {
  return (
    <motion.div
      className='fixed z-[90] bg-white shadow-2xl flex flex-col pointer-events-auto'
      style={{
        top: '4rem', // Below navbar
        left: '4rem', // To the right of left rail
        bottom: '1rem',
        width: CHAT_WINDOW_WIDTH,
        fontFamily: 'Georgia, serif',
        backgroundColor: '#f5f1e8', // Same beige as LifeMap background
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{
        opacity: isOpen ? 1 : 0,
        x: isOpen ? 0 : -20,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
      transition={{ duration: PROJECT_MODAL_DURATION, ease: EASE_SMOOTH }}
    >
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-white/20'>
        <h2 className='text-lg font-semibold text-gray-900'>AI Chat</h2>
        <button
          onClick={onClose}
          className='w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors'
          aria-label='Close chat'
        >
          <svg
            className='w-5 h-5 text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      </div>

      {/* Chat Content */}
      <div className='flex-1 overflow-y-auto p-4'>
        <div className='text-sm text-gray-600'>
          <p className='mb-4'>Chat with your AI assistant...</p>
          {/* Placeholder for chat messages */}
        </div>
      </div>

      {/* Input Area */}
      <div className='p-4 border-t border-white/20'>
        <input
          type='text'
          placeholder='Type a message...'
          className='w-full px-3 py-2 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white/50'
          style={{
            fontFamily: 'Georgia, serif',
          }}
        />
      </div>
    </motion.div>
  )
}
