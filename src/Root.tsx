import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { ProjectsPage } from './components/ProjectsPage.js'
import { ProjectWorkspace } from './components/ProjectWorkspace.js'
import { TasksPage } from './components/TasksPage.js'
import { Layout } from './components/Layout.js'
import { SessionRedirect } from './components/SessionRedirect.js'
import { SessionWrapper } from './components/SessionWrapper.js'
import { SessionAdminWrapper } from './components/SessionAdminWrapper.js'
import LiveStoreWorker from './livestore.worker?worker'
import { schema } from './livestore/schema.js'
import { makeTracer } from './otel.js'

const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: LiveStoreWorker,
  sharedWorker: LiveStoreSharedWorker,
})

const otelTracer = makeTracer('work-squared-main')

// Simple stable storeId - just like TodoMVC example
const getStableStoreId = (): string => {
  // Use sessionId if available in localStorage
  const sessionId = localStorage.getItem('sessionId')
  if (sessionId) {
    return sessionId
  }

  // Otherwise generate and store new one
  const newId = crypto.randomUUID()
  localStorage.setItem('sessionId', newId)
  return newId
}

// LiveStore wrapper - keep it simple
const LiveStoreWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use the same storeId for everything - no navigation-based changes
  const storeId = getStableStoreId()

  console.log(`Using stable storeId: ${storeId}`)

  return (
    <LiveStoreProvider
      schema={schema}
      renderLoading={_ => <div>Loading LiveStore ({_.stage})...</div>}
      adapter={adapter}
      batchUpdates={batchUpdates}
      storeId={storeId}
      otelOptions={{ tracer: otelTracer }}
      syncPayload={{ authToken: 'insecure-token-change-me' }}
    >
      {children}
    </LiveStoreProvider>
  )
}

export const App: React.FC = () => (
  <BrowserRouter>
    <LiveStoreWrapper>
      <Routes>
        {/* Session-based routes */}
        <Route path='/session/:sessionId' element={<SessionWrapper />} />
        <Route path='/session/:sessionId/admin' element={<SessionAdminWrapper />} />

        {/* Original routes */}
        <Route
          path='/projects'
          element={
            <Layout>
              <ProjectsPage />
            </Layout>
          }
        />
        <Route
          path='/project/:projectId'
          element={
            <Layout>
              <ProjectWorkspace />
            </Layout>
          }
        />
        <Route
          path='/tasks'
          element={
            <Layout>
              <TasksPage />
            </Layout>
          }
        />
        <Route path='/orphaned-tasks' element={<Navigate to='/tasks' replace />} />

        {/* Root redirect to session */}
        <Route path='/' element={<SessionRedirect />} />
      </Routes>
    </LiveStoreWrapper>
  </BrowserRouter>
)
