import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LiveStoreProvider } from '../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { events, schema } from '@lifebuild/shared/schema'
import { SystemDetailPage } from './SystemDetailPage.js'

const withLiveStoreAndRouter =
  (boot: (store: Store) => void, systemId: string) => (Story: React.ComponentType) => (
    <LiveStoreProvider
      schema={schema}
      adapter={makeInMemoryAdapter()}
      batchUpdates={batchUpdates}
      boot={store => boot(store)}
    >
      <MemoryRouter initialEntries={[`/systems/${systemId}`]}>
        <Routes>
          <Route
            path='/systems/:systemId'
            element={
              <div style={{ maxWidth: '900px', margin: '0 auto', background: '#faf9f7' }}>
                <Story />
              </div>
            }
          />
        </Routes>
      </MemoryRouter>
    </LiveStoreProvider>
  )

// Seed helpers

const seedSystem = (
  store: Store,
  id: string,
  name: string,
  opts: {
    category?: string
    description?: string
    purposeStatement?: string
    lifecycleState?: 'planning' | 'planted' | 'hibernating' | 'uprooted'
  } = {}
) => {
  const now = new Date()

  store.commit(
    events.systemCreated({
      id,
      name,
      description: opts.description ?? `Description for ${name}`,
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
        id,
        plantedAt: now,
        actorId: 'storybook',
      })
    )
  }
  if (state === 'hibernating') {
    store.commit(
      events.systemHibernated({
        id,
        hibernatedAt: now,
        actorId: 'storybook',
      })
    )
  }
  if (state === 'uprooted') {
    store.commit(
      events.systemUprooted({
        id,
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
    description?: string
    nextGenerateAt?: Date
    lastGeneratedAt?: Date
  } = {}
) => {
  store.commit(
    events.systemTaskTemplateAdded({
      id,
      systemId,
      title,
      description: opts.description,
      cadence,
      position,
      createdAt: new Date(),
      actorId: 'storybook',
    })
  )

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

const meta: Meta<typeof SystemDetailPage> = {
  title: 'Pages/SystemDetailPage',
  component: SystemDetailPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Detail page for a single system, showing health status, task templates with editable cadences, and lifecycle actions.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SystemDetailPage>

export default meta
type Story = StoryObj<typeof meta>

// --- Stories ---

export const HealthyMealPlanning: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A healthy meal planning system with 3 weekly templates, all on track. Green health indicator.',
      },
    },
  },
  decorators: [
    withLiveStoreAndRouter((store: Store) => {
      const now = new Date()
      const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      const fiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)

      seedSystem(store, 'sys-meal', 'Meal Planning', {
        category: 'home',
        purposeStatement: 'Keeps the household fed and grocery spending predictable',
      })
      seedTemplate(store, 'tpl-1', 'sys-meal', 'Plan weekly meals', 'weekly', 0, {
        description: 'Decide what to cook for the coming week',
        lastGeneratedAt: twoDaysAgo,
        nextGenerateAt: fiveDays,
      })
      seedTemplate(store, 'tpl-2', 'sys-meal', 'Create grocery list', 'weekly', 1, {
        lastGeneratedAt: twoDaysAgo,
        nextGenerateAt: fiveDays,
      })
      seedTemplate(store, 'tpl-3', 'sys-meal', 'Order groceries', 'weekly', 2, {
        lastGeneratedAt: twoDaysAgo,
        nextGenerateAt: threeDays,
      })
    }, 'sys-meal'),
  ],
}

export const OverdueCarMaintenance: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A car maintenance system with mixed cadences. One template is overdue (yellow health). Try changing a cadence to see the next due date recalculate.',
      },
    },
  },
  decorators: [
    withLiveStoreAndRouter((store: Store) => {
      const now = new Date()
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

      seedSystem(store, 'sys-car', 'Car Maintenance', {
        category: 'home',
        purposeStatement: 'Keep the car running safely and prevent costly breakdowns',
      })
      seedTemplate(store, 'tpl-oil', 'sys-car', 'Change oil', 'quarterly', 0, {
        description: 'Full synthetic oil change at the dealer or DIY',
        lastGeneratedAt: thirtyDaysAgo,
        nextGenerateAt: twoDaysAgo, // overdue!
      })
      seedTemplate(store, 'tpl-tire', 'sys-car', 'Rotate tires', 'quarterly', 1, {
        lastGeneratedAt: thirtyDaysAgo,
        nextGenerateAt: sixtyDaysFromNow,
      })
      seedTemplate(store, 'tpl-inspect', 'sys-car', 'Annual inspection', 'annually', 2, {
        lastGeneratedAt: thirtyDaysAgo,
        nextGenerateAt: new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000),
      })
    }, 'sys-car'),
  ],
}

export const SignificantlyBehind: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A financial review system with a monthly template overdue by 45+ days. Red health indicator.',
      },
    },
  },
  decorators: [
    withLiveStoreAndRouter((store: Store) => {
      const now = new Date()
      const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

      seedSystem(store, 'sys-fin', 'Financial Review', {
        category: 'finances',
        purposeStatement: 'Stay on top of spending, savings targets, and investment rebalancing',
      })
      seedTemplate(store, 'tpl-budget', 'sys-fin', 'Review monthly budget', 'monthly', 0, {
        description: 'Compare actual spending to budget categories',
        lastGeneratedAt: ninetyDaysAgo,
        nextGenerateAt: fortyFiveDaysAgo, // > 30 days overdue on a monthly = significantly behind
      })
      seedTemplate(store, 'tpl-invest', 'sys-fin', 'Check investment allocations', 'quarterly', 1, {
        lastGeneratedAt: ninetyDaysAgo,
        nextGenerateAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      })
    }, 'sys-fin'),
  ],
}

export const HibernatingGarden: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A garden maintenance system in hibernating state (winter). Neutral health, Resume and Uproot buttons visible.',
      },
    },
  },
  decorators: [
    withLiveStoreAndRouter((store: Store) => {
      seedSystem(store, 'sys-garden', 'Garden Maintenance', {
        category: 'home',
        purposeStatement: 'Keep the yard and garden beds healthy through the growing season',
        lifecycleState: 'hibernating',
      })
      seedTemplate(store, 'tpl-water', 'sys-garden', 'Water garden beds', 'daily', 0)
      seedTemplate(store, 'tpl-weed', 'sys-garden', 'Weed garden beds', 'weekly', 1)
      seedTemplate(store, 'tpl-fertilize', 'sys-garden', 'Fertilize', 'monthly', 2)
    }, 'sys-garden'),
  ],
}

export const DailySupplements: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A minimal system with a single daily template, just generated. Simplest case.',
      },
    },
  },
  decorators: [
    withLiveStoreAndRouter((store: Store) => {
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      seedSystem(store, 'sys-supps', 'Daily Supplements', {
        category: 'health',
        purposeStatement: 'Never miss a day of vitamins and supplements',
      })
      seedTemplate(store, 'tpl-take', 'sys-supps', 'Take morning supplements', 'daily', 0, {
        description: 'Vitamin D, Omega-3, Magnesium',
        lastGeneratedAt: now,
        nextGenerateAt: tomorrow,
      })
    }, 'sys-supps'),
  ],
}

export const WithNotes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A system with Health Notes and Delegation Notes displayed in the notes section.',
      },
    },
  },
  decorators: [
    withLiveStoreAndRouter((store: Store) => {
      const now = new Date()
      const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

      seedSystem(store, 'sys-notes', 'Morning Exercise Routine', {
        category: 'health',
        description:
          'A structured morning workout routine\n\n## Health Notes\nSmooth operation looks like: completing the workout within 45 minutes, feeling energized (not exhausted) afterward, and maintaining at least 5 sessions per week.\n\n## Delegation Notes\nThis is a personal system and cannot be delegated. If traveling, switch to a bodyweight variant.',
        purposeStatement: 'Maintain consistent physical activity and energy levels',
      })
      seedTemplate(store, 'tpl-workout', 'sys-notes', 'Complete workout', 'daily', 0, {
        description: 'Full workout session per the current program',
        lastGeneratedAt: now,
        nextGenerateAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      })
      seedTemplate(store, 'tpl-stretch', 'sys-notes', 'Stretching routine', 'daily', 1, {
        lastGeneratedAt: now,
        nextGenerateAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      })
      seedTemplate(
        store,
        'tpl-program',
        'sys-notes',
        'Review and update workout program',
        'monthly',
        2,
        {
          lastGeneratedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          nextGenerateAt: threeDays,
        }
      )
    }, 'sys-notes'),
  ],
}
