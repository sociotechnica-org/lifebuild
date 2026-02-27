import { SETTINGS_KEYS } from '@lifebuild/shared'

export const ONBOARDING_SETTING_KEY = SETTINGS_KEYS.ONBOARDING_STATE
export const ONBOARDING_STATE_VERSION = 1

export const ONBOARDING_PHASES = ['not_started', 'campfire', 'reveal', 'first_project', 'completed']
export type OnboardingPhase = (typeof ONBOARDING_PHASES)[number]

const PHASE_ORDER: Record<OnboardingPhase, number> = {
  not_started: 0,
  campfire: 1,
  reveal: 2,
  first_project: 3,
  completed: 4,
}

export type PersistedOnboardingState = {
  version: number
  phase: OnboardingPhase
  firstProjectId: string | null
  startedAt: string
  updatedAt: string
  projectOpenedAt: string | null
  marvinAutoOpenedAt: string | null
  completedAt: string | null
}

export type OnboardingUiPolicy = {
  showAttendantRail: boolean
  showTaskQueue: boolean
  railFadingIn: boolean
  showFogOverlay: boolean
  showMarvinNotification: boolean
}

export const createCampfireState = (nowIso: string): PersistedOnboardingState => ({
  version: ONBOARDING_STATE_VERSION,
  phase: 'campfire',
  firstProjectId: null,
  startedAt: nowIso,
  updatedAt: nowIso,
  projectOpenedAt: null,
  marvinAutoOpenedAt: null,
  completedAt: null,
})

export const createCompletedState = (nowIso: string): PersistedOnboardingState => ({
  version: ONBOARDING_STATE_VERSION,
  phase: 'completed',
  firstProjectId: null,
  startedAt: nowIso,
  updatedAt: nowIso,
  projectOpenedAt: null,
  marvinAutoOpenedAt: null,
  completedAt: nowIso,
})

export const serializeOnboardingState = (state: PersistedOnboardingState): string => {
  return JSON.stringify(state)
}

const isOnboardingPhase = (value: unknown): value is OnboardingPhase => {
  return typeof value === 'string' && ONBOARDING_PHASES.includes(value as OnboardingPhase)
}

const isNullableIsoString = (value: unknown): value is string | null => {
  return value === null || typeof value === 'string'
}

export const parseOnboardingState = (
  value: string | null | undefined
): PersistedOnboardingState | null => {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as Partial<PersistedOnboardingState>
    if (
      parsed.version !== ONBOARDING_STATE_VERSION ||
      !isOnboardingPhase(parsed.phase) ||
      !isNullableIsoString(parsed.firstProjectId) ||
      typeof parsed.startedAt !== 'string' ||
      typeof parsed.updatedAt !== 'string' ||
      !isNullableIsoString(parsed.projectOpenedAt) ||
      !isNullableIsoString(parsed.marvinAutoOpenedAt) ||
      !isNullableIsoString(parsed.completedAt)
    ) {
      return null
    }

    return {
      version: parsed.version,
      phase: parsed.phase,
      firstProjectId: parsed.firstProjectId,
      startedAt: parsed.startedAt,
      updatedAt: parsed.updatedAt,
      projectOpenedAt: parsed.projectOpenedAt,
      marvinAutoOpenedAt: parsed.marvinAutoOpenedAt,
      completedAt: parsed.completedAt,
    }
  } catch {
    return null
  }
}

export const transitionPhase = (
  state: PersistedOnboardingState,
  nextPhase: OnboardingPhase,
  nowIso: string
): PersistedOnboardingState => {
  const nextPhaseOrder = PHASE_ORDER[nextPhase] ?? 0
  const currentPhaseOrder = PHASE_ORDER[state.phase] ?? 0

  if (nextPhaseOrder < currentPhaseOrder) {
    return state
  }

  if (nextPhase === state.phase) {
    return state
  }

  return {
    ...state,
    phase: nextPhase,
    updatedAt: nowIso,
    completedAt: nextPhase === 'completed' ? nowIso : state.completedAt,
  }
}

export const getOnboardingUiPolicy = (
  state: PersistedOnboardingState,
  options: { isViewingFirstProject: boolean }
): OnboardingUiPolicy => {
  switch (state.phase) {
    case 'campfire':
    case 'not_started':
      return {
        showAttendantRail: false,
        showTaskQueue: false,
        railFadingIn: false,
        showFogOverlay: true,
        showMarvinNotification: false,
      }
    case 'reveal':
      return {
        showAttendantRail: true,
        showTaskQueue: true,
        railFadingIn: true,
        showFogOverlay: true,
        showMarvinNotification: false,
      }
    case 'first_project':
      return {
        showAttendantRail: true,
        showTaskQueue: true,
        railFadingIn: false,
        showFogOverlay: false,
        showMarvinNotification: !options.isViewingFirstProject && !state.marvinAutoOpenedAt,
      }
    default:
      return {
        showAttendantRail: true,
        showTaskQueue: true,
        railFadingIn: false,
        showFogOverlay: false,
        showMarvinNotification: false,
      }
  }
}
