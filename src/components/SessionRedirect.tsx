import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrCreateSessionId } from '../util/session-id.js'

export const SessionRedirect: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const sessionId = getOrCreateSessionId()
    navigate(`/session/${sessionId}`, { replace: true })
  }, [navigate])

  return (
    <div className='flex items-center justify-center h-screen'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
        <p className='text-gray-600'>Starting your session...</p>
      </div>
    </div>
  )
}
