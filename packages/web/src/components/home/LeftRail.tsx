import React from 'react'

interface LeftRailProps {
  onChatToggle: () => void
}

/**
 * LeftRail - Fixed left sidebar for chat avatars
 * Visible across all views (LifeMap, categories, projects)
 */
export const LeftRail: React.FC<LeftRailProps> = ({ onChatToggle }) => {
  return (
    <div className='absolute top-0 left-0 bottom-0 z-[100] pointer-events-none'>
      <aside className='flex flex-col items-center pt-20 px-3 pointer-events-auto'>
        {/* Chat avatars */}
        <div className='flex flex-col gap-3'>
          {/* Test avatar */}
          <button
            onClick={onChatToggle}
            className='w-10 h-10 rounded-full flex items-center justify-center text-gray-800 font-semibold text-lg hover:scale-110 transition-transform shadow-lg relative overflow-hidden'
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.03) 3px),
                repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.03) 3px),
                linear-gradient(to bottom right, rgb(245, 241, 232), rgb(160, 133, 111))
              `,
            }}
            aria-label='Chat with AI agent'
          >
            <span className='relative z-10'>AI</span>
          </button>
        </div>
      </aside>
    </div>
  )
}
