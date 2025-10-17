import React, { useEffect, useState } from 'react'
import { ChatInterface } from '../chat/ChatInterface/ChatInterface.js'
import { Navigation } from './Navigation.js'
import { SnackbarProvider } from '../ui/Snackbar/Snackbar.js'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const getIsDesktop = () => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.matchMedia('(min-width: 1024px)').matches
  }

  const [isChatOpen, setIsChatOpen] = useState<boolean>(getIsDesktop)
  const [isDesktop, setIsDesktop] = useState<boolean>(getIsDesktop)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(min-width: 1024px)')

    const updateLayout = (matches: boolean) => {
      setIsDesktop(matches)
      setIsChatOpen(matches)
    }

    updateLayout(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      updateLayout(event.matches)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    // Fallback for Safari
    const legacyListener = (event: MediaQueryListEvent) => {
      handleChange(event)
    }

    mediaQuery.addListener(legacyListener)
    return () => mediaQuery.removeListener(legacyListener)
  }, [])

  return (
    <SnackbarProvider>
      <div className='flex flex-col h-screen'>
        {/* Top Navigation */}
        <Navigation />

        <div className='flex flex-1 overflow-hidden relative'>
          {/* Main Content Area */}
          <div className='relative flex-1 overflow-auto'>
            {children}

            {!isChatOpen && (
              <button
                type='button'
                onClick={() => setIsChatOpen(true)}
                className='fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 lg:absolute lg:bottom-auto lg:top-4 lg:right-4'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='h-5 w-5'
                >
                  <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
                </svg>
                Open chat
              </button>
            )}
          </div>

          {/* Chat Panel - Fixed width */}
          {isDesktop && isChatOpen && (
            <div className='hidden w-96 flex-shrink-0 lg:flex'>
              <ChatInterface onClose={() => setIsChatOpen(false)} />
            </div>
          )}
        </div>

        {isChatOpen && !isDesktop && (
          <div className='lg:hidden fixed inset-0 z-40 flex'>
            <button
              type='button'
              className='absolute inset-0 bg-black/40'
              onClick={() => setIsChatOpen(false)}
              aria-label='Close chat overlay'
            />
            <div className='relative ml-auto flex h-full w-full max-w-md bg-white shadow-xl'>
              <ChatInterface onClose={() => setIsChatOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </SnackbarProvider>
  )
}
