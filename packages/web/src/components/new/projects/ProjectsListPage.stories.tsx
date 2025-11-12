import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LiveStoreProvider } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { schema, events } from '@work-squared/shared/schema'
import { ProjectsListPage } from './ProjectsListPage.js'

const withProviders =
  (boot?: (store: Store) => void) =>
  (Story: React.ComponentType): React.ReactElement => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/new/projects')
    }

    return (
      <LiveStoreProvider
        schema={schema}
        adapter={makeInMemoryAdapter()}
        batchUpdates={batchUpdates}
        boot={store => {
          boot?.(store)
        }}
      >
        <Story />
      </LiveStoreProvider>
    )
  }

const meta: Meta<typeof ProjectsListPage> = {
  title: 'New UI/Projects/ProjectsListPage',
  component: ProjectsListPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Foundational list of projects used by the new UI routing stack.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const createProjects = (store: Store, count: number) => {
  const baseDate = new Date('2024-01-01T00:00:00Z').getTime()
  for (let i = 0; i < count; i += 1) {
    const index = i + 1
    store.commit(
      events.projectCreated({
        id: `project-${index}`,
        name: `Project ${index}`,
        description: `Seeded project ${index} for Storybook state.`,
        createdAt: new Date(baseDate + i * 86_400_000),
        actorId: 'storybook',
      })
    )
  }
}

export const Default: Story = {
  decorators: [
    withProviders(store => {
      createProjects(store, 5)
    }),
  ],
}

export const SingleProject: Story = {
  decorators: [
    withProviders(store => {
      createProjects(store, 1)
    }),
  ],
}

export const EmptyState: Story = {
  decorators: [withProviders()],
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how the page behaves when no projects have been created yet.',
      },
    },
  },
}
