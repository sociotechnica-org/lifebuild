import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import React, { useMemo } from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'

import { ProjectsPage } from './components/ProjectsPage.js'
import { ProjectWorkspace } from './components/ProjectWorkspace.js'
import { TasksPage } from './components/TasksPage.js'
import { Layout } from './components/Layout.js'
import { ChatOnlyLayout } from './components/ChatOnlyLayout.js'
import { EnsureStoreId } from './components/EnsureStoreId.js'
import LiveStoreWorker from './livestore.worker?worker'
import { schema } from './livestore/schema.js'
import { makeTracer } from './otel.js'

const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: LiveStoreWorker,
  sharedWorker: LiveStoreSharedWorker,
})

const otelTracer = makeTracer('work-squared-main')


// LiveStore wrapper - simply gets storeId from URL
const LiveStoreWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  
  // Get storeId from URL query params (EnsureStoreId guarantees it exists)
  const storeId = useMemo(() => {
    if (typeof window === 'undefined') return 'unused'
    
    const urlParams = new URLSearchParams(location.search)
    const urlStoreId = urlParams.get('storeId')
    
    // Should always exist due to EnsureStoreId, but fallback to avoid crashes
    return urlStoreId || 'fallback-' + Math.random().toString(36).substring(7)
  }, [location.search])

  console.log(`LiveStore using storeId: ${storeId}`)

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
      <EnsureStoreId>
        <Routes>
          {/* Chat-first route */}
          <Route path='/' element={<ChatOnlyLayout />} />

          {/* Admin routes */}
          <Route
            path='/admin'
            element={
              <Layout>
                <ProjectsPage />
              </Layout>
            }
          />
          <Route
            path='/admin/projects'
            element={
              <Layout>
                <ProjectsPage />
              </Layout>
            }
          />
          <Route
            path='/admin/tasks'
            element={
              <Layout>
                <TasksPage />
              </Layout>
            }
          />
          <Route
            path='/admin/project/:projectId'
            element={
              <Layout>
                <ProjectWorkspace />
              </Layout>
            }
          />
        </Routes>
      </EnsureStoreId>
    </LiveStoreWrapper>
  </BrowserRouter>
)
