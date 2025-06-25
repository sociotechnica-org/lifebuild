import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

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
import { getOrCreateSessionId } from './util/session-id.js'

const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: LiveStoreWorker,
  sharedWorker: LiveStoreSharedWorker,
})

const otelTracer = makeTracer('work-squared-main')

// Compute storeId without side effects
const computeStoreId = (pathname: string, search: string): string => {
  if (typeof window === 'undefined') return 'unused'

  // For session-based routing, use the sessionId as the storeId
  const sessionMatch = pathname.match(/^\/session\/([^\/]+)/)
  if (sessionMatch && sessionMatch[1]) {
    return sessionMatch[1]
  }

  // If we're at the root path, use session ID from localStorage or generate new one
  if (pathname === '/') {
    return getOrCreateSessionId()
  }

  // For non-session routes, check for existing storeId in search params
  const searchParams = new URLSearchParams(search)
  const storeId = searchParams.get('storeId')
  if (storeId !== null) return storeId

  // Generate new storeId but don't modify location here - let React Router handle navigation
  return crypto.randomUUID()
}

// LiveStore wrapper that gets storeId reactively based on current route
const LiveStoreWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const [storeId, setStoreId] = React.useState<string>(() => {
    // Compute initial storeId without side effects
    return computeStoreId(location.pathname, location.search)
  })

  React.useEffect(() => {
    // Update storeId when location changes, but avoid side effects
    const newStoreId = computeStoreId(location.pathname, location.search)
    if (newStoreId !== storeId) {
      setStoreId(newStoreId)
    }
  }, [location.pathname, location.search, storeId])

  // Handle storeId URL updating for non-session routes (with side effects)
  React.useEffect(() => {
    // Only update URL for non-session, non-root routes that need storeId in URL
    if (location.pathname !== '/' && !location.pathname.startsWith('/session/')) {
      const searchParams = new URLSearchParams(location.search)
      if (!searchParams.has('storeId')) {
        searchParams.set('storeId', storeId)
        window.history.replaceState({}, '', `${location.pathname}?${searchParams.toString()}`)
      }
    }
  }, [storeId, location.pathname, location.search])

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
