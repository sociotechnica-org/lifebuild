import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import React, { useMemo } from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { AuthProvider } from './contexts/AuthContext.js'
import { useSyncPayload } from './hooks/useSyncPayload.js'

import { ProjectsPage } from './components/projects/ProjectsPage.js'
import { ProjectWorkspace } from './components/projects/ProjectWorkspace/ProjectWorkspace.js'
import { TasksPage } from './components/tasks/TasksPage.js'
import { WorkersPage } from './components/workers/WorkersPage.js'
import { DocumentsPage } from './components/documents/DocumentsPage/DocumentsPage.js'
import { DocumentPage } from './components/documents/DocumentPage.js'
import { HistoryPage } from './pages/HistoryPage.js'
import { LoginPage } from './pages/LoginPage.js'
import { SignupPage } from './pages/SignupPage.js'
import { Layout } from './components/layout/Layout.js'
import { EnsureStoreId } from './components/utils/EnsureStoreId.js'
import { LoadingState } from './components/ui/LoadingState.js'
import { ErrorBoundary } from './components/ui/ErrorBoundary/ErrorBoundary.js'
import { UserInitializer } from './components/utils/UserInitializer/UserInitializer.js'
import { ProtectedRoute } from './components/auth/ProtectedRoute.js'
import { schema } from '@work-squared/shared/schema'
import { ROUTES } from './constants/routes.js'

const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: () =>
    new Worker(new URL('../../worker/src/livestore.worker.ts', import.meta.url), {
      type: 'module',
    }),
  sharedWorker: LiveStoreSharedWorker,
})

// LiveStore wrapper with auth integration
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

  // Get dynamic sync payload with auth token
  const { syncPayload } = useSyncPayload({ instanceId: storeId })

  console.log(`Using stable storeId: ${storeId}`)
  // Debug: console.log('Sync payload being passed to LiveStore:', syncPayload)

  return (
    <LiveStoreProvider
      schema={schema}
      renderLoading={_ => <LoadingState message={`Loading LiveStore (${_.stage})...`} fullScreen />}
      adapter={adapter}
      batchUpdates={batchUpdates}
      storeId={storeId}
      syncPayload={syncPayload}
    >
      {children}
    </LiveStoreProvider>
  )
}

// Protected app wrapper - includes LiveStore and all protected routes
const ProtectedApp: React.FC = () => (
  <LiveStoreWrapper>
    <EnsureStoreId>
      <UserInitializer>
        <ErrorBoundary>
          <Routes>
            <Route
              path={ROUTES.HOME}
              element={
                <ProtectedRoute>
                  <Layout>
                    <ErrorBoundary>
                      <ProjectsPage />
                    </ErrorBoundary>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.PROJECTS}
              element={
                <ProtectedRoute>
                  <Layout>
                    <ErrorBoundary>
                      <ProjectsPage />
                    </ErrorBoundary>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.TASKS}
              element={
                <ProtectedRoute>
                  <Layout>
                    <ErrorBoundary>
                      <TasksPage />
                    </ErrorBoundary>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.TEAM}
              element={
                <ProtectedRoute>
                  <Layout>
                    <ErrorBoundary>
                      <WorkersPage />
                    </ErrorBoundary>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.DOCUMENTS}
              element={
                <ProtectedRoute>
                  <Layout>
                    <ErrorBoundary>
                      <DocumentsPage />
                    </ErrorBoundary>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.HISTORY}
              element={
                <ProtectedRoute>
                  <Layout>
                    <ErrorBoundary>
                      <HistoryPage />
                    </ErrorBoundary>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.DOCUMENT}
              element={
                <ProtectedRoute>
                  <Layout>
                    <ErrorBoundary>
                      <DocumentPage />
                    </ErrorBoundary>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.PROJECT}
              element={
                <ProtectedRoute>
                  <Layout>
                    <ErrorBoundary>
                      <ProjectWorkspace />
                    </ErrorBoundary>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
      </UserInitializer>
    </EnsureStoreId>
  </LiveStoreWrapper>
)

export const App: React.FC = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public auth routes - outside LiveStore */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.SIGNUP} element={<SignupPage />} />

          {/* Protected routes - wrapped in LiveStore */}
          <Route path='/*' element={<ProtectedApp />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
)
