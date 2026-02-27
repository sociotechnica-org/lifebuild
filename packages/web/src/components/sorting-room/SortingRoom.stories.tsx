import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LiveStoreProvider, useQuery } from '../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@lifebuild/shared/schema'
import { resolveLifecycleState } from '@lifebuild/shared'
import { getProjects$ } from '@lifebuild/shared/queries'
import { SortingRoom } from './SortingRoom.js'

const DebugInfo: React.FC = () => {
  const projects = useQuery(getProjects$) ?? []

  const counts = projects.reduce(
    (acc, project) => {
      const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)
      const stream = lifecycle.stream ?? 'bronze'
      if (lifecycle.status === 'active') {
        acc.active[stream] += 1
      }
      if (lifecycle.status === 'backlog' && lifecycle.stage === 4) {
        acc.backlog[stream] += 1
      }
      return acc
    },
    {
      active: { gold: 0, silver: 0, bronze: 0 },
      backlog: { gold: 0, silver: 0, bronze: 0 },
    }
  )

  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '1rem',
        background: '#f0f0f0',
        fontSize: '0.75rem',
        fontFamily: 'monospace',
      }}
    >
      <div>
        <strong>Debug Info:</strong>
      </div>
      <div>Projects: {projects.length}</div>
      <div>
        Active: G{counts.active.gold} / S{counts.active.silver} / B{counts.active.bronze}
      </div>
      <div>
        Backlog: G{counts.backlog.gold} / S{counts.backlog.silver} / B{counts.backlog.bronze}
      </div>
    </div>
  )
}

const SortingRoomHelper: React.FC<{ showDebug?: boolean }> = ({ showDebug = false }) => {
  return (
    <div style={{ width: '900px', padding: '1rem', background: '#faf9f7' }}>
      <SortingRoom />
      {showDebug && <DebugInfo />}
    </div>
  )
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

type ProjectCategory =
  | 'health'
  | 'relationships'
  | 'finances'
  | 'growth'
  | 'leisure'
  | 'spirituality'
  | 'home'
  | 'contribution'

const seedProject = (
  store: Store,
  id: string,
  name: string,
  category: ProjectCategory,
  stream: 'gold' | 'silver' | 'bronze',
  status: 'backlog' | 'active' | 'completed' = 'backlog',
  queuePosition?: number
) => {
  store.commit(
    events.projectCreatedV2({
      id,
      name,
      description: `A ${stream} stream project`,
      category,
      lifecycleState: {
        status,
        stream,
        stage: 4,
        queuePosition,
        archetype:
          stream === 'bronze' ? 'quicktask' : stream === 'gold' ? 'initiative' : 'systembuild',
        scale: stream === 'bronze' ? 'micro' : 'major',
      },
      createdAt: new Date(),
      actorId: 'storybook',
    })
  )
}

const seedTask = (
  store: Store,
  id: string,
  title: string,
  projectId: string,
  status: 'todo' | 'doing' | 'in_review' | 'done' = 'todo'
) => {
  store.commit(
    events.taskCreatedV2({
      id,
      projectId,
      title,
      description: undefined,
      status,
      assigneeIds: undefined,
      attributes: undefined,
      position: 1,
      createdAt: new Date(),
      actorId: 'storybook',
    })
  )
}

const emptySetup = (_store: Store) => {
  // Empty state
}

const withBronzeActiveSetup = (store: Store) => {
  seedProject(store, 'bronze-1', 'Monarch re-balancing', 'finances', 'bronze', 'active')
  seedProject(store, 'bronze-2', 'Fix leaky faucet', 'home', 'bronze', 'active')
  seedProject(store, 'bronze-3', 'Schedule annual checkup', 'health', 'bronze', 'backlog', 1)

  seedTask(store, 'task-1', 'Hook up 401k', 'bronze-1', 'doing')
  seedTask(store, 'task-2', 'Balance budgets', 'bronze-1', 'done')
  seedTask(store, 'task-3', 'Buy replacement parts', 'bronze-2', 'todo')
}

const fullSetup = (store: Store) => {
  seedProject(store, 'gold-active', 'Launch New Product', 'growth', 'gold', 'active')
  seedProject(store, 'gold-backlog', 'Strategic Initiative', 'finances', 'gold', 'backlog', 1)

  seedProject(store, 'silver-active', 'Optimize CI Pipeline', 'growth', 'silver', 'active')
  seedProject(store, 'silver-backlog', 'Process Improvement', 'home', 'silver', 'backlog', 1)

  seedProject(store, 'bronze-active', 'Fix bug in login', 'growth', 'bronze', 'active')
  seedProject(store, 'bronze-backlog-1', 'Update documentation', 'growth', 'bronze', 'backlog', 1)
  seedProject(store, 'bronze-backlog-2', 'Review PR feedback', 'growth', 'bronze', 'backlog', 2)

  seedTask(store, 'g-task-1', 'Market research', 'gold-active', 'done')
  seedTask(store, 'g-task-2', 'Build prototype', 'gold-active', 'doing')
  seedTask(store, 's-task-1', 'Audit current pipeline', 'silver-active', 'done')
  seedTask(store, 'b-task-1', 'Debug login flow', 'bronze-active', 'todo')
}

const meta: Meta<typeof SortingRoomHelper> = {
  title: 'Sorting Room/SortingRoom',
  component: SortingRoomHelper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Sorting Room displays stream summary cards and expanded Active/Backlog lists driven by lifecycle status.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: { showDebug: true },
  decorators: [withLiveStore(emptySetup)],
}

export const WithBronzeActive: Story = {
  args: { showDebug: true },
  decorators: [withLiveStore(withBronzeActiveSetup)],
}

export const FullSetup: Story = {
  args: { showDebug: true },
  decorators: [withLiveStore(fullSetup)],
}
