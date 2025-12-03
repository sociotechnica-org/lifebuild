import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LiveStoreProvider, useQuery } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@work-squared/shared/schema'
import { getProjects$, getAllTasks$, getTableBronzeStack$ } from '@work-squared/shared/queries'
import { BronzePanel } from './BronzePanel.js'
import './sorting-room.css'

/**
 * Helper component that fetches data from LiveStore and renders BronzePanel
 */
const BronzePanelHelper: React.FC = () => {
  const allProjects = useQuery(getProjects$) ?? []
  const allTasks = useQuery(getAllTasks$) ?? []
  const bronzeStack = useQuery(getTableBronzeStack$) ?? []

  // Get tabled task IDs
  const tabledTaskIds = new Set(bronzeStack.map(entry => entry.taskId))

  // Filter to bronze-eligible tasks (orphaned or from bronze projects)
  const bronzeTasks = allTasks.filter(t => {
    if (t.archivedAt !== null || t.status === 'done') return false
    // Orphaned tasks
    if (!t.projectId) return true
    // Tasks from any active project (simplified for storybook)
    const project = allProjects.find(p => p.id === t.projectId)
    return !!project
  })

  // Split into tabled vs available
  const availableTasks = bronzeTasks.filter(t => !tabledTaskIds.has(t.id))

  return (
    <div style={{ width: '600px', padding: '1rem', background: 'var(--cream, #f5f0e8)' }}>
      <BronzePanel
        tabledStack={bronzeStack}
        availableTasks={availableTasks}
        allTasks={allTasks}
        allProjects={allProjects}
        onAddToTable={taskId => console.log('Add to table:', taskId)}
        onRemoveFromTable={entryId => console.log('Remove from table:', entryId)}
        onReorder={entries => console.log('Reorder:', entries)}
        onQuickAddTask={async title => console.log('Quick add:', title)}
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
  stream: 'gold' | 'silver' | 'bronze' = 'bronze'
) => {
  store.commit(
    events.projectCreatedV2({
      id,
      name,
      description: `A ${stream} stream project`,
      category,
      lifecycleState: {
        status: 'active',
        stream,
        stage: 4,
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

// Note: Table configuration is initialized automatically when needed.
// We don't need to seed it for the BronzePanel stories.

let bronzePosition = 0
const seedBronzeStackEntry = (store: Store, entryId: string, taskId: string) => {
  bronzePosition += 1000
  store.commit(
    events.bronzeTaskAdded({
      id: entryId,
      taskId,
      position: bronzePosition,
      insertedAt: new Date(),
      actorId: 'storybook',
    })
  )
}

// Setup functions for different scenarios
const emptySetup = (_store: Store) => {
  // Empty setup - no tasks
}

const withTabledTasksSetup = (store: Store) => {
  // Create a bronze project
  seedProject(store, 'proj-bronze', 'Monarch re-balancing', 'finances', 'bronze')

  // Create tasks
  seedTask(store, 'task-1', 'Hook up 401k', 'proj-bronze')
  seedTask(store, 'task-2', 'Balance budgets from January', 'proj-bronze')
  seedTask(store, 'task-3', 'Re-fresh PayPal', 'proj-bronze')
  seedTask(store, 'task-4', 'Update budget spreadsheet', 'proj-bronze')

  // Add to bronze stack
  seedBronzeStackEntry(store, 'entry-1', 'task-1')
  seedBronzeStackEntry(store, 'entry-2', 'task-2')
  seedBronzeStackEntry(store, 'entry-3', 'task-3')
  seedBronzeStackEntry(store, 'entry-4', 'task-4')
}

const mixedSetup = (store: Store) => {
  // Create projects with different streams
  seedProject(store, 'proj-bronze', 'Monarch re-balancing', 'finances', 'bronze')
  seedProject(store, 'proj-gold', 'Major Initiative', 'growth', 'gold')
  seedProject(store, 'proj-silver', 'Side Project', 'relationships', 'silver')

  // Tasks from bronze project (tabled)
  seedTask(store, 'task-1', 'Hook up 401k', 'proj-bronze')
  seedTask(store, 'task-2', 'Balance budgets', 'proj-bronze')

  // Tasks from gold project (available)
  seedTask(store, 'task-3', 'Finalize proposal', 'proj-gold', 'doing')
  seedTask(store, 'task-4', 'Review contracts', 'proj-gold')

  // Tasks from silver project (available)
  seedTask(store, 'task-5', 'Schedule dinner', 'proj-silver')

  // Orphaned tasks (quick tasks)
  seedTask(store, 'task-6', 'Call the dentist', undefined)
  seedTask(store, 'task-7', 'Pick up dry cleaning', undefined)

  // Add some to bronze stack
  seedBronzeStackEntry(store, 'entry-1', 'task-1')
  seedBronzeStackEntry(store, 'entry-2', 'task-2')
  seedBronzeStackEntry(store, 'entry-3', 'task-6')
}

const withStatusesSetup = (store: Store) => {
  // Create projects
  seedProject(store, 'proj-bronze', 'Finance Tasks', 'finances', 'bronze')
  seedProject(store, 'proj-gold', 'Major Project', 'growth', 'gold')

  // Tasks with various statuses
  seedTask(store, 'task-1', 'Review bank statements', 'proj-bronze', 'doing')
  seedTask(store, 'task-2', 'Update spreadsheet', 'proj-bronze', 'in_review')
  seedTask(store, 'task-3', 'File taxes', 'proj-bronze', 'todo')
  seedTask(store, 'task-4', 'Write report', 'proj-gold', 'doing')
  seedTask(store, 'task-5', 'Send email', undefined, 'todo')

  // Add to stack
  seedBronzeStackEntry(store, 'entry-1', 'task-1')
  seedBronzeStackEntry(store, 'entry-2', 'task-2')
  seedBronzeStackEntry(store, 'entry-3', 'task-3')
}

const meta: Meta<typeof BronzePanelHelper> = {
  title: 'New UI/Sorting Room/BronzePanel',
  component: BronzePanelHelper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Bronze task queue panel showing tabled tasks with drag-and-drop reordering and available tasks pool. Supports quick task entry for orphaned tasks.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Empty state with no tasks
 */
export const Empty: Story = {
  decorators: [withLiveStore(emptySetup)],
  parameters: {
    docs: {
      description: {
        story: 'Shows the empty state when no bronze tasks exist.',
      },
    },
  },
}

/**
 * With tabled tasks from a single bronze project
 */
export const WithTabledTasks: Story = {
  decorators: [withLiveStore(withTabledTasksSetup)],
  parameters: {
    docs: {
      description: {
        story:
          'Shows multiple tabled tasks from a bronze project. Tasks can be reordered by dragging.',
      },
    },
  },
}

/**
 * Mixed tasks from different streams and orphaned tasks
 */
export const MixedSources: Story = {
  decorators: [withLiveStore(mixedSetup)],
  parameters: {
    docs: {
      description: {
        story:
          'Shows tasks from multiple sources: bronze project tasks on table, gold/silver project tasks in available, and orphaned quick tasks.',
      },
    },
  },
}

/**
 * Tasks with various statuses (doing, in_review)
 */
export const WithStatuses: Story = {
  decorators: [withLiveStore(withStatusesSetup)],
  parameters: {
    docs: {
      description: {
        story: 'Shows tasks with different statuses displayed as badges (doing, in review).',
      },
    },
  },
}
