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
        <Navigation isChatOpen={isChatOpen} onChatToggle={() => setIsChatOpen(!isChatOpen)} />

        <div className='flex flex-1 overflow-hidden relative'>
          {/* Main Content Area */}
          <div className='relative flex-1 overflow-auto'>{children}</div>

          {/* Chat Panel - Fixed width */}
          {isDesktop && isChatOpen && (
            <div className='w-96'>
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
            <div className='relative ml-auto h-full w-full bg-white shadow-xl'>
              <ChatInterface onClose={() => setIsChatOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </SnackbarProvider>
  )
}
