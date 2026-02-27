import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LiveStoreProvider } from '../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { schema, events } from '@lifebuild/shared/schema'
import { TaskList } from './TaskList.js'

const PROJECT_ID = 'task-list-project'

const withLiveStore =
  (boot?: (store: Store) => void) =>
  (Story: React.ComponentType): React.ReactElement => (
    <LiveStoreProvider
      schema={schema}
      adapter={makeInMemoryAdapter()}
      batchUpdates={batchUpdates}
      boot={store => {
        store.commit(
          events.projectCreated({
            id: PROJECT_ID,
            name: 'Story Project',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            actorId: 'storybook',
          })
        )
        boot?.(store)
      }}
    >
      <div className='w-[600px] h-[500px]'>
        <Story />
      </div>
    </LiveStoreProvider>
  )

const seedTasks = (store: Store) => {
  const tasks = [
    { id: 'task-1', title: 'Gather requirements', status: 'todo' as const },
    { id: 'task-2', title: 'Design prototype', status: 'doing' as const },
    { id: 'task-3', title: 'Review documentation', status: 'in_review' as const },
    { id: 'task-4', title: 'Deploy initial version', status: 'done' as const },
    { id: 'task-5', title: 'Write test cases', status: 'todo' as const },
  ]

  tasks.forEach((task, i) => {
    store.commit(
      events.taskCreatedV2({
        id: task.id,
        projectId: PROJECT_ID,
        title: task.title,
        status: task.status,
        position: (i + 1) * 1000,
        createdAt: new Date('2024-01-02T00:00:00Z'),
        actorId: 'storybook',
      })
    )
  })
}

const seedManyTasks = (store: Store) => {
  const statuses = ['todo', 'doing', 'in_review', 'done'] as const
  for (let i = 0; i < 20; i++) {
    store.commit(
      events.taskCreatedV2({
        id: `task-${i + 1}`,
        projectId: PROJECT_ID,
        title: `Task ${i + 1}`,
        status: statuses[i % statuses.length]!,
        position: (i + 1) * 1000,
        createdAt: new Date('2024-01-02T00:00:00Z'),
        actorId: 'storybook',
      })
    )
  }
}

const meta: Meta = {
  title: 'Project Room/TaskList',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Task list for project views. Displays tasks as rows with click-to-cycle status indicators and inline task creation.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

export const Default: Story = {
  decorators: [withLiveStore(seedTasks)],
  render: () => (
    <TaskList
      tasks={[]}
      projectId={PROJECT_ID}
      onTaskClick={id => console.log('Task clicked:', id)}
    />
  ),
}

export const Empty: Story = {
  decorators: [withLiveStore()],
  render: () => (
    <TaskList
      tasks={[]}
      projectId={PROJECT_ID}
      onTaskClick={id => console.log('Task clicked:', id)}
    />
  ),
}

export const ManyTasks: Story = {
  decorators: [withLiveStore(seedManyTasks)],
  render: () => (
    <TaskList
      tasks={[]}
      projectId={PROJECT_ID}
      onTaskClick={id => console.log('Task clicked:', id)}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Task list with 20 tasks showing scrollable behavior.',
      },
    },
  },
}
