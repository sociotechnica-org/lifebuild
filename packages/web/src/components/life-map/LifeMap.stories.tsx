import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { LiveStoreProvider } from '../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@lifebuild/shared/schema'
import { LifeMap } from './LifeMap.js'
import { RoomLayout } from '../layout/RoomLayout.js'
import { AttendantRailProvider } from '../layout/AttendantRailProvider.js'
import { LIFE_MAP_ROOM } from '@lifebuild/shared/rooms'

const storyConversationId = 'story-conversation-life-map'

const withLifeMapProviders =
  (boot?: (store: Store) => void) =>
  (StoryComponent: React.ComponentType): React.ReactElement => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/new/life-map?storeId=storybook')
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
              <AttendantRailProvider>
                <RoomLayout room={LIFE_MAP_ROOM}>
                  <StoryComponent />
                </RoomLayout>
              </AttendantRailProvider>
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
      status: LIFE_MAP_ROOM.worker.status ?? 'active',
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
    {
      id: 'proj-health',
      name: 'Dial-in sleep routine',
      category: 'health',
      description: 'Improve sleep quality',
    },
    {
      id: 'proj-health-2',
      name: 'Morning workout routine',
      category: 'health',
      description: 'Exercise daily',
    },
    {
      id: 'proj-health-3',
      name: 'Meal prep Sundays',
      category: 'health',
      description: 'Plan healthy meals',
    },
    {
      id: 'proj-purpose',
      name: 'Define 2025 North Star',
      category: 'growth',
      description: 'Set long-term goals',
    },
    {
      id: 'proj-finances',
      name: 'Quarterly budget reset',
      category: 'finances',
      description: 'Review spending',
    },
    {
      id: 'proj-finances-2',
      name: 'Investment portfolio review',
      category: 'finances',
      description: 'Check investments',
    },
    {
      id: 'proj-home',
      name: 'Declutter studio',
      category: 'home',
      description: 'Organize workspace',
    },
    {
      id: 'proj-home-2',
      name: 'Fix leaky kitchen faucet',
      category: 'home',
      description: 'Home repair',
    },
    {
      id: 'proj-contribution',
      name: 'Mentor two founders',
      category: 'contribution',
      description: 'Help others',
    },
  ] as const

  projectSeeds.forEach((project, index) => {
    store.commit(
      events.projectCreatedV2({
        id: project.id,
        name: project.name,
        description: project.description,
        category: project.category,
        createdAt: new Date(now.getTime() + index * 60000),
        actorId: 'storybook',
      })
    )
  })

  // Mark a few projects as active to demonstrate lifecycle-based active rendering.
  store.commit(
    events.projectLifecycleUpdated({
      projectId: 'proj-finances',
      lifecycleState: { status: 'active', stage: 4, stream: 'gold' },
      updatedAt: now,
      actorId: 'storybook',
    })
  )
  store.commit(
    events.projectLifecycleUpdated({
      projectId: 'proj-purpose',
      lifecycleState: { status: 'active', stage: 4, stream: 'silver' },
      updatedAt: now,
      actorId: 'storybook',
    })
  )
  store.commit(
    events.projectLifecycleUpdated({
      projectId: 'proj-health',
      lifecycleState: { status: 'active', stage: 4, stream: 'bronze' },
      updatedAt: now,
      actorId: 'storybook',
    })
  )

  // Create tasks for some projects to demonstrate progress in active sections.
  const taskSeeds = [
    { id: 'task-health-1', projectId: 'proj-health', title: 'Research sleep trackers' },
    { id: 'task-health-2', projectId: 'proj-health-2', title: 'Buy gym equipment' },
    { id: 'task-finances-1', projectId: 'proj-finances', title: 'Review bank statements' },
    { id: 'task-home-1', projectId: 'proj-home-2', title: 'Call plumber' },
  ]

  taskSeeds.forEach((task, index) => {
    store.commit(
      events.taskCreatedV2({
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: undefined,
        assigneeIds: undefined,
        status: 'todo',
        position: index,
        createdAt: new Date(now.getTime() + index * 60000),
        actorId: 'storybook',
      })
    )
  })
}

const meta: Meta<typeof LifeMap> = {
  title: 'Life Map/LifeMap',
  component: LifeMap,
  decorators: [withLifeMapProviders()],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Life Map surface rendered inside RoomLayout with the global attendant rail available while exploring categories.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
