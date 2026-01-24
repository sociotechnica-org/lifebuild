import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LiveStoreProvider, useQuery } from '../../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@lifebuild/shared/schema'
import { getProjects$, getAllTasks$, getTableBronzeProjects$ } from '@lifebuild/shared/queries'
import { BronzePanel } from './BronzePanel.js'

/**
 * Helper component that fetches data from LiveStore and renders BronzePanel
 */
const BronzePanelHelper: React.FC = () => {
  const allProjects = useQuery(getProjects$) ?? []
  const allTasks = useQuery(getAllTasks$) ?? []
  const bronzeProjects = useQuery(getTableBronzeProjects$) ?? []

  // Get tabled project IDs
  const tabledProjectIds = new Set(bronzeProjects.map(entry => entry.projectId))

  // Filter to bronze-eligible projects (backlog bronze-stream projects)
  const availableProjects = allProjects.filter(p => {
    if (tabledProjectIds.has(p.id)) return false
    const lifecycleState = p.projectLifecycleState as { stream?: string; status?: string } | null
    return lifecycleState?.stream === 'bronze' && lifecycleState?.status === 'backlog'
  })

  return (
    <div style={{ width: '600px', padding: '1rem', background: '#faf9f7' }}>
      <BronzePanel
        tabledProjects={bronzeProjects}
        availableProjects={availableProjects}
        allTasks={allTasks}
        allProjects={allProjects}
        onAddToTable={projectId => console.log('Add to table:', projectId)}
        onRemoveFromTable={entryId => console.log('Remove from table:', entryId)}
        onReorder={entries => console.log('Reorder:', entries)}
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

// Seed helpers
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
  stream: 'gold' | 'silver' | 'bronze' = 'bronze',
  status: 'backlog' | 'active' = 'backlog',
  description?: string
) => {
  store.commit(
    events.projectCreatedV2({
      id,
      name,
      description: description ?? `A ${stream} stream project`,
      category,
      lifecycleState: {
        status,
        stream,
        stage: 4,
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
  projectId: string | undefined,
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

const seedBronzeProjectEntry = (
  store: Store,
  entryId: string,
  projectId: string,
  position: number
) => {
  store.commit(
    events.bronzeProjectTabled({
      id: entryId,
      projectId,
      position,
      tabledAt: new Date(),
      tabledBy: 'storybook',
    })
  )
}

// Setup functions for different scenarios
const emptySetup = (_store: Store) => {
  // Empty setup - no projects
}

const withTabledProjectsSetup = (store: Store) => {
  // Create bronze projects
  seedProject(
    store,
    'proj-1',
    'Monarch re-balancing',
    'finances',
    'bronze',
    'backlog',
    'Update all financial tracking'
  )
  seedProject(
    store,
    'proj-2',
    'Fix leaky faucet',
    'home',
    'bronze',
    'backlog',
    'Kitchen sink needs repair'
  )
  seedProject(store, 'proj-3', 'Schedule annual checkup', 'health', 'bronze', 'backlog')

  // Create tasks for projects (to show progress)
  seedTask(store, 'task-1', 'Hook up 401k', 'proj-1')
  seedTask(store, 'task-2', 'Balance budgets', 'proj-1', 'done')
  seedTask(store, 'task-3', 'Re-fresh PayPal', 'proj-1')
  seedTask(store, 'task-4', 'Buy replacement parts', 'proj-2')
  seedTask(store, 'task-5', 'Watch repair video', 'proj-2', 'done')
  seedTask(store, 'task-6', 'Call doctor office', 'proj-3')

  // Add projects to bronze table
  seedBronzeProjectEntry(store, 'entry-1', 'proj-1', 1000)
  seedBronzeProjectEntry(store, 'entry-2', 'proj-2', 2000)
  seedBronzeProjectEntry(store, 'entry-3', 'proj-3', 3000)
}

const mixedSetup = (store: Store) => {
  // Create tabled bronze projects
  seedProject(store, 'proj-1', 'Monarch re-balancing', 'finances', 'bronze', 'backlog')
  seedProject(store, 'proj-2', 'Fix leaky faucet', 'home', 'bronze', 'backlog')

  // Create backlog bronze projects (available)
  seedProject(store, 'proj-3', 'Organize garage', 'home', 'bronze', 'backlog')
  seedProject(store, 'proj-4', 'Update resume', 'growth', 'bronze', 'backlog')
  seedProject(store, 'proj-5', 'Plan weekend trip', 'leisure', 'bronze', 'backlog')

  // Add tasks for progress display
  seedTask(store, 'task-1', 'Hook up 401k', 'proj-1')
  seedTask(store, 'task-2', 'Balance budgets', 'proj-1', 'done')
  seedTask(store, 'task-3', 'Buy replacement parts', 'proj-2')
  seedTask(store, 'task-4', 'Sort tools', 'proj-3')
  seedTask(store, 'task-5', 'Update work experience', 'proj-4')
  seedTask(store, 'task-6', 'Research destinations', 'proj-5')
  seedTask(store, 'task-7', 'Book hotels', 'proj-5')
  seedTask(store, 'task-8', 'Pack bags', 'proj-5', 'done')

  // Add some to bronze table
  seedBronzeProjectEntry(store, 'entry-1', 'proj-1', 1000)
  seedBronzeProjectEntry(store, 'entry-2', 'proj-2', 2000)
}

const withProgressSetup = (store: Store) => {
  // Create projects with varying levels of completion
  seedProject(store, 'proj-1', 'Project at 50%', 'finances', 'bronze', 'backlog')
  seedProject(store, 'proj-2', 'Project at 75%', 'home', 'bronze', 'backlog')
  seedProject(store, 'proj-3', 'Project at 0%', 'health', 'bronze', 'backlog')
  seedProject(store, 'proj-4', 'No tasks yet', 'growth', 'bronze', 'backlog')

  // Tasks for proj-1 (50% - 2/4 done)
  seedTask(store, 'task-1', 'Task 1', 'proj-1', 'done')
  seedTask(store, 'task-2', 'Task 2', 'proj-1', 'done')
  seedTask(store, 'task-3', 'Task 3', 'proj-1')
  seedTask(store, 'task-4', 'Task 4', 'proj-1')

  // Tasks for proj-2 (75% - 3/4 done)
  seedTask(store, 'task-5', 'Task A', 'proj-2', 'done')
  seedTask(store, 'task-6', 'Task B', 'proj-2', 'done')
  seedTask(store, 'task-7', 'Task C', 'proj-2', 'done')
  seedTask(store, 'task-8', 'Task D', 'proj-2')

  // Tasks for proj-3 (0% - 0/3 done)
  seedTask(store, 'task-9', 'Task X', 'proj-3')
  seedTask(store, 'task-10', 'Task Y', 'proj-3')
  seedTask(store, 'task-11', 'Task Z', 'proj-3')

  // proj-4 has no tasks

  // Add all to bronze table
  seedBronzeProjectEntry(store, 'entry-1', 'proj-1', 1000)
  seedBronzeProjectEntry(store, 'entry-2', 'proj-2', 2000)
  seedBronzeProjectEntry(store, 'entry-3', 'proj-3', 3000)
  seedBronzeProjectEntry(store, 'entry-4', 'proj-4', 4000)
}

const onlyAvailableSetup = (store: Store) => {
  // Create only backlog bronze projects (none tabled)
  seedProject(store, 'proj-1', 'Organize garage', 'home', 'bronze', 'backlog')
  seedProject(store, 'proj-2', 'Update resume', 'growth', 'bronze', 'backlog')
  seedProject(store, 'proj-3', 'Plan weekend trip', 'leisure', 'bronze', 'backlog')

  // Add some tasks
  seedTask(store, 'task-1', 'Sort tools', 'proj-1')
  seedTask(store, 'task-2', 'Update work experience', 'proj-2')
  seedTask(store, 'task-3', 'Research destinations', 'proj-3')
}

const meta: Meta<typeof BronzePanelHelper> = {
  title: 'New UI/Sorting Room/BronzePanel',
  component: BronzePanelHelper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Bronze project queue panel showing tabled projects with drag-and-drop reordering and available projects pool. Each project card shows task count and completion progress. Supports quick project creation.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Empty state with no projects
 */
export const Empty: Story = {
  decorators: [withLiveStore(emptySetup)],
  parameters: {
    docs: {
      description: {
        story: 'Shows the empty state when no bronze projects exist.',
      },
    },
  },
}

/**
 * With tabled projects from various categories
 */
export const WithTabledProjects: Story = {
  decorators: [withLiveStore(withTabledProjectsSetup)],
  parameters: {
    docs: {
      description: {
        story:
          'Shows multiple tabled bronze projects. Projects can be reordered by dragging. Each project shows task completion progress.',
      },
    },
  },
}

/**
 * Mixed tabled and available projects
 */
export const MixedSources: Story = {
  decorators: [withLiveStore(mixedSetup)],
  parameters: {
    docs: {
      description: {
        story:
          'Shows both tabled projects and available backlog projects. Drag projects between sections to table or remove them.',
      },
    },
  },
}

/**
 * Projects with varying progress percentages
 */
export const WithProgress: Story = {
  decorators: [withLiveStore(withProgressSetup)],
  parameters: {
    docs: {
      description: {
        story: 'Shows projects with different completion percentages (0%, 50%, 75%, no tasks).',
      },
    },
  },
}

/**
 * Only available projects (none tabled yet)
 */
export const OnlyAvailable: Story = {
  decorators: [withLiveStore(onlyAvailableSetup)],
  parameters: {
    docs: {
      description: {
        story:
          'Shows available backlog projects with none tabled yet. The table section shows an empty state.',
      },
    },
  },
}
