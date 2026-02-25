import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { LiveStoreProvider } from '../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@lifebuild/shared/schema'
import { SystemStage3Form } from './SystemStage3Form.js'

const withStage3Providers =
  (boot?: (store: Store) => void) =>
  (StoryComponent: React.ComponentType): React.ReactElement => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/drafting-room/system-1/system-stage3?storeId=storybook')
    }

    return (
      <LiveStoreProvider
        schema={schema}
        adapter={makeInMemoryAdapter()}
        batchUpdates={batchUpdates}
        boot={boot}
      >
        <Routes>
          <Route path='/drafting-room/:systemId/system-stage3' element={<StoryComponent />} />
        </Routes>
      </LiveStoreProvider>
    )
  }

const meta: Meta<typeof SystemStage3Form> = {
  title: 'Drafting Room/SystemStage3Form',
  component: SystemStage3Form,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'System Stage 3 (Detail) form for adding optional health notes and delegation notes before planting a system. This is the final step before a system becomes active. Clicking "Plant System" commits the systemPlanted event and sets nextGenerateAt on all templates.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default: System with Stage 1+2 data (name, category, purpose statement, templates),
 * ready for Stage 3. The health and delegation note fields are empty.
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

  store.commit(
    events.systemTaskTemplateAdded({
      id: 'template-3',
      systemId: 'system-1',
      title: 'Deep clean fridge',
      description: 'Remove expired items and wipe down shelves',
      cadence: 'monthly',
      position: 2,
      createdAt: now,
      actorId: 'storybook',
    })
  )
}

export const Default: Story = {
  decorators: [withStage3Providers(defaultBoot)],
  parameters: {
    docs: {
      description: {
        story:
          'System with Stage 1+2 data complete (name, category, purpose statement, and three task templates). Health and delegation note fields are empty. Click "Plant System" to transition the system to the planted lifecycle state.',
      },
    },
  },
}

/**
 * WithNotes: System with pre-filled health and delegation notes stored
 * in the description field via section markers.
 */
const withNotesBoot = (store: Store) => {
  const now = new Date('2024-06-15T10:00:00Z')

  store.commit(
    events.systemCreated({
      id: 'system-1',
      name: 'Morning Routine',
      description:
        'Daily morning wellness routine\n\n## Health Notes\nI feel energized all morning, no mid-morning crash. Stretching takes about 15 min and I should feel loose by the end.\n\n## Delegation Notes\nPartner can handle the morning smoothie prep if I label ingredients in the fridge the night before.',
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
      title: 'Prepare smoothie',
      cadence: 'daily',
      position: 1,
      createdAt: now,
      actorId: 'storybook',
    })
  )
}

export const WithNotes: Story = {
  decorators: [withStage3Providers(withNotesBoot)],
  parameters: {
    docs: {
      description: {
        story:
          'System with pre-filled health and delegation notes. The notes are stored as structured sections within the description field. Edit the notes and click "Plant System" to save changes and transition the system.',
      },
    },
  },
}
