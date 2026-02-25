import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LiveStoreProvider } from '../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@lifebuild/shared/schema'
import { SystemBoard } from './SystemBoard.js'

// Helper to wrap stories in LiveStore with a boot function
const withLiveStore = (boot: (store: Store) => void) => (Story: React.ComponentType) => (
  <LiveStoreProvider
    schema={schema}
    adapter={makeInMemoryAdapter()}
    batchUpdates={batchUpdates}
    boot={store => boot(store)}
  >
    <div style={{ width: '900px', padding: '1rem', background: '#faf9f7' }}>
      <Story />
    </div>
  </LiveStoreProvider>
)

// Seed helpers

const seedSystem = (
  store: Store,
  id: string,
  name: string,
  opts: {
    category?: string
    purposeStatement?: string
    lifecycleState?: 'planning' | 'planted' | 'hibernating' | 'uprooted'
  } = {}
) => {
  const now = new Date()

  store.commit(
    events.systemCreated({
      id,
      name,
      description: `Description for ${name}`,
      category: (opts.category ?? 'health') as any,
      purposeStatement: opts.purposeStatement,
      createdAt: now,
      actorId: 'storybook',
    })
  )

  const state = opts.lifecycleState ?? 'planted'
  if (state === 'planted' || state === 'hibernating' || state === 'uprooted') {
    store.commit(
      events.systemPlanted({
        systemId: id,
        plantedAt: now,
        actorId: 'storybook',
      })
    )
  }
  if (state === 'hibernating') {
    store.commit(
      events.systemHibernated({
        systemId: id,
        hibernatedAt: now,
        actorId: 'storybook',
      })
    )
  }
  if (state === 'uprooted') {
    store.commit(
      events.systemUprooted({
        systemId: id,
        uprootedAt: now,
        actorId: 'storybook',
      })
    )
  }
}

const seedTemplate = (
  store: Store,
  id: string,
  systemId: string,
  title: string,
  cadence: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually',
  position: number,
  opts: {
    nextGenerateAt?: Date
    lastGeneratedAt?: Date
  } = {}
) => {
  store.commit(
    events.systemTaskTemplateAdded({
      id,
      systemId,
      title,
      cadence,
      position,
      createdAt: new Date(),
      actorId: 'storybook',
    })
  )

  // Simulate generation history if provided
  if (opts.lastGeneratedAt && opts.nextGenerateAt) {
    store.commit(
      events.systemTaskGenerated({
        systemId,
        templateId: id,
        taskId: `task-${id}`,
        generatedAt: opts.lastGeneratedAt,
        nextGenerateAt: opts.nextGenerateAt,
        actorId: 'storybook',
      })
    )
  }
}

// Setup functions for different scenarios

const emptySetup = (_store: Store) => {
  // No systems at all
}

const threePlantedSetup = (store: Store) => {
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)

  // System 1: Meal Planning (healthy, on track)
  seedSystem(store, 'sys-1', 'Meal Planning', {
    category: 'health',
    purposeStatement: 'Keeps the household fed and grocery spending predictable',
    lifecycleState: 'planted',
  })
  seedTemplate(store, 'tpl-1a', 'sys-1', 'Plan weekly meals', 'weekly', 0, {
    lastGeneratedAt: twoDaysAgo,
    nextGenerateAt: threeDaysFromNow,
  })
  seedTemplate(store, 'tpl-1b', 'sys-1', 'Grocery shopping', 'weekly', 1, {
    lastGeneratedAt: twoDaysAgo,
    nextGenerateAt: threeDaysFromNow,
  })

  // System 2: Financial Review (overdue)
  seedSystem(store, 'sys-2', 'Financial Review', {
    category: 'finances',
    purposeStatement: 'Monthly financial health check and budget reconciliation',
    lifecycleState: 'planted',
  })
  seedTemplate(store, 'tpl-2a', 'sys-2', 'Review bank statements', 'monthly', 0, {
    lastGeneratedAt: oneWeekAgo,
    nextGenerateAt: yesterday, // overdue!
  })
  seedTemplate(store, 'tpl-2b', 'sys-2', 'Reconcile budget', 'monthly', 1, {
    lastGeneratedAt: oneWeekAgo,
    nextGenerateAt: yesterday, // overdue!
  })
  seedTemplate(store, 'tpl-2c', 'sys-2', 'Check investment portfolio', 'quarterly', 2)

  // System 3: Morning Routine (daily, fresh)
  seedSystem(store, 'sys-3', 'Morning Routine', {
    category: 'growth',
    purposeStatement: 'Consistent morning practice for energy and focus',
    lifecycleState: 'planted',
  })
  seedTemplate(store, 'tpl-3a', 'sys-3', 'Morning journaling', 'daily', 0, {
    lastGeneratedAt: now,
    nextGenerateAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
  })
}

const withHibernatingSetup = (store: Store) => {
  // Call the planted setup first
  threePlantedSetup(store)

  // Add a hibernating system
  seedSystem(store, 'sys-4', 'Garden Maintenance', {
    category: 'home',
    purposeStatement: 'Keep the garden healthy through the growing season',
    lifecycleState: 'hibernating',
  })
  seedTemplate(store, 'tpl-4a', 'sys-4', 'Water plants', 'daily', 0)
  seedTemplate(store, 'tpl-4b', 'sys-4', 'Weed garden beds', 'weekly', 1)
}

const withUprootedSetup = (store: Store) => {
  // Call the planted setup first
  threePlantedSetup(store)

  // Add uprooted systems
  seedSystem(store, 'sys-uprooted-1', 'Old Workout Routine', {
    category: 'health',
    lifecycleState: 'uprooted',
  })
  seedTemplate(store, 'tpl-u1', 'sys-uprooted-1', 'Gym session', 'daily', 0)

  seedSystem(store, 'sys-uprooted-2', 'Newsletter Publishing', {
    category: 'contribution',
    lifecycleState: 'uprooted',
  })
  seedTemplate(store, 'tpl-u2', 'sys-uprooted-2', 'Write newsletter', 'weekly', 0)
}

const meta: Meta<typeof SystemBoard> = {
  title: 'System Board/SystemBoard',
  component: SystemBoard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The System Board displays a list of planted systems with their health status, template counts, next-due dates, and last-generated information. Uprooted systems appear in a collapsible section.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Empty state - no systems planted
 */
export const Empty: Story = {
  decorators: [withLiveStore(emptySetup)],
  parameters: {
    docs: {
      description: {
        story:
          'Shows the empty state with a message and link to the Drafting Room when no systems are planted.',
      },
    },
  },
}

/**
 * Three planted systems with various states
 */
export const ThreePlantedSystems: Story = {
  decorators: [withLiveStore(threePlantedSetup)],
  parameters: {
    docs: {
      description: {
        story:
          'Three planted systems: Meal Planning (on track), Financial Review (overdue), and Morning Routine (daily, fresh). Shows different template counts and due states.',
      },
    },
  },
}

/**
 * With a hibernating system
 */
export const WithHibernating: Story = {
  decorators: [withLiveStore(withHibernatingSetup)],
  parameters: {
    docs: {
      description: {
        story:
          'Three planted systems plus one hibernating system (Garden Maintenance). The hibernating system shows a "Hibernating" badge and a "Resume" button (stubbed).',
      },
    },
  },
}

/**
 * With uprooted systems in collapsible section
 */
export const WithUprooted: Story = {
  decorators: [withLiveStore(withUprootedSetup)],
  parameters: {
    docs: {
      description: {
        story:
          'Three planted systems plus two uprooted systems in a collapsible section. Click "Uprooted (2)" to expand the section.',
      },
    },
  },
}
