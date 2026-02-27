import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { Store } from '@livestore/livestore'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { events, schema } from '@lifebuild/shared/schema'
import { LiveStoreProvider } from '../../livestore-compat.js'
import { TaskQueuePanel, TASK_QUEUE_COLLAPSED_STORAGE_KEY } from './TaskQueuePanel.js'

type StoryStoreOptions = {
  collapsed?: boolean
  boot?: (store: Store) => void
}

const withLiveStore =
  ({ collapsed = false, boot }: StoryStoreOptions = {}) =>
  (Story: React.ComponentType): React.ReactElement => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TASK_QUEUE_COLLAPSED_STORAGE_KEY, String(collapsed))
      window.history.replaceState({}, '', '/?storeId=storybook')
    }

    return (
      <LiveStoreProvider
        schema={schema}
        adapter={makeInMemoryAdapter()}
        batchUpdates={batchUpdates}
        boot={store => {
          boot?.(store)
        }}
      >
        <div className='relative h-[680px] w-full bg-[#f5f3f0]'>
          <Story />
        </div>
      </LiveStoreProvider>
    )
  }

const seedQueueData = (store: Store) => {
  const now = new Date('2024-02-01T10:00:00Z')

  store.commit(
    events.projectCreatedV2({
      id: 'project-health',
      name: 'Health Reset',
      description: 'Reset baseline routines',
      category: 'health',
      createdAt: now,
      actorId: 'storybook',
    })
  )

  store.commit(
    events.projectCreatedV2({
      id: 'project-purpose',
      name: 'Purpose Sprint',
      description: 'Ship one major milestone',
      category: 'growth',
      createdAt: new Date('2024-02-01T10:01:00Z'),
      actorId: 'storybook',
    })
  )

  store.commit(
    events.projectCreatedV2({
      id: 'project-home',
      name: 'Home Upgrade',
      description: 'Improve apartment systems',
      category: 'home',
      createdAt: new Date('2024-02-01T10:02:00Z'),
      actorId: 'storybook',
    })
  )

  store.commit(
    events.hexPositionPlaced({
      id: 'hex-health',
      hexQ: 0,
      hexR: 0,
      entityType: 'project',
      entityId: 'project-health',
      placedAt: now,
      actorId: 'storybook',
    })
  )

  store.commit(
    events.hexPositionPlaced({
      id: 'hex-purpose',
      hexQ: 1,
      hexR: -1,
      entityType: 'project',
      entityId: 'project-purpose',
      placedAt: new Date('2024-02-01T10:03:00Z'),
      actorId: 'storybook',
    })
  )

  store.commit(
    events.taskCreatedV2({
      id: 'task-1',
      projectId: 'project-health',
      title: 'Plan sleep schedule',
      description: undefined,
      assigneeIds: undefined,
      status: 'todo',
      position: 1000,
      createdAt: now,
      actorId: 'storybook',
    })
  )

  store.commit(
    events.taskCreatedV2({
      id: 'task-2',
      projectId: 'project-health',
      title: 'Review wearable data',
      description: undefined,
      assigneeIds: undefined,
      status: 'in_review',
      position: 2000,
      createdAt: new Date('2024-02-01T10:04:00Z'),
      actorId: 'storybook',
    })
  )

  store.commit(
    events.taskCreatedV2({
      id: 'task-3',
      projectId: 'project-purpose',
      title: 'Draft launch brief',
      description: undefined,
      assigneeIds: undefined,
      status: 'doing',
      position: 1000,
      createdAt: new Date('2024-02-01T10:05:00Z'),
      actorId: 'storybook',
    })
  )
}

const seedSinglePlacedProject = (store: Store) => {
  const now = new Date('2024-02-01T10:00:00Z')

  store.commit(
    events.projectCreatedV2({
      id: 'project-solo',
      name: 'Solo Project',
      description: 'Only one placed project',
      category: 'growth',
      createdAt: now,
      actorId: 'storybook',
    })
  )

  store.commit(
    events.hexPositionPlaced({
      id: 'hex-solo',
      hexQ: 0,
      hexR: 0,
      entityType: 'project',
      entityId: 'project-solo',
      placedAt: now,
      actorId: 'storybook',
    })
  )

  store.commit(
    events.taskCreatedV2({
      id: 'task-solo',
      projectId: 'project-solo',
      title: 'Solo task',
      description: undefined,
      assigneeIds: undefined,
      status: 'todo',
      position: 1000,
      createdAt: now,
      actorId: 'storybook',
    })
  )
}

const meta: Meta<typeof TaskQueuePanel> = {
  title: 'Task Queue/TaskQueuePanel',
  component: TaskQueuePanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Cross-project task queue rendered in the shell top-right area. Shows only when two or more projects are placed on the map.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Expanded: Story = {
  decorators: [withLiveStore({ collapsed: false, boot: seedQueueData })],
  render: () => <TaskQueuePanel />,
}

export const Collapsed: Story = {
  decorators: [withLiveStore({ collapsed: true, boot: seedQueueData })],
  render: () => <TaskQueuePanel />,
}

export const HiddenUntilTwoProjectsPlaced: Story = {
  decorators: [withLiveStore({ collapsed: false, boot: seedSinglePlacedProject })],
  render: () => (
    <div className='p-4 text-sm text-[#5f4a36]'>
      Task queue is hidden because only one project is placed on the map.
      <TaskQueuePanel />
    </div>
  ),
}
