import React from 'react'
import { ChatInterface } from './ChatInterface.js'
import { SnackbarProvider } from './Snackbar.js'

export const ChatOnlyLayout: React.FC = () => {
  return (
    <SnackbarProvider>
      <div className='flex h-screen bg-gray-50'>
        {/* Chat Interface takes full screen - no navigation or sidebars */}
        <div className='flex-1 flex justify-center items-center'>
          <div className='w-full max-w-4xl h-full'>
            <ChatInterface />
          </div>
        </div>
      </div>
    </SnackbarProvider>
  )
}
