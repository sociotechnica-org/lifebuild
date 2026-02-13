import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { LiveStoreProvider, useQuery } from '../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { events, schema } from '@lifebuild/shared/schema'
import { getProjectById$ } from '@lifebuild/shared/queries'
import { ProjectAvatar } from './ProjectAvatar.js'
import type { Store } from '@livestore/livestore'

const adapter = makeInMemoryAdapter()

const ProjectAvatarStory: React.FC<{ projectId: string }> = ({ projectId }) => {
  const projectRows = useQuery(getProjectById$(projectId)) ?? []
  const project = projectRows[0]
  if (!project) return null
  return <ProjectAvatar project={project} size={64} />
}

const meta = {
  title: 'Components/ProjectAvatar',
  component: ProjectAvatarStory,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProjectAvatarStory>

export default meta
type Story = StoryObj<typeof meta>

const withCoverImage = (store: Store) => {
  const projectId = 'project-avatar-default'
  store.commit(
    events.projectCreatedV2({
      id: projectId,
      name: 'Stargazer Renovation',
      description: 'Refresh the main study with a celestial theme.',
      category: 'home',
      lifecycleState: { status: 'planning', stage: 1 },
      createdAt: new Date(),
      actorId: 'storybook',
    })
  )
  store.commit(
    events.projectCoverImageSet({
      projectId,
      coverImageUrl: 'https://picsum.photos/seed/lifebuild-avatar/200/200',
      attributes: {
        coverImage: 'https://picsum.photos/seed/lifebuild-avatar/200/200',
      },
      updatedAt: new Date(),
      actorId: 'storybook',
    })
  )
}

const withoutCoverImage = (store: Store) => {
  store.commit(
    events.projectCreatedV2({
      id: 'project-avatar-initials',
      name: 'Morning Ritual',
      description: 'Build a grounding morning routine.',
      category: 'health',
      lifecycleState: { status: 'planning', stage: 1 },
      createdAt: new Date(),
      actorId: 'storybook',
    })
  )
}

export const Default: Story = {
  args: {
    projectId: 'project-avatar-default',
  },
  decorators: [
    StoryComponent => (
      <LiveStoreProvider
        schema={schema}
        adapter={adapter}
        batchUpdates={batchUpdates}
        boot={withCoverImage}
      >
        <StoryComponent />
      </LiveStoreProvider>
    ),
  ],
  render: args => <ProjectAvatarStory {...args} />,
}

export const InitialsFallback: Story = {
  args: {
    projectId: 'project-avatar-initials',
  },
  decorators: [
    StoryComponent => (
      <LiveStoreProvider
        schema={schema}
        adapter={adapter}
        batchUpdates={batchUpdates}
        boot={withoutCoverImage}
      >
        <StoryComponent />
      </LiveStoreProvider>
    ),
  ],
  render: args => <ProjectAvatarStory {...args} />,
}
