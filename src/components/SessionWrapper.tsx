import React from 'react'
import { useParams } from 'react-router-dom'
import { SessionProvider } from '../contexts/SessionContext.js'
import { ChatOnlyLayout } from './ChatOnlyLayout.js'

export const SessionWrapper: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>()

  if (!sessionId) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center text-red-600'>
          <p>Invalid session URL</p>
        </div>
      </div>
    )
  }

  return (
    <SessionProvider sessionId={sessionId}>
      <ChatOnlyLayout />
    </SessionProvider>
  )
}
