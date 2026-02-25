import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { LiveStoreProvider } from '../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@lifebuild/shared/schema'
import { SystemStage2Form } from './SystemStage2Form.js'

const withStage2Providers =
  (boot?: (store: Store) => void) =>
  (StoryComponent: React.ComponentType): React.ReactElement => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/drafting-room/system-1/system-stage2?storeId=storybook')
    }

    return (
      <LiveStoreProvider
        schema={schema}
        adapter={makeInMemoryAdapter()}
        batchUpdates={batchUpdates}
        boot={boot}
      >
        <Routes>
          <Route path='/drafting-room/:systemId/system-stage2' element={<StoryComponent />} />
        </Routes>
      </LiveStoreProvider>
    )
  }

const meta: Meta<typeof SystemStage2Form> = {
  title: 'Drafting Room/SystemStage2Form',
  component: SystemStage2Form,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'System Stage 2 (Scope) form for defining the purpose statement and recurring task templates. Purpose statement auto-saves on blur. Templates are batch-committed when the user clicks "Continue to Stage 3".',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default: System with name and category set (from Stage 1), empty Stage 2 fields.
 * The purpose statement and template editor start empty.
 */
const defaultBoot = (store: Store) => {
  const now = new Date('2024-06-15T10:00:00Z')
  store.commit(
    events.systemCreated({
      id: 'system-1',
      name: 'Meal Planning',
      description: 'Weekly meal planning and grocery shopping system',
      category: 'home',

      createdAt: now,
      actorId: 'storybook',
    })
  )
}

export const Default: Story = {
  decorators: [withStage2Providers(defaultBoot)],
  parameters: {
    docs: {
      description: {
        story:
          'System with Stage 1 data (name and category) already set. The purpose statement textarea and task template editor are empty. Fill in both to enable the "Continue to Stage 3" button.',
      },
    },
  },
}

/**
 * WithExistingTemplates: System with purpose statement and 2 pre-existing templates.
 */
const withExistingTemplatesBoot = (store: Store) => {
  const now = new Date('2024-06-15T10:00:00Z')

  store.commit(
    events.systemCreated({
      id: 'system-1',
      name: 'Meal Planning',
      description: 'Weekly meal planning and grocery shopping system',
      category: 'home',

      createdAt: now,
      actorId: 'storybook',
    })
  )

  store.commit(
    events.systemUpdated({
      id: 'system-1',
      updates: {
        purposeStatement: 'Keeps the household fed and grocery spending predictable',
      },
      updatedAt: now,
      actorId: 'storybook',
    })
  )

  store.commit(
    events.systemTaskTemplateAdded({
      id: 'template-1',
      systemId: 'system-1',
      title: 'Plan weekly meals',
      description: 'Choose 5-7 dinners and plan lunches around leftovers',
      cadence: 'weekly',
      position: 0,
      createdAt: now,
      actorId: 'storybook',
    })
  )

  store.commit(
    events.systemTaskTemplateAdded({
      id: 'template-2',
      systemId: 'system-1',
      title: 'Grocery shopping',
      description: 'Buy groceries based on the weekly meal plan',
      cadence: 'weekly',
      position: 1,
      createdAt: now,
      actorId: 'storybook',
    })
  )
}

export const WithExistingTemplates: Story = {
  decorators: [withStage2Providers(withExistingTemplatesBoot)],
  parameters: {
    docs: {
      description: {
        story:
          'System with a purpose statement and two existing task templates already saved. The form loads pre-populated. Changes to existing templates will be committed as updates when continuing.',
      },
    },
  },
}

/**
 * MidCycleFlow: System with templates showing the mid-cycle date entry panel.
 * Click "I\'m already doing this" to open the mid-cycle panel.
 */
const midCycleBoot = (store: Store) => {
  const now = new Date('2024-06-15T10:00:00Z')

  store.commit(
    events.systemCreated({
      id: 'system-1',
      name: 'Morning Routine',
      description: 'Daily morning wellness routine',
      category: 'health',

      createdAt: now,
      actorId: 'storybook',
    })
  )

  store.commit(
    events.systemUpdated({
      id: 'system-1',
      updates: {
        purposeStatement: 'Maintains physical and mental readiness for the day',
      },
      updatedAt: now,
      actorId: 'storybook',
    })
  )

  store.commit(
    events.systemTaskTemplateAdded({
      id: 'template-1',
      systemId: 'system-1',
      title: 'Morning stretch routine',
      description: '15 minutes of stretching and mobility work',
      cadence: 'daily',
      position: 0,
      createdAt: now,
      actorId: 'storybook',
    })
  )

  store.commit(
    events.systemTaskTemplateAdded({
      id: 'template-2',
      systemId: 'system-1',
      title: 'Review weekly goals',
      cadence: 'weekly',
      position: 1,
      createdAt: now,
      actorId: 'storybook',
    })
  )

  store.commit(
    events.systemTaskTemplateAdded({
      id: 'template-3',
      systemId: 'system-1',
      title: 'Monthly health check-in',
      description: 'Review health metrics and adjust routine',
      cadence: 'monthly',
      position: 2,
      createdAt: now,
      actorId: 'storybook',
    })
  )
}

export const MidCycleFlow: Story = {
  decorators: [withStage2Providers(midCycleBoot)],
  parameters: {
    docs: {
      description: {
        story:
          'System with multiple templates at different cadences. Click "I\'m already doing this -- update the start date" to open the mid-cycle panel where you can set when you last performed each task. This adjusts the next due dates accordingly.',
      },
    },
  },
}
