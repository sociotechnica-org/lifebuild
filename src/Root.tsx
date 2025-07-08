import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import React, { useMemo } from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { ProjectsPage } from './components/ProjectsPage.js'
import { ProjectWorkspace } from './components/ProjectWorkspace.js'
import { TasksPage } from './components/TasksPage.js'
import { WorkersPage } from './components/WorkersPage.js'
import { DocumentsPage } from './components/DocumentsPage.js'
import { DocumentPage } from './components/DocumentPage.js'
import { Layout } from './components/Layout.js'
import { EnsureStoreId } from './components/EnsureStoreId.js'
import LiveStoreWorker from './livestore.worker?worker'
import { schema } from './livestore/schema.js'
import { makeTracer } from './otel.js'
import { ROUTES } from './constants/routes.js'

const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: LiveStoreWorker,
  sharedWorker: LiveStoreSharedWorker,
})

const otelTracer = makeTracer('work-squared-main')

// LiveStore wrapper - stable storeId that respects URL overrides on mount
const LiveStoreWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Determine storeId once on mount - prioritize URL over localStorage
  const storeId = useMemo(() => {
    if (typeof window === 'undefined') return 'unused'

    // Check URL first (using window.location for initial mount)
    const urlParams = new URLSearchParams(window.location.search)
    const urlStoreId = urlParams.get('storeId')

    if (urlStoreId) {
      // URL has storeId - use it and sync to localStorage
      localStorage.setItem('storeId', urlStoreId)
      return urlStoreId
    }

    // No URL storeId - fall back to localStorage
    let storedId = localStorage.getItem('storeId')
    if (!storedId) {
      // No localStorage either - create new one
      storedId = crypto.randomUUID()
      localStorage.setItem('storeId', storedId)
    }
    return storedId
  }, []) // Empty deps - calculated once on mount, stable during navigation

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
      <EnsureStoreId>
        <Routes>
          {/* Main routes - restored original structure */}
          <Route
            path={ROUTES.HOME}
            element={
              <Layout>
                <ProjectsPage />
              </Layout>
            }
          />
          <Route
            path={ROUTES.PROJECTS}
            element={
              <Layout>
                <ProjectsPage />
              </Layout>
            }
          />
          <Route
            path={ROUTES.TASKS}
            element={
              <Layout>
                <TasksPage />
              </Layout>
            }
          />
          <Route
            path={ROUTES.WORKERS}
            element={
              <Layout>
                <WorkersPage />
              </Layout>
            }
          />
          <Route
            path={ROUTES.DOCUMENTS}
            element={
              <Layout>
                <DocumentsPage />
              </Layout>
            }
          />
          <Route
            path={ROUTES.DOCUMENT}
            element={
              <Layout>
                <DocumentPage />
              </Layout>
            }
          />
          <Route
            path={ROUTES.PROJECT}
            element={
              <Layout>
                <ProjectWorkspace />
              </Layout>
            }
          />
          <Route
            path={ROUTES.DOCUMENT}
            element={
              <Layout>
                <DocumentPage />
              </Layout>
            }
          />
        </Routes>
      </EnsureStoreId>
    </LiveStoreWrapper>
  </BrowserRouter>
)
