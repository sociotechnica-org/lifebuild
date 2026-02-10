import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LiveStoreProvider } from '../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { schema, events } from '@lifebuild/shared/schema'
import { ProjectKanban } from './ProjectKanban.js'
import { useQuery } from '../../livestore-compat.js'
import { getProjectTasks$ } from '@lifebuild/shared/queries'

const PROJECT_ID = 'kanban-project'

// Wrapper component to query tasks from the store
function ProjectKanbanWithData({ projectId }: { projectId: string }) {
  const tasks = useQuery(getProjectTasks$(projectId)) ?? []
  return (
    <ProjectKanban
      tasks={tasks}
      projectId={projectId}
      onTaskClick={taskId => console.log('Task clicked:', taskId)}
    />
  )
}

const withKanbanProviders =
  (boot?: (store: Store) => void) =>
  (Story: React.ComponentType): React.ReactElement => {
    return (
      <LiveStoreProvider
        schema={schema}
        adapter={makeInMemoryAdapter()}
        batchUpdates={batchUpdates}
        boot={store => {
          boot?.(store)
        }}
      >
        <div className='bg-gray-100 min-h-screen'>
          <Story />
        </div>
      </LiveStoreProvider>
    )
  }

const seedProject = (store: Store) => {
  store.commit(
    events.projectCreatedV2({
      id: PROJECT_ID,
      name: 'Kanban Test Project',
      description: 'A project for testing the kanban board',
      category: 'growth',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      actorId: 'storybook',
    })
  )
}

const defaultSetup = (store: Store) => {
  seedProject(store)

  const tasks = [
    { id: 'task-1', title: 'Research user requirements', status: 'todo' as const },
    { id: 'task-2', title: 'Create wireframes', status: 'todo' as const },
    { id: 'task-3', title: 'Review design specs', status: 'todo' as const },
    { id: 'task-4', title: 'Implement authentication', status: 'doing' as const },
    { id: 'task-5', title: 'Write API tests', status: 'doing' as const },
    { id: 'task-6', title: 'Code review: login flow', status: 'in_review' as const },
    { id: 'task-7', title: 'Deploy to staging', status: 'done' as const },
    { id: 'task-8', title: 'Update documentation', status: 'done' as const },
  ]

  tasks.forEach((task, index) => {
    store.commit(
      events.taskCreatedV2({
        id: task.id,
        projectId: PROJECT_ID,
        title: task.title,
        description: undefined,
        status: task.status,
        assigneeIds: undefined,
        position: index * 1000,
        createdAt: new Date('2024-01-02T00:00:00Z'),
        actorId: 'storybook',
      })
    )
  })
}

const emptySetup = (store: Store) => {
  seedProject(store)
  // No tasks created
}

const manyTasksSetup = (store: Store) => {
  seedProject(store)

  const statuses = ['todo', 'doing', 'in_review', 'done'] as const

  for (let i = 0; i < 24; i++) {
    store.commit(
      events.taskCreatedV2({
        id: `task-${i + 1}`,
        projectId: PROJECT_ID,
        title: `Task ${i + 1}: ${['Research', 'Design', 'Implement', 'Test', 'Review', 'Deploy'][i % 6]} feature ${Math.floor(i / 6) + 1}`,
        description: undefined,
        status: statuses[i % 4],
        assigneeIds: undefined,
        position: i * 1000,
        createdAt: new Date('2024-01-02T00:00:00Z'),
        actorId: 'storybook',
      })
    )
  }
}

const meta: Meta<typeof ProjectKanbanWithData> = {
  title: 'Project Room/ProjectKanban',
  component: ProjectKanbanWithData,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A 4-column kanban board (To Do, Doing, In Review, Done) with drag-and-drop support and inline task creation in the To Do column.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    projectId: PROJECT_ID,
  },
  decorators: [withKanbanProviders(defaultSetup)],
  parameters: {
    docs: {
      description: {
        story: 'Default kanban board with tasks distributed across all columns.',
      },
    },
  },
}

export const Empty: Story = {
  args: {
    projectId: PROJECT_ID,
  },
  decorators: [withKanbanProviders(emptySetup)],
  parameters: {
    docs: {
      description: {
        story:
          'Empty kanban board with no tasks. Click "+ Add task" in the To Do column to create one.',
      },
    },
  },
}

export const ManyTasks: Story = {
  args: {
    projectId: PROJECT_ID,
  },
  decorators: [withKanbanProviders(manyTasksSetup)],
  parameters: {
    docs: {
      description: {
        story: 'Kanban board with many tasks to test scrolling and layout.',
      },
    },
  },
}
