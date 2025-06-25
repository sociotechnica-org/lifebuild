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

  // Use a ref to store storeId and prevent unnecessary LiveStore re-renders
  const storeIdRef = React.useRef<string>('')
  
  // Initialize storeId only once
  if (!storeIdRef.current) {
    const sessionMatch = location.pathname.match(/^\/session\/([^\/]+)/)
    if (sessionMatch && sessionMatch[1]) {
      storeIdRef.current = sessionMatch[1]
    } else if (location.pathname === '/') {
      storeIdRef.current = getOrCreateSessionId()
    } else {
      const searchParams = new URLSearchParams(location.search)
      const urlStoreId = searchParams.get('storeId')
      if (urlStoreId) {
        storeIdRef.current = urlStoreId
      } else {
        const sessionId = localStorage.getItem('sessionId')
        storeIdRef.current = sessionId || crypto.randomUUID()
      }
    }
    console.log(`Initial storeId: ${storeIdRef.current} for ${location.pathname}`)
  }

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

    // Only update ref if storeId actually needs to change
    if (newStoreId && newStoreId !== storeIdRef.current) {
      console.log(`StoreId changing: ${storeIdRef.current} -> ${newStoreId} for ${location.pathname}`)
      storeIdRef.current = newStoreId
      // Force re-render since we changed the ref
      setForceRender(prev => prev + 1)
    } else {
      console.log(`StoreId staying: ${storeIdRef.current} for ${location.pathname}`)
    }
  }, [location.pathname, location.search])
  
  // Use a counter to force re-renders only when storeId actually changes
  const [forceRender, setForceRender] = React.useState(0)

  // TEMPORARILY DISABLED: Add storeId to URL for non-session routes that don't have it
  // This might be causing LiveStore to reload unnecessarily
  // React.useEffect(() => {
  //   if (location.pathname !== '/' && !location.pathname.startsWith('/session/')) {
  //     const searchParams = new URLSearchParams(location.search)
  //     if (!searchParams.has('storeId')) {
  //       console.log(`Adding storeId ${storeId} to URL for ${location.pathname}`)
  //       searchParams.set('storeId', storeId)
  //       const newUrl = `${location.pathname}?${searchParams.toString()}`
  //       window.history.replaceState({}, '', newUrl)
  //     }
  //   }
  // }, [location.pathname])

  return (
    <LiveStoreProvider
      schema={schema}
      renderLoading={_ => <div>Loading LiveStore ({_.stage})...</div>}
      adapter={adapter}
      batchUpdates={batchUpdates}
      storeId={storeIdRef.current}
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
