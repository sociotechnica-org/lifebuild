import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import React, { useMemo } from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

import { AuthProvider, useAuth } from './contexts/AuthContext.js'
import { useSyncPayload } from './hooks/useSyncPayload.js'
import { useChorusNavigation } from './hooks/useChorusNavigation.js'

import { ProjectsPage } from './components/projects/ProjectsPage.js'
import { ProjectWorkspace } from './components/projects/ProjectWorkspace/ProjectWorkspace.js'
import { TasksPage } from './components/tasks/TasksPage.js'
import { WorkersPage } from './components/workers/WorkersPage.js'
import { DocumentsPage } from './components/documents/DocumentsPage/DocumentsPage.js'
import { DocumentPage } from './components/documents/DocumentPage.js'
import { ContactList } from './components/contacts/ContactList.js'
import { ContactDetail } from './components/contacts/ContactDetail.js'
import { HistoryPage } from './pages/HistoryPage.js'
import { LoginPage } from './pages/LoginPage.js'
import { SignupPage } from './pages/SignupPage.js'
import { SettingsPage } from './components/settings/SettingsPage.js'
import { AdminUsersPage } from './components/admin/AdminUsersPage.js'
import { UserDetailPage } from './components/admin/UserDetailPage.js'
import { Layout } from './components/layout/Layout.js'
import { EnsureStoreId } from './components/utils/EnsureStoreId.js'
import { LoadingState } from './components/ui/LoadingState.js'
import { ErrorBoundary } from './components/ui/ErrorBoundary/ErrorBoundary.js'
import { UserInitializer } from './components/utils/UserInitializer/UserInitializer.js'
import { AuthUserSync } from './components/utils/AuthUserSync/AuthUserSync.js'
import { SettingsInitializer } from './components/utils/SettingsInitializer/SettingsInitializer.js'
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

// Auth guard for the entire protected app
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Check if authentication is required based on environment
  const requireAuth = import.meta.env.VITE_REQUIRE_AUTH === 'true'

  // When auth is disabled, always allow access
  if (!requireAuth) {
    return <>{children}</>
  }

  // Show loading state while auth is being checked
  if (isLoading) {
    return <LoadingState message='Checking authentication...' fullScreen />
  }

  // If not authenticated, redirect to login with current path as redirect target
  if (!isAuthenticated) {
    const redirectPath =
      location.pathname !== ROUTES.HOME
        ? `${ROUTES.LOGIN}?redirect=${encodeURIComponent(location.pathname + location.search)}`
        : ROUTES.LOGIN

    return <Navigate to={redirectPath} replace />
  }

  // User is authenticated, render the protected content
  return <>{children}</>
}

// Protected app wrapper - includes LiveStore and all protected routes
const ProtectedApp: React.FC = () => {
  // Initialize global CHORUS navigation handling
  useChorusNavigation()

  return (
    <AuthGuard>
      <LiveStoreWrapper>
        <EnsureStoreId>
          <UserInitializer>
            <AuthUserSync>
              <SettingsInitializer>
                <ErrorBoundary>
                  <Routes>
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
                      path={ROUTES.CONTACTS}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <ContactList />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.CONTACT}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <ContactDetail />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.HISTORY}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <HistoryPage />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.SETTINGS}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <SettingsPage />
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
              </SettingsInitializer>
            </AuthUserSync>
          </UserInitializer>
        </EnsureStoreId>
      </LiveStoreWrapper>
    </AuthGuard>
  )
}

export const App: React.FC = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public auth routes - outside LiveStore */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.SIGNUP} element={<SignupPage />} />

          {/* Admin routes - outside LiveStore */}
          <Route
            path={ROUTES.ADMIN}
            element={
              <ErrorBoundary>
                <AdminUsersPage />
              </ErrorBoundary>
            }
          />
          <Route
            path={ROUTES.ADMIN_USER}
            element={
              <ErrorBoundary>
                <UserDetailPage />
              </ErrorBoundary>
            }
          />

          {/* Protected routes - wrapped in LiveStore */}
          <Route path='/*' element={<ProtectedApp />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
)
