import {
  createHex,
  generateHexGrid,
  getHexPositions$,
  getProjects$,
  getSettingByKey$,
  hexToKey,
} from '@lifebuild/shared'
import { events } from '@lifebuild/shared/schema'
import type { HexPosition } from '@lifebuild/shared/schema'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.js'
import { ROUTES } from '../../constants/routes.js'
import { useQuery, useStore } from '../../livestore-compat.js'
import { isReservedProjectCoord } from '../hex-map/placementRules.js'
import {
  ONBOARDING_SETTING_KEY,
  createCampfireState,
  createCompletedState,
  getOnboardingUiPolicy,
  parseOnboardingState,
  serializeOnboardingState,
  transitionPhase,
  type OnboardingPhase,
  type OnboardingUiPolicy,
  type PersistedOnboardingState,
} from './onboardingState.js'

const GRID_RADIUS = 3

const MAX_HEX_DISTANCE_FROM_CENTER = 3

const getHexDistanceFromCenter = (q: number, r: number, s: number): number => {
  return (Math.abs(q) + Math.abs(r) + Math.abs(s)) / 2
}

const pickOnboardingProjectCoord = (positions: readonly HexPosition[]) => {
  const occupiedKeys = new Set(
    positions
      .filter(position => position.entityType === 'project')
      .map(position => hexToKey(createHex(position.hexQ, position.hexR)))
  )

  const candidates = generateHexGrid(GRID_RADIUS)
    .map(cell => cell.coord)
    .filter(coord => {
      if (isReservedProjectCoord(coord)) {
        return false
      }

      if (getHexDistanceFromCenter(coord.q, coord.r, coord.s) > MAX_HEX_DISTANCE_FROM_CENTER) {
        return false
      }

      return !occupiedKeys.has(hexToKey(coord))
    })
    .sort(
      (a, b) => getHexDistanceFromCenter(a.q, a.r, a.s) - getHexDistanceFromCenter(b.q, b.r, b.s)
    )

  return candidates[0] ?? null
}

export type CreateOnboardingProjectInput = {
  name: string
  description: string
}

type OnboardingContextValue = {
  isReady: boolean
  isActive: boolean
  phase: OnboardingPhase
  firstProjectId: string | null
  state: PersistedOnboardingState
  uiPolicy: OnboardingUiPolicy
  shouldAutoOpenMarvin: boolean
  isViewingFirstProject: boolean
  isFogDismissed: boolean
  dismissFogOverlay: () => void
  resetFogOverlay: () => void
  createFirstProject: (input: CreateOnboardingProjectInput) => Promise<string | null>
  completeReveal: () => Promise<void>
  markProjectOpened: (projectId: string) => Promise<void>
  markMarvinAutoOpened: () => Promise<void>
  completeOnboarding: () => Promise<void>
}

const defaultNow = new Date('1970-01-01T00:00:00.000Z').toISOString()
const DEFAULT_STATE = createCompletedState(defaultNow)

const DEFAULT_CONTEXT: OnboardingContextValue = {
  isReady: false,
  isActive: false,
  phase: 'completed',
  firstProjectId: null,
  state: DEFAULT_STATE,
  uiPolicy: getOnboardingUiPolicy(DEFAULT_STATE, { isViewingFirstProject: false }),
  shouldAutoOpenMarvin: false,
  isViewingFirstProject: false,
  isFogDismissed: false,
  dismissFogOverlay: () => {},
  resetFogOverlay: () => {},
  createFirstProject: async () => null,
  completeReveal: async () => {},
  markProjectOpened: async () => {},
  markMarvinAutoOpened: async () => {},
  completeOnboarding: async () => {},
}

const OnboardingContext = createContext<OnboardingContextValue>(DEFAULT_CONTEXT)

const isForceOnboardingEnabled = (search: string): boolean => {
  const params = new URLSearchParams(search)
  return params.get('onboarding') === 'force'
}

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { store } = useStore()
  const location = useLocation()
  const { user } = useAuth()

  const actorId = user?.id

  const onboardingSettingRows = useQuery(getSettingByKey$(ONBOARDING_SETTING_KEY))
  const projects = useQuery(getProjects$)
  const hexPositions = useQuery(getHexPositions$)

  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isFogDismissed, setIsFogDismissed] = useState(false)

  const persistedState = useMemo(() => {
    return parseOnboardingState(onboardingSettingRows?.[0]?.value)
  }, [onboardingSettingRows])

  const persistState = useCallback(
    async (state: PersistedOnboardingState) => {
      await store.commit(
        events.settingUpdated({
          key: ONBOARDING_SETTING_KEY,
          value: serializeOnboardingState(state),
          updatedAt: new Date(),
        })
      )
    },
    [store]
  )

  useEffect(() => {
    if (onboardingSettingRows === undefined) {
      return
    }

    if (persistedState) {
      setIsBootstrapping(false)
      return
    }

    if (projects === undefined || hexPositions === undefined) {
      return
    }

    const nowIso = new Date().toISOString()
    const hasWorkspaceActivity =
      projects.length > 0 || hexPositions.some(position => position.entityType === 'project')
    const bypassForE2E =
      import.meta.env.VITE_E2E_TEST_HOOKS === 'true' && !isForceOnboardingEnabled(location.search)

    const nextState =
      hasWorkspaceActivity || bypassForE2E
        ? createCompletedState(nowIso)
        : createCampfireState(nowIso)

    void persistState(nextState).finally(() => {
      setIsBootstrapping(false)
    })
  }, [hexPositions, location.search, onboardingSettingRows, persistedState, persistState, projects])

  const state = persistedState ?? DEFAULT_STATE
  const isReady = !isBootstrapping && persistedState !== null

  const projectRouteMatch = matchPath(ROUTES.PROJECT, location.pathname)
  const viewedProjectId = projectRouteMatch?.params.projectId ?? null
  const isViewingFirstProject =
    state.phase === 'first_project' &&
    Boolean(state.firstProjectId) &&
    viewedProjectId === state.firstProjectId

  const updateState = useCallback(
    async (updater: (current: PersistedOnboardingState) => PersistedOnboardingState) => {
      if (!persistedState) {
        return
      }

      const nextState = updater(persistedState)
      if (serializeOnboardingState(nextState) === serializeOnboardingState(persistedState)) {
        return
      }

      await persistState(nextState)
    },
    [persistState, persistedState]
  )

  const createFirstProject = useCallback(
    async ({ name, description }: CreateOnboardingProjectInput) => {
      if (!persistedState) {
        return null
      }

      if (persistedState.phase !== 'campfire' && persistedState.phase !== 'not_started') {
        return persistedState.firstProjectId
      }

      const trimmedName = name.trim()
      const trimmedDescription = description.trim()
      if (!trimmedName || !trimmedDescription) {
        return null
      }

      const now = new Date()
      const projectId = crypto.randomUUID()

      await store.commit(
        events.projectCreatedV2({
          id: projectId,
          name: trimmedName,
          description: trimmedDescription,
          category: 'growth',
          createdAt: now,
          actorId,
        })
      )

      await store.commit(
        events.taskCreatedV2({
          id: crypto.randomUUID(),
          projectId,
          title: 'Define the next tiny step',
          description: 'Write down the smallest action you can complete today.',
          assigneeIds: undefined,
          status: 'todo',
          position: 1000,
          createdAt: now,
          actorId,
        })
      )

      await store.commit(
        events.taskCreatedV2({
          id: crypto.randomUUID(),
          projectId,
          title: 'Capture why this matters',
          description: 'Add one sentence about the purpose of this project.',
          assigneeIds: undefined,
          status: 'todo',
          position: 2000,
          createdAt: now,
          actorId,
        })
      )

      const latestHexPositions = await store.query(getHexPositions$)
      const placementCoord = pickOnboardingProjectCoord(latestHexPositions)

      if (placementCoord) {
        await store.commit(
          events.hexPositionPlaced({
            id: crypto.randomUUID(),
            hexQ: placementCoord.q,
            hexR: placementCoord.r,
            entityType: 'project',
            entityId: projectId,
            placedAt: now,
            actorId,
          })
        )
      }

      await updateState(current => {
        const transitioned = transitionPhase(current, 'reveal', now.toISOString())
        return {
          ...transitioned,
          firstProjectId: projectId,
          updatedAt: now.toISOString(),
        }
      })

      return projectId
    },
    [actorId, persistedState, store, updateState]
  )

  const completeReveal = useCallback(async () => {
    await updateState(current => {
      if (current.phase !== 'reveal') {
        return current
      }

      return transitionPhase(current, 'first_project', new Date().toISOString())
    })
  }, [updateState])

  const markProjectOpened = useCallback(
    async (projectId: string) => {
      await updateState(current => {
        if (current.phase !== 'first_project') {
          return current
        }

        if (!current.firstProjectId || current.firstProjectId !== projectId) {
          return current
        }

        if (current.projectOpenedAt) {
          return current
        }

        const nowIso = new Date().toISOString()
        return {
          ...current,
          projectOpenedAt: nowIso,
          updatedAt: nowIso,
        }
      })
    },
    [updateState]
  )

  const markMarvinAutoOpened = useCallback(async () => {
    await updateState(current => {
      if (current.phase !== 'first_project' || current.marvinAutoOpenedAt) {
        return current
      }

      const nowIso = new Date().toISOString()
      return {
        ...current,
        marvinAutoOpenedAt: nowIso,
        updatedAt: nowIso,
      }
    })
  }, [updateState])

  const completeOnboarding = useCallback(async () => {
    await updateState(current => {
      if (current.phase === 'completed') {
        return current
      }

      return transitionPhase(current, 'completed', new Date().toISOString())
    })
  }, [updateState])

  useEffect(() => {
    if (!isReady || state.phase !== 'first_project') {
      return
    }

    if (
      !state.firstProjectId ||
      viewedProjectId !== state.firstProjectId ||
      state.projectOpenedAt
    ) {
      return
    }

    void markProjectOpened(state.firstProjectId)
  }, [
    isReady,
    markProjectOpened,
    state.firstProjectId,
    state.phase,
    state.projectOpenedAt,
    viewedProjectId,
  ])

  useEffect(() => {
    if (!isReady || state.phase !== 'first_project') {
      return
    }

    if (!state.projectOpenedAt || viewedProjectId === state.firstProjectId) {
      return
    }

    void completeOnboarding()
  }, [
    completeOnboarding,
    isReady,
    state.firstProjectId,
    state.phase,
    state.projectOpenedAt,
    viewedProjectId,
  ])

  const uiPolicy = useMemo(
    () => getOnboardingUiPolicy(state, { isViewingFirstProject }),
    [isViewingFirstProject, state]
  )

  const value = useMemo<OnboardingContextValue>(
    () => ({
      isReady,
      isActive: isReady && state.phase !== 'completed',
      phase: state.phase,
      firstProjectId: state.firstProjectId,
      state,
      uiPolicy,
      shouldAutoOpenMarvin:
        isReady &&
        state.phase === 'first_project' &&
        isViewingFirstProject &&
        !state.marvinAutoOpenedAt,
      isViewingFirstProject,
      isFogDismissed,
      dismissFogOverlay: () => {
        setIsFogDismissed(true)
      },
      resetFogOverlay: () => {
        setIsFogDismissed(false)
      },
      createFirstProject,
      completeReveal,
      markProjectOpened,
      markMarvinAutoOpened,
      completeOnboarding,
    }),
    [
      completeOnboarding,
      completeReveal,
      createFirstProject,
      isFogDismissed,
      isReady,
      isViewingFirstProject,
      markMarvinAutoOpened,
      markProjectOpened,
      state,
      uiPolicy,
    ]
  )

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export const useOnboarding = (): OnboardingContextValue => {
  return useContext(OnboardingContext)
}
