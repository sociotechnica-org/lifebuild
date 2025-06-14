import React from 'react'
import { ChatInterface } from './ChatInterface.js'
import { SnackbarProvider } from './Snackbar.js'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SnackbarProvider>
      <div className='flex h-screen'>
        {/* Main Content Area */}
        <div className='flex-1 overflow-auto'>{children}</div>

        {/* Chat Panel */}
        <ChatInterface />
      </div>
    </SnackbarProvider>
  )
}
