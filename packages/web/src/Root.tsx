import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import LiveStoreWorker from './livestore.worker.ts?worker'
import React, { useMemo } from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

import { AuthProvider, useAuth } from './contexts/AuthContext.js'
import { useChorusNavigation } from './hooks/useChorusNavigation.js'

import { ProjectsPage } from './components/projects/ProjectsPage.js'
import { ProjectWorkspace } from './components/projects/ProjectWorkspace/ProjectWorkspace.js'
import { TasksPage } from './components/tasks/TasksPage.js'
import { WorkersPage } from './components/workers/WorkersPage.js'
import { DocumentsPage } from './components/documents/DocumentsPage/DocumentsPage.js'
import { DocumentPage } from './components/documents/DocumentPage.js'
import { ContactList } from './components/contacts/ContactList.js'
import { ContactDetail } from './components/contacts/ContactDetail.js'
import { LifeCategoryView } from './components/life-category/LifeCategoryView.js'
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
import { LifeMapView } from './components/life-map/LifeMapView.js'
import { schema } from '@work-squared/shared/schema'
import { ROUTES } from './constants/routes.js'
import { ProjectDetailPage } from './components/new/projects/ProjectDetailPage.js'
import { LifeMap } from './components/new/life-map/LifeMap.js'
import { LifeCategory } from './components/new/life-category/LifeCategory.js'
import { RoomLayout } from './components/new/layout/RoomLayout.js'
import { NewUiShell } from './components/new/layout/NewUiShell.js'
import { DraftingRoom } from './components/new/drafting-room/DraftingRoom.js'
import { Stage1Form } from './components/new/drafting-room/Stage1Form.js'
import { Stage2Form } from './components/new/drafting-room/Stage2Form.js'
import { Stage3Form } from './components/new/drafting-room/Stage3Form.js'
import { SortingRoom } from './components/new/sorting-room/SortingRoom.js'
import { LIFE_MAP_ROOM } from '@work-squared/shared/rooms'

const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: LiveStoreWorker,
  sharedWorker: LiveStoreSharedWorker,
})

// Component that initializes CHORUS navigation inside LiveStore context
const ChorusNavigationInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useChorusNavigation()
  return <>{children}</>
}

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

  return (
    <LiveStoreProvider
      schema={schema}
      renderLoading={_ => <LoadingState message={`Loading LiveStore (${_.stage})...`} fullScreen />}
      adapter={adapter}
      batchUpdates={batchUpdates}
      storeId={storeId}
    >
      <ChorusNavigationInitializer>{children}</ChorusNavigationInitializer>
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
                            <LifeMapView />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.LIFE_MAP}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <LifeMapView />
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
                      path={ROUTES.NEW}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={LIFE_MAP_ROOM}>
                            <LifeMap />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.NEW_LIFE_MAP}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={LIFE_MAP_ROOM}>
                            <LifeMap />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.NEW_DRAFTING_ROOM}
                      element={
                        <ErrorBoundary>
                          <NewUiShell>
                            <DraftingRoom />
                          </NewUiShell>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.NEW_PROJECT_CREATE}
                      element={
                        <ErrorBoundary>
                          <NewUiShell>
                            <Stage1Form />
                          </NewUiShell>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.NEW_PROJECT_STAGE1}
                      element={
                        <ErrorBoundary>
                          <NewUiShell>
                            <Stage1Form />
                          </NewUiShell>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.NEW_PROJECT_STAGE2}
                      element={
                        <ErrorBoundary>
                          <NewUiShell>
                            <Stage2Form />
                          </NewUiShell>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.NEW_PROJECT_STAGE3}
                      element={
                        <ErrorBoundary>
                          <NewUiShell>
                            <Stage3Form />
                          </NewUiShell>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.NEW_SORTING_ROOM}
                      element={
                        <ErrorBoundary>
                          <NewUiShell>
                            <SortingRoom />
                          </NewUiShell>
                        </ErrorBoundary>
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
                    <Route
                      path={ROUTES.NEW_PROJECT}
                      element={
                        <ErrorBoundary>
                          <ProjectDetailPage />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.NEW_CATEGORY}
                      element={
                        <ErrorBoundary>
                          <LifeCategory />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.CATEGORY}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <LifeCategoryView />
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
