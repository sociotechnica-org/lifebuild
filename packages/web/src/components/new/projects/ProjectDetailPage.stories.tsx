import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { LiveStoreProvider } from '../../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { schema, events } from '@lifebuild/shared/schema'
import { ProjectDetailPage } from './ProjectDetailPage.js'
import { ROOM_CHAT_OVERRIDE_STORAGE_KEY } from '../../../constants/featureFlags.js'

type TaskSeed = {
  id: string
  title: string
  status?: 'todo' | 'doing' | 'in_review' | 'done'
  assigneeIds?: string[]
  description?: string
  commentCount?: number
}

const withProjectProviders =
  (projectId: string, boot?: (store: Store) => void) =>
  (Story: React.ComponentType): React.ReactElement => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', `/new/projects/${projectId}`)
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
        <Routes>
          <Route path='/new/projects/:projectId' element={<Story />} />
        </Routes>
      </LiveStoreProvider>
    )
  }

const withRoomChatEnabled = (Story: React.ComponentType): React.ReactElement => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ROOM_CHAT_OVERRIDE_STORAGE_KEY, 'true')
  }

  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(ROOM_CHAT_OVERRIDE_STORAGE_KEY)
      }
    }
  }, [])

  return <Story />
}

const seedUsers = (store: Store) => {
  const now = new Date('2024-01-01T00:00:00Z')
  const users = [
    { id: 'user-1', name: 'Alice Adams', email: 'alice@example.com' },
    { id: 'user-2', name: 'Brandon Brooks', email: 'brandon@example.com' },
    { id: 'user-3', name: 'Casey Chen', email: 'casey@example.com' },
  ]

  users.forEach(user => {
    store.commit(
      events.userSynced({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: undefined,
        isAdmin: false,
        syncedAt: now,
      })
    )
  })
}

const seedProject = (store: Store, projectId: string, name: string, description?: string) => {
  store.commit(
    events.projectCreated({
      id: projectId,
      name,
      description,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      actorId: 'storybook',
    })
  )
}

const makeTaskSeeder = (store: Store, projectId: string) => {
  let positionCounter = 1
  return (task: TaskSeed) => {
    store.commit(
      events.taskCreatedV2({
        id: task.id,
        projectId,
        title: task.title,
        description: task.description,
        status: task.status ?? 'todo',
        assigneeIds: task.assigneeIds,
        attributes: undefined,
        position: positionCounter++,
        createdAt: new Date('2024-01-02T00:00:00Z'),
        actorId: 'storybook',
      })
    )

    if (task.commentCount && task.commentCount > 0) {
      for (let i = 0; i < task.commentCount; i += 1) {
        store.commit(
          events.commentAdded({
            id: `${task.id}-comment-${i + 1}`,
            taskId: task.id,
            authorId: task.assigneeIds?.[0] ?? 'user-1',
            content: `Comment ${i + 1} on ${task.title}`,
            createdAt: new Date('2024-01-03T00:00:00Z'),
            actorId: 'storybook',
          })
        )
      }
    }
  }
}

const meta: Meta<typeof ProjectDetailPage> = {
  title: 'New UI/Projects/ProjectDetailPage',
  component: ProjectDetailPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Project detail page with a kanban board for task management. Features drag-and-drop between columns, inline task creation in To Do, and a task detail modal for editing.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const defaultSetup = (store: Store) => {
  const projectId = 'project-default'
  seedUsers(store)
  seedProject(store, projectId, 'New UI Foundation', 'Baseline project used by the new UI.')
  const addTask = makeTaskSeeder(store, projectId)

  addTask({
    id: 'task-1',
    title: 'Gather project requirements',
    status: 'todo',
    assigneeIds: ['user-1'],
    description: 'Document the initial requirements for the redesign.',
    commentCount: 2,
  })
  addTask({
    id: 'task-2',
    title: 'Define routing plan',
    status: 'doing',
    assigneeIds: ['user-2', 'user-3'],
    description: 'List new routes and data requirements.',
  })
  addTask({
    id: 'task-3',
    title: 'Implement LiveStore queries',
    status: 'in_review',
    assigneeIds: ['user-1'],
    commentCount: 1,
  })
  addTask({
    id: 'task-4',
    title: 'Document new UI directory structure',
    status: 'done',
    assigneeIds: [],
  })
  addTask({
    id: 'task-5',
    title: 'Plan Storybook coverage',
    status: 'todo',
    assigneeIds: ['user-3'],
  })
}

const emptyProjectSetup = (store: Store) => {
  seedUsers(store)
  seedProject(store, 'project-empty', 'Empty Project', 'No tasks seeded yet.')
}

const singleTaskSetup = (store: Store) => {
  const projectId = 'project-single-task'
  seedUsers(store)
  seedProject(store, projectId, 'Single Task Project', 'Contains exactly one task.')
  const addTask = makeTaskSeeder(store, projectId)

  addTask({
    id: 'task-lone',
    title: 'Stand-alone task',
    status: 'doing',
    assigneeIds: ['user-2'],
    description: 'Simple example task with both description and comments.',
    commentCount: 3,
  })
}

const manyTasksSetup = (store: Store) => {
  const projectId = 'project-many'
  seedUsers(store)
  seedProject(store, projectId, 'Many Tasks Project', 'Used to visualize longer lists.')
  const addTask = makeTaskSeeder(store, projectId)
  const statuses: TaskSeed['status'][] = ['todo', 'doing', 'in_review', 'done']

  for (let i = 0; i < 20; i += 1) {
    addTask({
      id: `task-${i + 1}`,
      title: `Task ${i + 1}`,
      status: statuses[i % statuses.length],
      assigneeIds: i % 3 === 0 ? ['user-1', 'user-3'] : ['user-2'],
      commentCount: i % 4 === 0 ? 1 : 0,
    })
  }
}

export const Default: Story = {
  decorators: [withProjectProviders('project-default', defaultSetup)],
}

export const EmptyState: Story = {
  decorators: [withProjectProviders('project-empty', emptyProjectSetup)],
}

export const SingleTask: Story = {
  decorators: [withProjectProviders('project-single-task', singleTaskSetup)],
}

export const ManyTasks: Story = {
  decorators: [withProjectProviders('project-many', manyTasksSetup)],
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how the page handles projects with large task counts.',
      },
    },
  },
}

export const ChatEnabled: Story = {
  decorators: [withRoomChatEnabled, withProjectProviders('project-default', defaultSetup)],
  parameters: {
    docs: {
      description: {
        story:
          'Enables the room chat override so the project guide sidebar is visible without setting env flags.',
      },
    },
  },
}
