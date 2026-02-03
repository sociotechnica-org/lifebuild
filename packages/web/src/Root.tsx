import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider, useStore } from './livestore-compat.js'
import LiveStoreWorker from './livestore.worker.ts?worker'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

import { AuthProvider, useAuth } from './contexts/AuthContext.js'
import { useChorusNavigation } from './hooks/useChorusNavigation.js'
import { useSyncPayload } from './hooks/useSyncPayload.js'

import { ProjectsPage } from './components/projects/ProjectsPage.js'
import { ProjectWorkspace } from './components/projects/ProjectWorkspace/ProjectWorkspace.js'
import { TasksPage } from './components/tasks/TasksPage.js'
import { WorkersPage } from './components/workers/WorkersPage.js'
import { DocumentsPage } from './components/documents/DocumentsPage/DocumentsPage.js'
import { DocumentPage } from './components/documents/DocumentPage.js'
import { ContactList } from './components/contacts/ContactList.js'
import { ContactDetail } from './components/contacts/ContactDetail.js'
import { LifeCategoryView } from './components/life-category/LifeCategoryView.js'
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
import { LiveStoreHealthMonitor } from './components/utils/LiveStoreHealthMonitor.js'
import { LifeMapView } from './components/life-map/LifeMapView.js'
import { schema } from '@lifebuild/shared/schema'
import { ROUTES } from './constants/routes.js'
import { ProjectDetailPage } from './components/new/projects/ProjectDetailPage.js'
import { LifeMap } from './components/new/life-map/LifeMap.js'
import { RoomLayout } from './components/new/layout/RoomLayout.js'
import { DraftingRoom } from './components/new/drafting-room/DraftingRoom.js'
import { Stage1Form } from './components/new/drafting-room/Stage1Form.js'
import { Stage2Form } from './components/new/drafting-room/Stage2Form.js'
import { Stage3Form } from './components/new/drafting-room/Stage3Form.js'
import { SortingRoom } from './components/new/sorting-room/SortingRoom.js'
import { LIFE_MAP_ROOM, DRAFTING_ROOM, SORTING_ROOM } from '@lifebuild/shared/rooms'
import { determineStoreIdFromUser } from './utils/navigation.js'

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
const LiveStoreRestartCoordinator: React.FC<{
  restartSignal: number
  onShutdownComplete: () => void
  onStoreReady: () => void
}> = ({ restartSignal, onShutdownComplete, onStoreReady }) => {
  const { store } = useStore()
  const lastSignalRef = useRef(restartSignal)

  useEffect(() => {
    onStoreReady()
  }, [onStoreReady])

  useEffect(() => {
    if (restartSignal === lastSignalRef.current) return
    lastSignalRef.current = restartSignal
    let isActive = true

    const runShutdown = async () => {
      try {
        await Promise.race([
          store.shutdownPromise?.() ?? Promise.resolve(),
          new Promise<void>(resolve => {
            window.setTimeout(resolve, 2000)
          }),
        ])
      } catch (error) {
        console.warn('[LiveStore] Shutdown failed:', error)
      } finally {
        if (isActive) {
          onShutdownComplete()
        }
      }
    }

    void runShutdown()

    return () => {
      isActive = false
    }
  }, [restartSignal, store, onShutdownComplete])

  return null
}

const LiveStoreWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  const storeId = useMemo(() => {
    if (typeof window === 'undefined') return 'unused'

    const urlParams = new URLSearchParams(location.search)
    const urlStoreId = urlParams.get('storeId')
    const isValidInstanceId =
      user?.instances && urlStoreId
        ? user.instances.some(instance => instance.id === urlStoreId)
        : true

    if (urlStoreId && (!user || isValidInstanceId)) {
      return urlStoreId
    }

    return determineStoreIdFromUser(user)
  }, [location.search, user])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('storeId', storeId)
  }, [storeId])

  const { syncPayload } = useSyncPayload({ instanceId: storeId })

  const devtoolsParam = useMemo(() => {
    if (typeof window === 'undefined') return null
    const urlParams = new URLSearchParams(location.search)
    return urlParams.get('livestoreDevtools')
  }, [location.search])

  const devtoolsEnabled = devtoolsParam === '1' || devtoolsParam === 'true'

  const [restartSignal, setRestartSignal] = useState(0)
  const [restartIndex, setRestartIndex] = useState(0)
  const [isRestarting, setIsRestarting] = useState(false)
  const pendingRestartRef = useRef(false)
  const hasStoreRef = useRef(false)
  const previousRef = useRef<{ storeId: string; authToken?: string } | null>(null)

  const requestRestart = useCallback(
    (reason: string) => {
      if (!hasStoreRef.current) {
        return
      }
      if (pendingRestartRef.current) {
        return
      }
      pendingRestartRef.current = true
      console.warn(`[LiveStore] Restarting store '${storeId}' (${reason}).`)
      setIsRestarting(true)
      setRestartSignal(value => value + 1)
    },
    [storeId]
  )

  const handleShutdownComplete = useCallback(() => {
    pendingRestartRef.current = false
    setIsRestarting(false)
    setRestartIndex(index => index + 1)
  }, [])

  const handleStoreReady = useCallback(() => {
    hasStoreRef.current = true
  }, [])

  useEffect(() => {
    pendingRestartRef.current = false
    hasStoreRef.current = false
    setIsRestarting(false)
  }, [storeId])

  useEffect(() => {
    if (!previousRef.current) {
      previousRef.current = { storeId, authToken: syncPayload.authToken }
      return
    }

    const previous = previousRef.current
    const storeIdChanged = previous.storeId !== storeId
    const authTokenChanged = previous.authToken !== syncPayload.authToken
    previousRef.current = { storeId, authToken: syncPayload.authToken }

    if (!hasStoreRef.current) {
      return
    }

    if (storeIdChanged) {
      return
    }

    if (authTokenChanged) {
      requestRestart('auth token updated')
    }
  }, [storeId, syncPayload.authToken, requestRestart])

  const providerKey = `${storeId}:${restartIndex}:${devtoolsEnabled ? 'devtools' : 'nodevtools'}`

  const requireAuth = import.meta.env.VITE_REQUIRE_AUTH === 'true'
  if (requireAuth && isAuthenticated && !syncPayload.authToken && !syncPayload.authError) {
    return <LoadingState message='Preparing LiveStore...' fullScreen />
  }

  return (
    <LiveStoreProvider
      key={providerKey}
      schema={schema}
      renderLoading={_ => <LoadingState message={`Loading LiveStore (${_.stage})...`} fullScreen />}
      adapter={adapter}
      batchUpdates={batchUpdates}
      storeId={storeId}
      syncPayload={syncPayload}
      disableDevtools={devtoolsEnabled ? false : true}
    >
      <LiveStoreRestartCoordinator
        restartSignal={restartSignal}
        onShutdownComplete={handleShutdownComplete}
        onStoreReady={handleStoreReady}
      />
      <LiveStoreHealthMonitor syncPayload={syncPayload} onRestart={requestRestart} />
      {isRestarting ? (
        <LoadingState message='Restarting LiveStore…' fullScreen />
      ) : (
        <ChorusNavigationInitializer>{children}</ChorusNavigationInitializer>
      )}
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
                    {/* New UI routes (default) */}
                    <Route
                      path={ROUTES.HOME}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={LIFE_MAP_ROOM}>
                            <LifeMap />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.LIFE_MAP}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={LIFE_MAP_ROOM}>
                            <LifeMap />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.DRAFTING_ROOM}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={DRAFTING_ROOM}>
                            <DraftingRoom />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.PROJECT_CREATE}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={DRAFTING_ROOM}>
                            <Stage1Form />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.PROJECT_STAGE1}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={DRAFTING_ROOM}>
                            <Stage1Form />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.PROJECT_STAGE2}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={DRAFTING_ROOM}>
                            <Stage2Form />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.PROJECT_STAGE3}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={DRAFTING_ROOM}>
                            <Stage3Form />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.SORTING_ROOM}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={SORTING_ROOM}>
                            <SortingRoom />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.SORTING_ROOM_STREAM}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={SORTING_ROOM}>
                            <SortingRoom />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.PROJECTS}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={LIFE_MAP_ROOM}>
                            <LifeMap />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.PROJECT}
                      element={
                        <ErrorBoundary>
                          <ProjectDetailPage />
                        </ErrorBoundary>
                      }
                    />
                    {/* Old UI routes (under /old) */}
                    <Route
                      path={ROUTES.OLD}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <LifeMapView />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.OLD_LIFE_MAP}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <LifeMapView />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.OLD_PROJECTS}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <ProjectsPage />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.OLD_TASKS}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <TasksPage />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.OLD_TEAM}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <WorkersPage />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.OLD_DOCUMENTS}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <DocumentsPage />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.OLD_CONTACTS}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <ContactList />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.OLD_CONTACT}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <ContactDetail />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.OLD_SETTINGS}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <SettingsPage />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.OLD_DOCUMENT}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <DocumentPage />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.OLD_PROJECT}
                      element={
                        <Layout>
                          <ErrorBoundary>
                            <ProjectWorkspace />
                          </ErrorBoundary>
                        </Layout>
                      }
                    />
                    <Route
                      path={ROUTES.OLD_CATEGORY}
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
