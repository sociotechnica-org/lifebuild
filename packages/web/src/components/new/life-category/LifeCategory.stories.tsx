import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { LiveStoreProvider } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@lifebuild/shared/schema'
import type { ProjectCategory } from '@lifebuild/shared'
import { LifeCategory } from './LifeCategory.js'
import { getCategoryRoomDefinition } from '@lifebuild/shared/rooms'

type Story = StoryObj<typeof LifeCategory>

const withCategoryProviders =
  (category: ProjectCategory, boot?: (store: Store) => void) =>
  (StoryComponent: React.ComponentType): React.ReactElement => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`room-chat:category:${category}:open`, 'true')
      window.history.replaceState({}, '', `/new/category/${category}?roomChat=1&storeId=storybook`)
    }

    return (
      <LiveStoreProvider
        schema={schema}
        adapter={makeInMemoryAdapter()}
        batchUpdates={batchUpdates}
        boot={store => {
          seedCategory(store, category)
          boot?.(store)
        }}
      >
        <Routes>
          <Route path='/new/category/:categoryId' element={<StoryComponent />} />
        </Routes>
      </LiveStoreProvider>
    )
  }

const seedCategory = (store: Store, category: ProjectCategory) => {
  const now = new Date('2024-04-02T10:00:00Z')
  const room = getCategoryRoomDefinition(category)
  const conversationId = `storybook-conversation-${category}`

  store.commit(
    events.workerCreatedV2({
      id: room.worker.id,
      name: room.worker.name,
      roleDescription: room.worker.roleDescription,
      systemPrompt: room.worker.prompt,
      defaultModel: room.worker.defaultModel,
      createdAt: now,
      roomId: room.roomId,
      roomKind: room.roomKind,
      status: 'active',
    })
  )

  store.commit(
    events.conversationCreatedV2({
      id: conversationId,
      title: room.conversationTitle,
      model: room.worker.defaultModel,
      workerId: room.worker.id,
      roomId: room.roomId,
      roomKind: room.roomKind,
      scope: room.scope,
      createdAt: now,
    })
  )

  store.commit(
    events.chatMessageSent({
      id: `storybook-user-${category}`,
      conversationId,
      role: 'user',
      message: 'What should I focus on next?',
      createdAt: now,
    })
  )

  store.commit(
    events.chatMessageSent({
      id: `storybook-assistant-${category}`,
      conversationId,
      role: 'assistant',
      message:
        'Let’s choose one commitment that keeps momentum while respecting your current bandwidth.',
      createdAt: new Date(now.getTime() + 5_000),
    })
  )

  const projects = [
    {
      id: `${category}-active-1`,
      name: 'Anchor Routine',
      description: 'Baseline habit that keeps the category stable.',
      status: 'active',
    },
    {
      id: `${category}-active-2`,
      name: 'Stretch Goal',
      description: 'Ambitious objective for the quarter.',
      status: 'active',
    },
    {
      id: `${category}-planning-1`,
      name: 'Experiment',
      description: 'Lightweight idea currently being scoped.',
      status: 'planning',
    },
  ] as const

  projects.forEach((project, index) => {
    store.commit(
      events.projectCreatedV2({
        id: project.id,
        name: project.name,
        description: project.description,
        category,
        createdAt: new Date(now.getTime() + index * 60_000),
        actorId: 'storybook',
      })
    )

    store.commit(
      events.projectAttributesUpdated({
        id: project.id,
        attributes: { status: project.status },
        updatedAt: new Date(now.getTime() + index * 60_000 + 30_000),
        actorId: 'storybook',
      })
    )
  })

  store.commit(
    events.taskCreatedV2({
      id: `${category}-task-1`,
      projectId: projects[0].id,
      title: 'Draft next milestone',
      description: 'Clarify the definition of done before inviting collaborators.',
      status: 'doing',
      assigneeIds: ['user-1'],
      position: 1,
      createdAt: new Date(now.getTime() + 120_000),
      actorId: 'storybook',
    })
  )

  store.commit(
    events.taskCreatedV2({
      id: `${category}-task-2`,
      projectId: projects[1].id,
      title: 'Run weekly review',
      description: undefined,
      status: 'todo',
      assigneeIds: [],
      position: 2,
      createdAt: new Date(now.getTime() + 180_000),
      actorId: 'storybook',
    })
  )
}

const meta: Meta<typeof LifeCategory> = {
  title: 'New UI/Life Categories/LifeCategory',
  component: LifeCategory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Life Category surface rendered in the new RoomLayout so each category advisor (Maya, Brooks, etc.) can chat with the user inside Storybook.',
      },
    },
  },
}

export default meta

export const Health: Story = {
  decorators: [withCategoryProviders('health')],
}

export const Finances: Story = {
  decorators: [withCategoryProviders('finances')],
  parameters: {
    docs: {
      description: {
        story:
          'Finances room seeded with Brooks, showcasing how different agents swap in per category.',
      },
    },
  },
}
