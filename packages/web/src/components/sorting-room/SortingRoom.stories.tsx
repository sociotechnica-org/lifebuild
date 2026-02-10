import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LiveStoreProvider, useQuery } from '../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@lifebuild/shared/schema'
import {
  getProjects$,
  getTableBronzeProjects$,
  getTableConfiguration$,
} from '@lifebuild/shared/queries'
import { SortingRoom } from './SortingRoom.js'
import { useTableState } from '../../hooks/useTableState.js'

/**
 * Debug component that shows the internal state for troubleshooting
 */
const DebugInfo: React.FC = () => {
  const allProjects = useQuery(getProjects$) ?? []
  const bronzeProjectEntries = useQuery(getTableBronzeProjects$) ?? []
  const config = useQuery(getTableConfiguration$) ?? []
  const { tabledBronzeProjects } = useTableState()

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
      <div>
        Projects in allProjects: {allProjects.length} ({allProjects.map(p => p.name).join(', ')})
      </div>
      <div>
        Bronze entries (raw): {bronzeProjectEntries.length} (
        {bronzeProjectEntries.map(e => `${e.projectId}:${e.status}`).join(', ')})
      </div>
      <div>
        Tabled bronze (filtered): {tabledBronzeProjects.length} (
        {tabledBronzeProjects.map(e => e.projectId).join(', ')})
      </div>
      <div>Table config: {config.length > 0 ? 'exists' : 'none'}</div>
    </div>
  )
}

/**
 * Helper component that wraps SortingRoom with router context
 */
const SortingRoomHelper: React.FC<{ showDebug?: boolean }> = ({ showDebug = false }) => {
  return (
    <div style={{ width: '900px', padding: '1rem', background: '#faf9f7' }}>
      <SortingRoom />
      {showDebug && <DebugInfo />}
    </div>
  )
}

// Note: Router is provided by Storybook's preview.tsx (BrowserRouter)
// so we don't wrap with MemoryRouter here
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

const seedTableConfiguration = (
  store: Store,
  config: {
    goldProjectId?: string
    silverProjectId?: string
  } = {}
) => {
  store.commit(
    events.tableConfigurationInitialized({
      goldProjectId: config.goldProjectId ?? null,
      silverProjectId: config.silverProjectId ?? null,
      bronzeMode: 'minimal',
      bronzeTargetExtra: 0,
      updatedAt: new Date(),
    })
  )
}

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
const emptySetup = (store: Store) => {
  seedTableConfiguration(store)
}

/**
 * Setup with tabled bronze projects - this is the critical test case
 * to verify the "On Table" summary shows the project name, not "Empty"
 */
const withTabledBronzeSetup = (store: Store) => {
  seedTableConfiguration(store)

  // Create bronze projects
  seedProject(
    store,
    'bronze-1',
    'Monarch re-balancing',
    'finances',
    'bronze',
    'backlog',
    'Update all financial tracking'
  )
  seedProject(
    store,
    'bronze-2',
    'Fix leaky faucet',
    'home',
    'bronze',
    'backlog',
    'Kitchen sink needs repair'
  )
  seedProject(store, 'bronze-3', 'Schedule annual checkup', 'health', 'bronze', 'backlog')

  // Create tasks for projects (to show progress)
  seedTask(store, 'task-1', 'Hook up 401k', 'bronze-1')
  seedTask(store, 'task-2', 'Balance budgets', 'bronze-1', 'done')
  seedTask(store, 'task-3', 'Re-fresh PayPal', 'bronze-1')
  seedTask(store, 'task-4', 'Buy replacement parts', 'bronze-2')
  seedTask(store, 'task-5', 'Watch repair video', 'bronze-2', 'done')
  seedTask(store, 'task-6', 'Call doctor office', 'bronze-3')

  // Add projects to bronze table
  seedBronzeProjectEntry(store, 'entry-1', 'bronze-1', 1000)
  seedBronzeProjectEntry(store, 'entry-2', 'bronze-2', 2000)
  seedBronzeProjectEntry(store, 'entry-3', 'bronze-3', 3000)
}

/**
 * Setup with all three streams populated
 */
const fullSetup = (store: Store) => {
  // Create gold project
  seedProject(store, 'gold-1', 'Launch New Product', 'growth', 'gold', 'active')
  seedTask(store, 'g-task-1', 'Market research', 'gold-1', 'done')
  seedTask(store, 'g-task-2', 'Build prototype', 'gold-1', 'doing')
  seedTask(store, 'g-task-3', 'User testing', 'gold-1')

  // Create silver project
  seedProject(store, 'silver-1', 'Optimize CI Pipeline', 'growth', 'silver', 'active')
  seedTask(store, 's-task-1', 'Audit current pipeline', 'silver-1', 'done')
  seedTask(store, 's-task-2', 'Implement caching', 'silver-1')

  // Initialize table with gold and silver
  seedTableConfiguration(store, {
    goldProjectId: 'gold-1',
    silverProjectId: 'silver-1',
  })

  // Create bronze projects
  seedProject(store, 'bronze-1', 'Fix bug in login', 'growth', 'bronze', 'backlog')
  seedProject(store, 'bronze-2', 'Update documentation', 'growth', 'bronze', 'backlog')
  seedProject(store, 'bronze-3', 'Review PR feedback', 'growth', 'bronze', 'backlog')

  // Add tasks for bronze projects
  seedTask(store, 'b-task-1', 'Debug login flow', 'bronze-1')
  seedTask(store, 'b-task-2', 'Update README', 'bronze-2')
  seedTask(store, 'b-task-3', 'Address review comments', 'bronze-3')

  // Table the bronze projects
  seedBronzeProjectEntry(store, 'entry-1', 'bronze-1', 1000)
  seedBronzeProjectEntry(store, 'entry-2', 'bronze-2', 2000)

  // Create backlog projects (in queue but not tabled)
  seedProject(store, 'gold-backlog-1', 'Strategic Initiative', 'finances', 'gold', 'backlog')
  seedProject(store, 'silver-backlog-1', 'Process Improvement', 'home', 'silver', 'backlog')
}

/**
 * Setup with bronze projects but one is an orphan (project deleted)
 * to test the fix for finding the first VALID project
 */
const withOrphanEntrySetup = (store: Store) => {
  seedTableConfiguration(store)

  // Create only one bronze project (not the first entry's project)
  seedProject(
    store,
    'bronze-2',
    'Fix leaky faucet',
    'home',
    'bronze',
    'backlog',
    'Kitchen sink needs repair'
  )

  // Add tasks
  seedTask(store, 'task-1', 'Buy replacement parts', 'bronze-2')

  // Create entries - first one is orphan (project doesn't exist)
  seedBronzeProjectEntry(store, 'entry-1', 'deleted-project', 1000) // Orphan - no matching project
  seedBronzeProjectEntry(store, 'entry-2', 'bronze-2', 2000) // Valid - has matching project
}

const meta: Meta<typeof SortingRoomHelper> = {
  title: 'Sorting Room/SortingRoom',
  component: SortingRoomHelper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The Sorting Room displays three stream tabs (Gold/Initiative, Silver/Optimization, Bronze/To-Do) showing tabled projects and backlog queues. The summary cards show "ON TABLE" with the project name or "Empty" if no project is tabled.',
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
  args: { showDebug: true },
  decorators: [withLiveStore(emptySetup)],
  parameters: {
    docs: {
      description: {
        story: 'Shows all three streams with empty states - no projects tabled.',
      },
    },
  },
}

/**
 * With tabled bronze projects - CRITICAL TEST CASE
 *
 * The "To-Do" summary card should show "Monarch re-balancing" as the ON TABLE name,
 * NOT "Empty". If this shows "Empty", there's a bug in topTabledBronzeProject computation.
 */
export const WithTabledBronze: Story = {
  args: { showDebug: true },
  decorators: [withLiveStore(withTabledBronzeSetup)],
  parameters: {
    docs: {
      description: {
        story:
          '**CRITICAL TEST**: The To-Do card should show "Monarch re-balancing" under ON TABLE, not "Empty". This verifies the bronze project summary display works correctly.',
      },
    },
  },
}

/**
 * Full setup with all three streams populated
 */
export const FullSetup: Story = {
  args: { showDebug: true },
  decorators: [withLiveStore(fullSetup)],
  parameters: {
    docs: {
      description: {
        story:
          'All three streams with projects: Gold has "Launch New Product", Silver has "Optimize CI Pipeline", Bronze has "Fix bug in login".',
      },
    },
  },
}

/**
 * Bronze stream expanded via URL parameter
 * Note: URL-based expansion cannot be tested in Storybook since the router is controlled by preview.tsx
 * This story shows the same data as WithTabledBronze - test URL expansion via E2E tests
 */
export const BronzeExpanded: Story = {
  args: { showDebug: false },
  decorators: [withLiveStore(withTabledBronzeSetup)],
  parameters: {
    docs: {
      description: {
        story:
          'Bronze stream with tabled projects. Note: URL-based expansion (/sorting-room/bronze) cannot be tested in Storybook - use E2E tests for that.',
      },
    },
  },
}

/**
 * With orphan entry - tests the fix for finding first VALID project
 *
 * The first entry in tabledBronzeProjects points to a deleted project,
 * but the summary should still show "Fix leaky faucet" (the second entry's project).
 */
export const WithOrphanEntry: Story = {
  args: { showDebug: true },
  decorators: [withLiveStore(withOrphanEntrySetup)],
  parameters: {
    docs: {
      description: {
        story:
          '**ORPHAN TEST**: First entry points to deleted project. Summary should show "Fix leaky faucet" (second entry), not "Empty".',
      },
    },
  },
}
