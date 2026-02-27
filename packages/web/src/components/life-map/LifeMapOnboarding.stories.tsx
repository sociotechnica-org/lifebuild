import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { Store } from '@livestore/livestore'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { events, schema } from '@lifebuild/shared/schema'
import { LiveStoreProvider } from '../../livestore-compat.js'
import { LifeMap } from './LifeMap.js'
import { RoomLayout } from '../layout/RoomLayout.js'
import { AttendantRailProvider } from '../layout/AttendantRailProvider.js'
import { LIFE_MAP_ROOM } from '@lifebuild/shared/rooms'
import { PlacementProvider } from '../hex-map/PlacementContext.js'
import { OnboardingProvider } from '../onboarding/OnboardingProvider.js'
import {
  ONBOARDING_SETTING_KEY,
  createCampfireState,
  serializeOnboardingState,
  transitionPhase,
} from '../onboarding/onboardingState.js'

type StoryPhase = 'campfire' | 'reveal' | 'first_project'

const seedOnboardingState = (store: Store, phase: StoryPhase) => {
  const now = new Date('2026-02-27T12:00:00.000Z')
  const firstProjectId = 'story-onboarding-project'

  let state = createCampfireState(now.toISOString())

  if (phase === 'reveal' || phase === 'first_project') {
    state = {
      ...transitionPhase(state, 'reveal', new Date(now.getTime() + 60_000).toISOString()),
      firstProjectId,
    }

    store.commit(
      events.projectCreatedV2({
        id: firstProjectId,
        name: 'Storybook Onboarding Project',
        description: 'This seeded project demonstrates onboarding map guidance.',
        category: 'growth',
        createdAt: now,
        actorId: 'storybook',
      })
    )

    store.commit(
      events.taskCreatedV2({
        id: 'story-onboarding-task-1',
        projectId: firstProjectId,
        title: 'Define your next action',
        description: 'Add one concrete task and complete it.',
        assigneeIds: undefined,
        status: 'todo',
        position: 1000,
        createdAt: now,
        actorId: 'storybook',
      })
    )

    store.commit(
      events.hexPositionPlaced({
        id: 'story-onboarding-placement',
        hexQ: -1,
        hexR: 0,
        entityType: 'project',
        entityId: firstProjectId,
        placedAt: now,
        actorId: 'storybook',
      })
    )
  }

  if (phase === 'first_project') {
    state = transitionPhase(state, 'first_project', new Date(now.getTime() + 120_000).toISOString())
  }

  store.commit(
    events.settingUpdated({
      key: ONBOARDING_SETTING_KEY,
      value: serializeOnboardingState(state),
      updatedAt: now,
    })
  )
}

const withProviders =
  (phase: StoryPhase) =>
  (Story: React.ComponentType): React.ReactElement => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/?storeId=storybook')
    }

    return (
      <LiveStoreProvider
        schema={schema}
        adapter={makeInMemoryAdapter()}
        batchUpdates={batchUpdates}
        boot={store => {
          seedOnboardingState(store, phase)
        }}
      >
        <Routes>
          <Route
            path='/'
            element={
              <OnboardingProvider>
                <AttendantRailProvider>
                  <PlacementProvider>
                    <RoomLayout room={LIFE_MAP_ROOM}>
                      <Story />
                    </RoomLayout>
                  </PlacementProvider>
                </AttendantRailProvider>
              </OnboardingProvider>
            }
          />
        </Routes>
      </LiveStoreProvider>
    )
  }

const meta: Meta<typeof LifeMap> = {
  title: 'Life Map/Onboarding Sequence',
  component: LifeMap,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Life Map in onboarding mode with persisted LiveStore setting state for each beat.',
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof meta>

export const CampfireBeat: Story = {
  decorators: [withProviders('campfire')],
}

export const RevealBeat: Story = {
  decorators: [withProviders('reveal')],
}

export const FirstProjectBeat: Story = {
  decorators: [withProviders('first_project')],
}
