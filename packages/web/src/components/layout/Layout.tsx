import React from 'react'
import { ChatPresenter } from '../chat/ChatPresenter/ChatPresenter.js'
import { Navigation } from './Navigation.js'
import { SnackbarProvider } from '../ui/Snackbar/Snackbar.js'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SnackbarProvider>
      <div className='flex flex-col h-screen'>
        {/* Top Navigation */}
        <Navigation />

        <div className='flex flex-1 overflow-hidden'>
          {/* Main Content Area */}
          <div className='flex-1 overflow-auto'>{children}</div>

          {/* Chat Panel - Fixed width */}
          <div className='w-96 flex-shrink-0'>
            <ChatPresenter />
          </div>
        </div>
      </div>
    </SnackbarProvider>
  )
}
