import React from 'react'

/**
 * LeftRail - Fixed left sidebar for chat avatars
 * Visible across all views (LifeMap, categories, projects)
 */
export const LeftRail: React.FC = () => {
  return (
    <div className='absolute top-0 left-0 bottom-0 z-[100] pointer-events-none'>
      <aside className='flex flex-col items-center pt-20 px-3 pointer-events-auto'>
        {/* Chat avatars */}
        <div className='flex flex-col gap-3'>
          {/* Test avatar */}
          <button
            className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg hover:scale-110 transition-transform shadow-lg'
            aria-label='Chat with AI agent'
          >
            AI
          </button>
        </div>
      </aside>
    </div>
  )
}
