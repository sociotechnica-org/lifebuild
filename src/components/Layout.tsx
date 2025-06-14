import React from 'react'
import { ChatInterface } from './ChatInterface.js'
import { Snackbar } from './Snackbar.js'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className='flex h-screen'>
      {/* Main Content Area */}
      <div className='flex-1 overflow-auto'>{children}</div>

      {/* Chat Panel */}
      <ChatInterface />

      {/* Global Snackbar */}
      <Snackbar />
    </div>
  )
}
