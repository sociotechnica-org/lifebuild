import type { Meta, StoryObj } from '@storybook/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { Store } from '@livestore/livestore'
import { events, schema } from '@lifebuild/shared/schema'
import React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { LiveStoreProvider } from '../../livestore-compat.js'
import { HexMap } from './HexMap.js'

const withLiveStore =
  (boot?: (store: Store) => void) =>
  (StoryComponent: React.ComponentType): React.ReactElement => (
    <LiveStoreProvider
      schema={schema}
      adapter={makeInMemoryAdapter()}
      batchUpdates={batchUpdates}
      boot={boot}
    >
      <StoryComponent />
    </LiveStoreProvider>
  )

const meta: Meta<typeof HexMap> = {
  title: 'Life Map/HexMap',
  component: HexMap,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Three.js Life Map with hex grid. Shows projects placed on hexes with category colors.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HexMap>

export default meta
type Story = StoryObj<typeof meta>

export const EmptyGrid: Story = {
  decorators: [withLiveStore()],
  render: () => (
    <div className='h-[680px] w-full'>
      <HexMap />
    </div>
  ),
}

const seedWithProjects = (store: Store) => {
  const now = new Date('2024-03-01T12:00:00Z')

  store.commit(
    events.projectCreatedV2({
      id: 'proj-1',
      name: 'Morning Routine',
      description: 'Daily health practice',
      category: 'health',
      createdAt: now,
    })
  )
  store.commit(
    events.projectCreatedV2({
      id: 'proj-2',
      name: 'Budget Tracker',
      description: 'Monthly finances',
      category: 'finances',
      createdAt: now,
    })
  )
  store.commit(
    events.projectCreatedV2({
      id: 'proj-3',
      name: 'Reading List',
      description: 'Books to read',
      category: 'growth',
      createdAt: now,
    })
  )

  // Place projects on hexes
  store.commit(events.projectHexPlaced({ projectId: 'proj-1', q: 0, r: 0, s: 0, placedAt: now }))
  store.commit(events.projectHexPlaced({ projectId: 'proj-2', q: 1, r: 0, s: -1, placedAt: now }))
  store.commit(events.projectHexPlaced({ projectId: 'proj-3', q: -1, r: 1, s: 0, placedAt: now }))
}

export const WithProjects: Story = {
  decorators: [withLiveStore(seedWithProjects)],
  render: () => (
    <div className='h-[680px] w-full'>
      <HexMap />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Three projects placed on the hex grid with category colors (Health, Finances, Growth).',
      },
    },
  },
}

const seedSixProjects = (store: Store) => {
  const now = new Date('2024-03-01T12:00:00Z')

  const projects = [
    {
      id: 'proj-1',
      name: 'Morning Routine',
      description: 'Daily health practice',
      category: 'health',
    },
    { id: 'proj-2', name: 'Budget Tracker', description: 'Monthly finances', category: 'finances' },
    { id: 'proj-3', name: 'Reading List', description: 'Books to read', category: 'growth' },
    {
      id: 'proj-4',
      name: 'Date Nights',
      description: 'Weekly quality time',
      category: 'relationships',
    },
    { id: 'proj-5', name: 'Guitar Practice', description: 'Learn new songs', category: 'leisure' },
    {
      id: 'proj-6',
      name: 'Kitchen Remodel',
      description: 'Renovate the kitchen',
      category: 'home',
    },
  ] as const

  for (const p of projects) {
    store.commit(events.projectCreatedV2({ ...p, createdAt: now }))
  }

  // Place on center hex + 5 adjacent hexes (ring-1)
  store.commit(events.projectHexPlaced({ projectId: 'proj-1', q: 0, r: 0, s: 0, placedAt: now }))
  store.commit(events.projectHexPlaced({ projectId: 'proj-2', q: 1, r: 0, s: -1, placedAt: now }))
  store.commit(events.projectHexPlaced({ projectId: 'proj-3', q: 0, r: 1, s: -1, placedAt: now }))
  store.commit(events.projectHexPlaced({ projectId: 'proj-4', q: -1, r: 1, s: 0, placedAt: now }))
  store.commit(events.projectHexPlaced({ projectId: 'proj-5', q: -1, r: 0, s: 1, placedAt: now }))
  store.commit(events.projectHexPlaced({ projectId: 'proj-6', q: 0, r: -1, s: 1, placedAt: now }))
}

export const SixProjectDensity: Story = {
  decorators: [withLiveStore(seedSixProjects)],
  render: () => (
    <div className='h-[680px] w-full'>
      <HexMap />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Six projects filling the center hex and all adjacent hexes. Tests label density and color variety across categories.',
      },
    },
  },
}
