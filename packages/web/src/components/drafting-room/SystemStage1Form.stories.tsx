import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { LiveStoreProvider } from '../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { events, schema } from '@lifebuild/shared/schema'
import { SystemStage1Form } from './SystemStage1Form.js'

const withSystemFormProviders =
  (boot?: (store: Store) => void) =>
  (StoryComponent: React.ComponentType): React.ReactElement => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/drafting-room/new/system?storeId=storybook')
    }

    return (
      <LiveStoreProvider
        schema={schema}
        adapter={makeInMemoryAdapter()}
        batchUpdates={batchUpdates}
        boot={boot}
      >
        <Routes>
          <Route path='/drafting-room/new/system' element={<StoryComponent />} />
          <Route path='/drafting-room/:systemId/system-stage1' element={<StoryComponent />} />
        </Routes>
      </LiveStoreProvider>
    )
  }

const withExistingSystemProviders =
  (boot?: (store: Store) => void) =>
  (StoryComponent: React.ComponentType): React.ReactElement => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/drafting-room/system-1/system-stage1?storeId=storybook')
    }

    return (
      <LiveStoreProvider
        schema={schema}
        adapter={makeInMemoryAdapter()}
        batchUpdates={batchUpdates}
        boot={boot}
      >
        <Routes>
          <Route path='/drafting-room/:systemId/system-stage1' element={<StoryComponent />} />
        </Routes>
      </LiveStoreProvider>
    )
  }

const meta: Meta<typeof SystemStage1Form> = {
  title: 'Drafting Room/SystemStage1Form',
  component: SystemStage1Form,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'System Stage 1 (Identify) form for quick capture: title, description, and category. Auto-saves on blur. Systems use a 3-stage planning flow (Identify, Scope, Detail) similar to projects.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default empty form for creating a new system.
 * Type a name and tab out to trigger auto-save.
 */
export const Default: Story = {
  decorators: [withSystemFormProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'Empty form for creating a new system. Enter a system name and blur the field to auto-save. Select a category to enable the Continue button.',
      },
    },
  },
}

/**
 * Editing an existing system that was previously created with Stage 1 data.
 */
const existingSystemBoot = (store: Store) => {
  const now = new Date('2024-06-15T10:00:00Z')
  store.commit(
    events.systemCreated({
      id: 'system-1',
      name: 'Morning Routine',
      description: 'A daily morning routine to maintain energy and focus',
      category: 'health',
      createdAt: now,
      actorId: 'storybook',
    })
  )
}

export const WithExistingSystem: Story = {
  decorators: [withExistingSystemProviders(existingSystemBoot)],
  parameters: {
    docs: {
      description: {
        story:
          'Form pre-populated with an existing system. The system name, description, and category are loaded from the store. Changes auto-save on blur.',
      },
    },
  },
}
