import { describe, expect, it } from 'vitest'
import {
  createCampfireState,
  createCompletedState,
  getOnboardingUiPolicy,
  parseOnboardingState,
  serializeOnboardingState,
  transitionPhase,
} from './onboardingState.js'

describe('onboardingState', () => {
  it('serializes and parses persisted onboarding state', () => {
    const state = createCampfireState('2026-02-27T12:00:00.000Z')

    const serialized = serializeOnboardingState(state)
    const parsed = parseOnboardingState(serialized)

    expect(parsed).toEqual(state)
  })

  it('ignores invalid payloads', () => {
    expect(parseOnboardingState('')).toBeNull()
    expect(parseOnboardingState('{"phase":"unknown"}')).toBeNull()
    expect(parseOnboardingState('{"version":0}')).toBeNull()
  })

  it('only allows forward phase transitions', () => {
    const nowIso = '2026-02-27T12:00:00.000Z'
    const campfire = createCampfireState(nowIso)

    const reveal = transitionPhase(campfire, 'reveal', '2026-02-27T12:01:00.000Z')
    expect(reveal.phase).toBe('reveal')

    const blockedRegression = transitionPhase(reveal, 'campfire', '2026-02-27T12:02:00.000Z')
    expect(blockedRegression).toEqual(reveal)

    const completed = transitionPhase(reveal, 'completed', '2026-02-27T12:03:00.000Z')
    expect(completed.phase).toBe('completed')
    expect(completed.completedAt).toBe('2026-02-27T12:03:00.000Z')
  })

  it('derives UI policy by phase', () => {
    const campfire = createCampfireState('2026-02-27T12:00:00.000Z')
    const reveal = transitionPhase(campfire, 'reveal', '2026-02-27T12:01:00.000Z')
    const firstProject = transitionPhase(reveal, 'first_project', '2026-02-27T12:02:00.000Z')
    const completed = createCompletedState('2026-02-27T12:03:00.000Z')

    expect(getOnboardingUiPolicy(campfire, { isViewingFirstProject: false })).toMatchObject({
      showAttendantRail: false,
      showTaskQueue: false,
      showFogOverlay: true,
    })

    expect(getOnboardingUiPolicy(reveal, { isViewingFirstProject: false })).toMatchObject({
      showAttendantRail: true,
      railFadingIn: true,
      showFogOverlay: true,
    })

    expect(getOnboardingUiPolicy(firstProject, { isViewingFirstProject: false })).toMatchObject({
      showAttendantRail: true,
      showMarvinNotification: true,
    })

    expect(getOnboardingUiPolicy(completed, { isViewingFirstProject: false })).toMatchObject({
      showAttendantRail: true,
      showTaskQueue: true,
      showFogOverlay: false,
    })
  })
})
