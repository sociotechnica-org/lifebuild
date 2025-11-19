import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { LiveStoreProvider } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@work-squared/shared/schema'
import { LifeMap } from './LifeMap.js'
import { RoomLayout } from '../layout/RoomLayout.js'
import { LIFE_MAP_ROOM } from '@work-squared/shared/rooms'

const storyConversationId = 'story-conversation-life-map'

const withLifeMapProviders =
  (boot?: (store: Store) => void) =>
  (Story: React.ComponentType): React.ReactElement => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`room-chat:${LIFE_MAP_ROOM.roomId}:open`, 'true')
      window.history.replaceState({}, '', `/new/life-map?roomChat=1&storeId=storybook`)
    }

    return (
      <LiveStoreProvider
        schema={schema}
        adapter={makeInMemoryAdapter()}
        batchUpdates={batchUpdates}
        boot={store => {
          seedLifeMap(store)
          boot?.(store)
        }}
      >
        <Routes>
          <Route
            path='/new/life-map'
            element={
              <RoomLayout room={LIFE_MAP_ROOM}>
                <LifeMap />
              </RoomLayout>
            }
          />
        </Routes>
      </LiveStoreProvider>
    )
  }

const seedLifeMap = (store: Store) => {
  const now = new Date('2024-03-01T12:00:00Z')

  // Shared Life Map worker + conversation so chat works inside Storybook
  store.commit(
    events.workerCreatedV2({
      id: LIFE_MAP_ROOM.worker.id,
      name: LIFE_MAP_ROOM.worker.name,
      roleDescription: LIFE_MAP_ROOM.worker.roleDescription,
      systemPrompt: LIFE_MAP_ROOM.worker.prompt,
      defaultModel: LIFE_MAP_ROOM.worker.defaultModel,
      createdAt: now,
      roomId: LIFE_MAP_ROOM.roomId,
      roomKind: LIFE_MAP_ROOM.roomKind,
      status: 'active',
    })
  )

  store.commit(
    events.conversationCreatedV2({
      id: storyConversationId,
      title: LIFE_MAP_ROOM.conversationTitle,
      model: LIFE_MAP_ROOM.worker.defaultModel,
      workerId: LIFE_MAP_ROOM.worker.id,
      roomId: LIFE_MAP_ROOM.roomId,
      roomKind: LIFE_MAP_ROOM.roomKind,
      scope: LIFE_MAP_ROOM.scope,
      createdAt: now,
    })
  )

  store.commit(
    events.chatMessageSent({
      id: 'story-msg-1',
      conversationId: storyConversationId,
      role: 'user',
      message: 'Where should I focus this week?',
      createdAt: now,
    })
  )

  store.commit(
    events.chatMessageSent({
      id: 'story-msg-2',
      conversationId: storyConversationId,
      role: 'assistant',
      message:
        'Energy is scattered across Health and Purpose. Pick one concrete action in each to regain balance.',
      createdAt: new Date('2024-03-01T12:00:10Z'),
    })
  )

  const projectSeeds = [
    { id: 'proj-health', name: 'Dial-in sleep routine', category: 'health' },
    { id: 'proj-purpose', name: 'Define 2025 North Star', category: 'growth' },
    { id: 'proj-finances', name: 'Quarterly budget reset', category: 'finances' },
    { id: 'proj-home', name: 'Declutter studio', category: 'home' },
    { id: 'proj-contribution', name: 'Mentor two founders', category: 'contribution' },
  ] as const

  projectSeeds.forEach((project, index) => {
    store.commit(
      events.projectCreatedV2({
        id: project.id,
        name: project.name,
        description: 'Seeded via Life Map story.',
        category: project.category,
        createdAt: new Date(now.getTime() + index * 60000),
        actorId: 'storybook',
      })
    )
  })
}

const meta: Meta<typeof LifeMap> = {
  title: 'New UI/Life Map/LifeMap',
  component: LifeMap,
  decorators: [withLifeMapProviders()],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Life Map surface rendered inside RoomLayout so the MESA chat sidebar can be toggled on/off while exploring categories.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
