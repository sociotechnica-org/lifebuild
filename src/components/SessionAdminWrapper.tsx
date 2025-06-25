import React from 'react'
import { useParams } from 'react-router-dom'
import { SessionProvider } from '../contexts/SessionContext.js'
import { Layout } from './Layout.js'
import { ProjectsPage } from './ProjectsPage.js'

export const SessionAdminWrapper: React.FC = () => {
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
      <Layout>
        <div className='p-4'>
          <div className='mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
            <h2 className='text-lg font-semibold text-yellow-800 mb-2'>Session Admin View</h2>
            <p className='text-sm text-yellow-700'>
              Session ID: <code className='bg-yellow-100 px-2 py-1 rounded'>{sessionId}</code>
            </p>
            <p className='text-xs text-yellow-600 mt-2'>
              This admin interface shows the full WorkSquared features for this session.
            </p>
          </div>
          <ProjectsPage />
        </div>
      </Layout>
    </SessionProvider>
  )
}
