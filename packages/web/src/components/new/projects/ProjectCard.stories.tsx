import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LiveStoreProvider, useQuery } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@work-squared/shared/schema'
import { getProjects$ } from '@work-squared/shared/queries'
import { DEFAULT_MODEL_STRING } from '@work-squared/shared'
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
        draftingData: { summary: 'Scoping work', lastEditedAt: createdAt.getTime() },
      },
      attributes: { status: 'planning', planningStage: 2, objectives: 'Frame the MVP' },
      createdAt,
      actorId: 'storybook',
    })
  )
  seedTasks(store, 'project-planning', ['t1', 't2', 't3'], ['todo', 'doing', 'done'])
  seedWorkers(store, 'project-planning', 2)
}

const plansSetup = (store: Store) => {
  const createdAt = new Date('2024-02-03T00:00:00Z')
  store.commit(
    events.projectCreatedV2({
      id: 'project-plans',
      name: 'Gold Stream Contenders',
      description: 'Shortlist of projects queued for Gold.',
      category: 'finances',
      lifecycleState: { status: 'plans', stream: 'gold', queuePosition: 1 },
      attributes: { status: 'backlog', priority: 1 },
      createdAt,
      actorId: 'storybook',
    })
  )
  seedTasks(store, 'project-plans', ['p1', 'p2'], ['todo', 'todo'])
  seedWorkers(store, 'project-plans', 3)
}

const workAtHandSetup = (store: Store) => {
  const createdAt = new Date('2024-02-05T00:00:00Z')
  store.commit(
    events.projectCreatedV2({
      id: 'project-active',
      name: 'Execution in Motion',
      description: 'Actively working in the Gold slot.',
      category: 'health',
      lifecycleState: {
        status: 'work_at_hand',
        slot: 'gold',
        activatedAt: createdAt.getTime(),
      },
      attributes: { status: 'active', activatedAt: createdAt.getTime() },
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

const pausedSetup = (store: Store) => {
  const createdAt = new Date('2024-02-06T00:00:00Z')
  store.commit(
    events.projectCreatedV2({
      id: 'project-paused',
      name: 'Waiting on Review',
      description: 'Paused while feedback lands.',
      category: 'relationships',
      lifecycleState: { status: 'paused', stream: 'silver', pausedReason: 'Awaiting approvals' },
      attributes: { status: 'backlog', priority: 3, lastActivityAt: createdAt.getTime() },
      createdAt,
      actorId: 'storybook',
    })
  )
  seedTasks(store, 'project-paused', ['s1', 's2'], ['todo', 'todo'])
  seedWorkers(store, 'project-paused', 1)
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

export const PlansStream: Story = {
  args: { projectId: 'project-plans' },
  decorators: [withLiveStore(plansSetup)],
}

export const WorkAtHand: Story = {
  args: { projectId: 'project-active' },
  decorators: [withLiveStore(workAtHandSetup)],
}

export const Paused: Story = {
  args: { projectId: 'project-paused' },
  decorators: [withLiveStore(pausedSetup)],
}
