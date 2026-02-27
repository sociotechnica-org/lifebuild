import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LiveStoreProvider, useQuery } from '../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@lifebuild/shared/schema'
import { resolveLifecycleState } from '@lifebuild/shared'
import { getProjects$, getAllTasks$ } from '@lifebuild/shared/queries'
import { BronzePanel } from './BronzePanel.js'

const BronzePanelHelper: React.FC = () => {
  const allProjects = useQuery(getProjects$) ?? []
  const allTasks = useQuery(getAllTasks$) ?? []

  const bronzeProjects = allProjects.filter(project => {
    const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)
    return lifecycle.stream === 'bronze'
  })

  const activeProjects = bronzeProjects.filter(project => {
    const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)
    return lifecycle.status === 'active'
  })

  const backlogProjects = bronzeProjects.filter(project => {
    const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)
    return lifecycle.status === 'backlog' && lifecycle.stage === 4
  })

  return (
    <div style={{ width: '640px', padding: '1rem', background: '#faf9f7' }}>
      <BronzePanel
        activeProjects={activeProjects}
        backlogProjects={backlogProjects}
        allTasks={allTasks}
        onActivate={project => console.log('Activate:', project.id)}
        onMoveToBacklog={project => console.log('Move to backlog:', project.id)}
        onQuickAddProject={async name => console.log('Quick add:', name)}
      />
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
  status: 'backlog' | 'active' = 'backlog',
  description?: string
) => {
  store.commit(
    events.projectCreatedV2({
      id,
      name,
      description: description ?? 'A bronze stream project',
      category,
      lifecycleState: {
        status,
        stream: 'bronze',
        stage: 4,
        archetype: 'quicktask',
        scale: 'micro',
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
  // Empty setup
}

const withActiveAndBacklogSetup = (store: Store) => {
  seedProject(store, 'proj-1', 'Monarch re-balancing', 'finances', 'active')
  seedProject(store, 'proj-2', 'Fix leaky faucet', 'home', 'active')
  seedProject(store, 'proj-3', 'Schedule annual checkup', 'health', 'backlog')
  seedProject(store, 'proj-4', 'Organize garage', 'home', 'backlog')

  seedTask(store, 'task-1', 'Hook up 401k', 'proj-1', 'doing')
  seedTask(store, 'task-2', 'Balance budgets', 'proj-1', 'done')
  seedTask(store, 'task-3', 'Buy replacement parts', 'proj-2')
  seedTask(store, 'task-4', 'Call doctor office', 'proj-3')
}

const withProgressSetup = (store: Store) => {
  seedProject(store, 'proj-1', 'Project at 50%', 'finances', 'active')
  seedProject(store, 'proj-2', 'Project at 75%', 'home', 'active')
  seedProject(store, 'proj-3', 'Project at 0%', 'health', 'backlog')
  seedProject(store, 'proj-4', 'No tasks yet', 'growth', 'backlog')

  seedTask(store, 'task-1', 'Task 1', 'proj-1', 'done')
  seedTask(store, 'task-2', 'Task 2', 'proj-1', 'done')
  seedTask(store, 'task-3', 'Task 3', 'proj-1')
  seedTask(store, 'task-4', 'Task 4', 'proj-1')

  seedTask(store, 'task-5', 'Task A', 'proj-2', 'done')
  seedTask(store, 'task-6', 'Task B', 'proj-2', 'done')
  seedTask(store, 'task-7', 'Task C', 'proj-2', 'done')
  seedTask(store, 'task-8', 'Task D', 'proj-2')

  seedTask(store, 'task-9', 'Task X', 'proj-3')
  seedTask(store, 'task-10', 'Task Y', 'proj-3')
}

const meta: Meta<typeof BronzePanelHelper> = {
  title: 'Sorting Room/BronzePanel',
  component: BronzePanelHelper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Bronze stream panel showing lifecycle-driven Active and Backlog project lists with quick-add support.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  decorators: [withLiveStore(emptySetup)],
}

export const ActiveAndBacklog: Story = {
  decorators: [withLiveStore(withActiveAndBacklogSetup)],
}

export const WithProgress: Story = {
  decorators: [withLiveStore(withProgressSetup)],
}
