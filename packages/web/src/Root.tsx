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
import { useLiveStoreWorkerSentryBridge } from './hooks/useLiveStoreWorkerSentryBridge.js'

import { LoginPage } from './pages/LoginPage.js'
import { SignupPage } from './pages/SignupPage.js'
import { AdminUsersPage } from './components/admin/AdminUsersPage.js'
import { UserDetailPage } from './components/admin/UserDetailPage.js'
import { EnsureStoreId } from './components/utils/EnsureStoreId.js'
import { LoadingState } from './components/ui/LoadingState.js'
import { ErrorBoundary } from './components/ui/ErrorBoundary/ErrorBoundary.js'
import { UserInitializer } from './components/utils/UserInitializer/UserInitializer.js'
import { AuthUserSync } from './components/utils/AuthUserSync/AuthUserSync.js'
import { SettingsInitializer } from './components/utils/SettingsInitializer/SettingsInitializer.js'
import { LiveStoreHealthMonitor } from './components/utils/LiveStoreHealthMonitor.js'
import { LiveStoreBootBoundary } from './components/utils/LiveStoreBootBoundary.js'
import { schema } from '@lifebuild/shared/schema'
import { ROUTES } from './constants/routes.js'
import { ProjectDetailPage } from './components/projects/ProjectDetailPage.js'
import { LifeMap } from './components/life-map/LifeMap.js'
import { RoomLayout } from './components/layout/RoomLayout.js'
import { DraftingRoom } from './components/drafting-room/DraftingRoom.js'
import { EntityTypeGate } from './components/drafting-room/EntityTypeGate.js'
import { Stage1Form } from './components/drafting-room/Stage1Form.js'
import { Stage2Form } from './components/drafting-room/Stage2Form.js'
import { Stage3Form } from './components/drafting-room/Stage3Form.js'
import { SystemStage1Form } from './components/drafting-room/SystemStage1Form.js'
import { SystemStage2Form } from './components/drafting-room/SystemStage2Form.js'
import { SystemStage3Form } from './components/drafting-room/SystemStage3Form.js'
import { SortingRoom } from './components/sorting-room/SortingRoom.js'
import { SystemBoard } from './components/system-board/SystemBoard.js'
import {
  LIFE_MAP_ROOM,
  DRAFTING_ROOM,
  SORTING_ROOM,
  SYSTEM_BOARD_ROOM,
} from '@lifebuild/shared/rooms'
import { determineStoreIdFromUser } from './utils/navigation.js'
import {
  DEVTOOLS_QUERY_PARAM,
  DEVTOOLS_ROUTE_PARAM,
  getDevtoolsMountPath,
  isDevtoolsEnabled,
} from './utils/livestoreDevtools.js'
import { LiveStoreRepairProvider } from './contexts/LiveStoreRepairContext.js'
import {
  consumeRepairRequestSync,
  peekRepairRequestSync,
  useLiveStoreRepair,
} from './hooks/useLiveStoreRepair.js'

const DevtoolsUrlLogger: React.FC<{ enabled: boolean; storeId: string }> = ({
  enabled,
  storeId,
}) => {
  const { store } = useStore()
  const lastUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const devtoolsAlias = (schema as { devtools?: { alias?: string } }).devtools?.alias ?? 'default'
    const devtoolsRoute = `/web/${storeId}/${store.clientId}/${store.sessionId}/${devtoolsAlias}`
    const devtoolsUrl = new URL(getDevtoolsMountPath(), window.location.origin)
    devtoolsUrl.searchParams.set(DEVTOOLS_QUERY_PARAM, 'true')
    devtoolsUrl.searchParams.set(DEVTOOLS_ROUTE_PARAM, devtoolsRoute)

    const urlString = devtoolsUrl.toString()
    if (lastUrlRef.current === urlString) return
    lastUrlRef.current = urlString
    ;(window as Window & { __LIVESTORE_DEVTOOLS_URL?: string }).__LIVESTORE_DEVTOOLS_URL = urlString
    console.info(`[LiveStore] Devtools URL: ${urlString}`)
  }, [enabled, storeId, store])

  return null
}

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
    return urlParams.get(DEVTOOLS_QUERY_PARAM)
  }, [location.search])

  const devtoolsEnabled = isDevtoolsEnabled(devtoolsParam)

  useLiveStoreWorkerSentryBridge(storeId)

  const repair = useLiveStoreRepair({ storeId })

  const [restartSignal, setRestartSignal] = useState(0)
  const [restartIndex, setRestartIndex] = useState(0)
  const [isRestarting, setIsRestarting] = useState(false)
  const pendingRestartRef = useRef(false)
  const hasStoreRef = useRef(false)
  const previousRef = useRef<{ storeId: string; authToken?: string } | null>(null)

  const requestRestart = useCallback(
    (reason: string, options?: { force?: boolean }) => {
      if (!hasStoreRef.current) {
        if (!options?.force) {
          return
        }
        console.warn(`[LiveStore] Forcing restart for '${storeId}' (${reason}).`)
        setRestartIndex(index => index + 1)
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

  const repairRequested = useMemo(() => peekRepairRequestSync(storeId), [storeId, restartIndex])
  const shouldResetPersistence = repairRequested?.status === 'requested'

  useEffect(() => {
    if (!shouldResetPersistence) return
    consumeRepairRequestSync(storeId)
    repair.refresh()
  }, [repair.refresh, shouldResetPersistence, storeId])

  const adapter = useMemo(
    () =>
      makePersistedAdapter({
        storage: { type: 'opfs' },
        worker: LiveStoreWorker,
        sharedWorker: LiveStoreSharedWorker,
        ...(shouldResetPersistence ? { resetPersistence: true } : {}),
      }),
    [shouldResetPersistence]
  )

  const handleRequestRepair = useCallback(
    (reason: string, source: string, options?: { forceRestart?: boolean }) => {
      repair.requestRepair({ reason, source })
      repair.clearRepairSuggestion()
      requestRestart(reason, { force: options?.forceRestart })
    },
    [repair, requestRestart]
  )

  const requestRepair = useCallback(
    (reason: string, source: string) => handleRequestRepair(reason, source),
    [handleRequestRepair]
  )

  const requestRepairForced = useCallback(
    (reason: string, source: string) => handleRequestRepair(reason, source, { forceRestart: true }),
    [handleRequestRepair]
  )

  const repairContextValue = useMemo(
    () => ({
      storeId,
      requestRepair,
      repairState: repair.repairState,
      repairSuggestion: repair.repairSuggestion,
      clearRepairSuggestion: repair.clearRepairSuggestion,
      suggestRepair: repair.suggestRepair,
    }),
    [
      storeId,
      requestRepair,
      repair.repairState,
      repair.repairSuggestion,
      repair.clearRepairSuggestion,
      repair.suggestRepair,
    ]
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
    <LiveStoreRepairProvider value={repairContextValue}>
      <LiveStoreBootBoundary
        key={`boot:${providerKey}`}
        onRetry={() => requestRestart('boot retry', { force: true })}
        onRepair={() =>
          requestRepairForced('LiveStore boot detected a head mismatch', 'boot-boundary')
        }
      >
        <LiveStoreProvider
          key={providerKey}
          schema={schema}
          renderLoading={state => (
            <LoadingState
              message={`${
                shouldResetPersistence ? 'Repairing local data' : 'Loading LiveStore'
              } (${state.stage})...`}
              fullScreen
            />
          )}
          adapter={adapter}
          batchUpdates={batchUpdates}
          storeId={storeId}
          syncPayload={syncPayload}
          disableDevtools={devtoolsEnabled ? false : true}
        >
          <DevtoolsUrlLogger enabled={devtoolsEnabled} storeId={storeId} />
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
      </LiveStoreBootBoundary>
    </LiveStoreRepairProvider>
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
                    {/* App routes */}
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
                      path={ROUTES.ENTITY_TYPE_GATE}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={DRAFTING_ROOM}>
                            <EntityTypeGate />
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
                      path={ROUTES.SYSTEM_CREATE}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={DRAFTING_ROOM}>
                            <SystemStage1Form />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.SYSTEM_STAGE1}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={DRAFTING_ROOM}>
                            <SystemStage1Form />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.SYSTEM_STAGE2}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={DRAFTING_ROOM}>
                            <SystemStage2Form />
                          </RoomLayout>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path={ROUTES.SYSTEM_STAGE3}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={DRAFTING_ROOM}>
                            <SystemStage3Form />
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
                      path={ROUTES.SYSTEM_BOARD}
                      element={
                        <ErrorBoundary>
                          <RoomLayout room={SYSTEM_BOARD_ROOM}>
                            <SystemBoard />
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
                    {/* Redirect legacy /old/* routes to life-map */}
                    <Route path='/old/*' element={<Navigate to={ROUTES.LIFE_MAP} replace />} />
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
