import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LiveStoreProvider, useQuery } from '../../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@lifebuild/shared/schema'
import { getProjects$ } from '@lifebuild/shared/queries'
import { DEFAULT_MODEL_STRING } from '@lifebuild/shared'
import { ProjectCard } from './ProjectCard.js'

const ProjectCardHelper: React.FC<{ projectId: string }> = ({ projectId }) => {
  const projects = useQuery(getProjects$) ?? []
  const project = projects.find(p => p.id === projectId)

  if (!project) return <div className='text-slate-500'>Project not found</div>
  return <ProjectCard project={project} />
}

const withLiveStore = (boot: (store: Store) => void) => (Story: React.ComponentType) => (
  <LiveStoreProvider
    schema={schema}
    adapter={makeInMemoryAdapter()}
    batchUpdates={batchUpdates}
    boot={store => boot(store)}
  >
    <Story />
  </LiveStoreProvider>
)

const seedWorkers = (store: Store, projectId: string, count = 2) => {
  const createdAt = new Date('2024-02-01T00:00:00Z')
  for (let i = 0; i < count; i += 1) {
    const workerId = `worker-${projectId}-${i + 1}`
    store.commit(
      events.workerCreated({
        id: workerId,
        name: `Worker ${i + 1}`,
        avatar: i === 0 ? '🛠️' : i === 1 ? '🧭' : '✨',
        systemPrompt: 'You are a helpful teammate.',
        defaultModel: DEFAULT_MODEL_STRING,
        roleDescription: undefined,
        createdAt,
        actorId: 'storybook',
      })
    )
    store.commit(
      events.workerAssignedToProject({
        workerId,
        projectId,
        assignedAt: createdAt,
        actorId: 'storybook',
      })
    )
  }
}

const seedTasks = (
  store: Store,
  projectId: string,
  ids: string[],
  statuses: Array<'todo' | 'doing' | 'in_review' | 'done'>
) => {
  const createdAt = new Date('2024-02-02T00:00:00Z')
  ids.forEach((id, index) => {
    store.commit(
      events.taskCreatedV2({
        id,
        projectId,
        title: `Task ${index + 1}`,
        description: index % 2 === 0 ? 'Storybook seeded task' : undefined,
        status: statuses[index] ?? 'todo',
        assigneeIds: index % 2 === 0 ? [`worker-${projectId}-1`] : undefined,
        attributes: undefined,
        position: index + 1,
        createdAt,
        actorId: 'storybook',
      })
    )
  })
}

const planningSetup = (store: Store) => {
  const createdAt = new Date('2024-02-01T00:00:00Z')
  store.commit(
    events.projectCreatedV2({
      id: 'project-planning',
      name: 'Drafting Proposal',
      description: 'Working through the early planning stages.',
      category: 'growth',
      lifecycleState: {
        status: 'planning',
        stage: 2,
        objectives: 'Scoping work',
      },
      createdAt,
      actorId: 'storybook',
    })
  )
  seedTasks(store, 'project-planning', ['t1', 't2', 't3'], ['todo', 'doing', 'done'])
  seedWorkers(store, 'project-planning', 2)
}

const backlogSetup = (store: Store) => {
  const createdAt = new Date('2024-02-03T00:00:00Z')
  store.commit(
    events.projectCreatedV2({
      id: 'project-backlog',
      name: 'Gold Stream Contenders',
      description: 'Shortlist of projects queued for Gold.',
      category: 'finances',
      lifecycleState: {
        status: 'backlog',
        stage: 4,
        stream: 'gold',
        queuePosition: 1,
      },
      createdAt,
      actorId: 'storybook',
    })
  )
  seedTasks(store, 'project-backlog', ['p1', 'p2'], ['todo', 'todo'])
  seedWorkers(store, 'project-backlog', 3)
}

const activeSetup = (store: Store) => {
  const createdAt = new Date('2024-02-05T00:00:00Z')
  store.commit(
    events.projectCreatedV2({
      id: 'project-active',
      name: 'Execution in Motion',
      description: 'Actively working in the Gold slot.',
      category: 'health',
      lifecycleState: {
        status: 'active',
        stage: 4, // Preserve stage from planning
        slot: 'gold',
        activatedAt: createdAt.getTime(),
      },
      createdAt,
      actorId: 'storybook',
    })
  )
  seedTasks(
    store,
    'project-active',
    ['a1', 'a2', 'a3', 'a4'],
    ['doing', 'doing', 'in_review', 'done']
  )
  seedWorkers(store, 'project-active', 4)
}

const completedSetup = (store: Store) => {
  const createdAt = new Date('2024-02-06T00:00:00Z')
  store.commit(
    events.projectCreatedV2({
      id: 'project-completed',
      name: 'Finished Project',
      description: 'A completed project.',
      category: 'relationships',
      lifecycleState: {
        status: 'completed',
        stage: 4, // Preserve stage from planning
        completedAt: createdAt.getTime(),
      },
      createdAt,
      actorId: 'storybook',
    })
  )
  seedTasks(store, 'project-completed', ['s1', 's2'], ['done', 'done'])
  seedWorkers(store, 'project-completed', 1)
}

const meta: Meta<typeof ProjectCardHelper> = {
  title: 'New UI/Projects/ProjectCard',
  component: ProjectCardHelper,
  args: {
    projectId: 'project-planning',
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Lifecycle-aware ProjectCard showing Urushi visual cues and task/worker summaries for the new UI.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Planning: Story = {
  args: { projectId: 'project-planning' },
  decorators: [withLiveStore(planningSetup)],
}

export const Backlog: Story = {
  args: { projectId: 'project-backlog' },
  decorators: [withLiveStore(backlogSetup)],
}

export const Active: Story = {
  args: { projectId: 'project-active' },
  decorators: [withLiveStore(activeSetup)],
}

export const Completed: Story = {
  args: { projectId: 'project-completed' },
  decorators: [withLiveStore(completedSetup)],
}
