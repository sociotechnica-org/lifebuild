import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { LiveStoreProvider } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@lifebuild/shared/schema'
import { LifeMap } from './LifeMap.js'
import { RoomLayout } from '../layout/RoomLayout.js'
import { LIFE_MAP_ROOM } from '@lifebuild/shared/rooms'

const storyConversationId = 'story-conversation-life-map'

const withLifeMapProviders =
  (boot?: (store: Store) => void) =>
  (StoryComponent: React.ComponentType): React.ReactElement => {
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
                <StoryComponent />
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

  // Create tasks for some projects to demonstrate active vs tabled
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

  // Initialize table configuration with Gold and Silver projects
  store.commit(
    events.tableConfigurationInitialized({
      goldProjectId: 'proj-finances', // Finances project is Gold
      silverProjectId: 'proj-purpose', // Growth project is Silver
      bronzeMode: 'target',
      bronzeTargetExtra: 0,
      updatedAt: now,
      actorId: 'storybook',
    })
  )

  // Add some tasks to bronze stack to make projects "active"
  // This simulates projects that have tasks in the active bronze queue
  const bronzeTaskSeeds = [
    { id: 'bronze-1', taskId: 'task-health-1', position: 0 },
    { id: 'bronze-2', taskId: 'task-finances-1', position: 1 },
  ]

  bronzeTaskSeeds.forEach(entry => {
    store.commit(
      events.bronzeTaskAdded({
        id: entry.id,
        taskId: entry.taskId,
        position: entry.position,
        insertedAt: now,
        insertedBy: 'storybook',
        status: 'active',
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
