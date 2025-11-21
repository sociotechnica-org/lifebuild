import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LiveStoreProvider } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { schema, events } from '@work-squared/shared/schema'
import { ProjectsListPage } from './ProjectsListPage.js'
import { NewUiShell } from '../layout/NewUiShell.js'

const withProjectsProvider =
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
        <NewUiShell>
          <Story />
        </NewUiShell>
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
        component: 'Text-only list of projects for the new UI foundation.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const seedProjects = (
  store: Store,
  projects: { id: string; name: string; description?: string }[]
) => {
  const baseDate = new Date('2024-01-01T00:00:00Z').getTime()
  projects.forEach((project, index) => {
    store.commit(
      events.projectCreated({
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: new Date(baseDate + index * 1000),
        actorId: 'storybook',
      })
    )
  })
}

const defaultSetup = (store: Store) => {
  seedProjects(store, [
    { id: 'project-alpha', name: 'Project Alpha', description: 'Initial foundation work.' },
    { id: 'project-beta', name: 'Project Beta', description: 'Follow-up tasks.' },
    { id: 'project-gamma', name: 'Project Gamma', description: 'Exploratory research.' },
    { id: 'project-delta', name: 'Project Delta', description: 'Infrastructure planning.' },
  ])
}

const emptySetup = (_store: Store) => {}

const singleProjectSetup = (store: Store) => {
  seedProjects(store, [
    { id: 'solo-project', name: 'Solo Project', description: 'Only one project here.' },
  ])
}

export const Default: Story = {
  decorators: [withProjectsProvider(defaultSetup)],
}

export const EmptyState: Story = {
  decorators: [withProjectsProvider(emptySetup)],
  name: 'Empty State',
}

export const SingleProject: Story = {
  decorators: [withProjectsProvider(singleProjectSetup)],
  name: 'Single Project',
}
