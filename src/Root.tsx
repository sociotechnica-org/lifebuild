import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import React, { useMemo } from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { ProjectsPage } from './components/projects/ProjectsPage.js'
import { ProjectWorkspace } from './components/projects/ProjectWorkspace/ProjectWorkspace.js'
import { TasksPage } from './components/tasks/TasksPage.js'
import { WorkersPage } from './components/workers/WorkersPage.js'
import { DocumentsPage } from './components/documents/DocumentsPage/DocumentsPage.js'
import { DocumentPage } from './components/documents/DocumentPage.js'
import { Layout } from './components/layout/Layout.js'
import { EnsureStoreId } from './components/utils/EnsureStoreId.js'
import { LoadingState } from './components/ui/LoadingState.js'
import { ErrorBoundary } from './components/ui/ErrorBoundary/ErrorBoundary.js'
import { UserInitializer } from './components/utils/UserInitializer/UserInitializer.js'
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
      renderLoading={_ => <LoadingState message={`Loading LiveStore (${_.stage})...`} fullScreen />}
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
  <ErrorBoundary>
    <BrowserRouter>
      <LiveStoreWrapper>
        <EnsureStoreId>
          <UserInitializer>
            <ErrorBoundary>
              <Routes>
                {/* Main routes - restored original structure */}
                <Route
                  path={ROUTES.HOME}
                  element={
                    <Layout>
                      <ErrorBoundary>
                        <ProjectsPage />
                      </ErrorBoundary>
                    </Layout>
                  }
                />
                <Route
                  path={ROUTES.PROJECTS}
                  element={
                    <Layout>
                      <ErrorBoundary>
                        <ProjectsPage />
                      </ErrorBoundary>
                    </Layout>
                  }
                />
                <Route
                  path={ROUTES.TASKS}
                  element={
                    <Layout>
                      <ErrorBoundary>
                        <TasksPage />
                      </ErrorBoundary>
                    </Layout>
                  }
                />
                <Route
                  path={ROUTES.TEAM}
                  element={
                    <Layout>
                      <ErrorBoundary>
                        <WorkersPage />
                      </ErrorBoundary>
                    </Layout>
                  }
                />
                <Route
                  path={ROUTES.DOCUMENTS}
                  element={
                    <Layout>
                      <ErrorBoundary>
                        <DocumentsPage />
                      </ErrorBoundary>
                    </Layout>
                  }
                />
                <Route
                  path={ROUTES.DOCUMENT}
                  element={
                    <Layout>
                      <ErrorBoundary>
                        <DocumentPage />
                      </ErrorBoundary>
                    </Layout>
                  }
                />
                <Route
                  path={ROUTES.PROJECT}
                  element={
                    <Layout>
                      <ErrorBoundary>
                        <ProjectWorkspace />
                      </ErrorBoundary>
                    </Layout>
                  }
                />
              </Routes>
            </ErrorBoundary>
          </UserInitializer>
        </EnsureStoreId>
      </LiveStoreWrapper>
    </BrowserRouter>
  </ErrorBoundary>
)
