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

// LiveStore wrapper that gets storeId reactively based on current route
const LiveStoreWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()

  // Use state to maintain stable storeId across navigations
  const [storeId, setStoreId] = React.useState<string>(() => {
    // Initial storeId computation
    const sessionMatch = location.pathname.match(/^\/session\/([^\/]+)/)
    if (sessionMatch && sessionMatch[1]) {
      return sessionMatch[1]
    }
    if (location.pathname === '/') {
      return getOrCreateSessionId()
    }
    const searchParams = new URLSearchParams(location.search)
    const urlStoreId = searchParams.get('storeId')
    if (urlStoreId) {
      return urlStoreId
    }
    const sessionId = localStorage.getItem('sessionId')
    if (sessionId) {
      return sessionId
    }
    return crypto.randomUUID()
  })

  // Only update storeId when we actually need to change it
  React.useEffect(() => {
    let newStoreId: string | null = null

    // For session routes, use sessionId
    const sessionMatch = location.pathname.match(/^\/session\/([^\/]+)/)
    if (sessionMatch && sessionMatch[1]) {
      newStoreId = sessionMatch[1]
    }
    // For root path, use session from localStorage
    else if (location.pathname === '/') {
      newStoreId = getOrCreateSessionId()
    }
    // For other routes, check URL params
    else {
      const searchParams = new URLSearchParams(location.search)
      const urlStoreId = searchParams.get('storeId')
      if (urlStoreId) {
        newStoreId = urlStoreId
      }
      // If no storeId in URL, keep current one (don't change)
    }

    // Only update state if storeId actually needs to change
    if (newStoreId && newStoreId !== storeId) {
      console.log(`StoreId changing: ${storeId} -> ${newStoreId} for ${location.pathname}`)
      setStoreId(newStoreId)
    }
  }, [location.pathname, location.search, storeId])

  // Add storeId to URL for non-session routes that don't have it
  React.useEffect(() => {
    if (location.pathname !== '/' && !location.pathname.startsWith('/session/')) {
      const searchParams = new URLSearchParams(location.search)
      if (!searchParams.has('storeId')) {
        searchParams.set('storeId', storeId)
        const newUrl = `${location.pathname}?${searchParams.toString()}`
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [location.pathname]) // Only depend on pathname, not search or storeId to avoid loops

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
