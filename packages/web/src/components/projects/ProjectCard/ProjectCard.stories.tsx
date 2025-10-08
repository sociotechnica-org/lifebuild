import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ProjectCard } from './ProjectCard.js'
import { getProjects$ } from '@work-squared/shared/queries'
import { schema, events } from '@work-squared/shared/schema'
import { LiveStoreProvider, useQuery } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'

type ProjectCardProps = React.ComponentProps<typeof ProjectCard>

const adapter = makeInMemoryAdapter()

const ProjectCardHelper = (props: ProjectCardProps & { projectId?: string }) => {
  const projects = useQuery(getProjects$)
  const project = props.projectId ? projects.find(p => p.id === props.projectId) : projects[0]

  if (!project) {
    return <div className='text-gray-500 p-4'>No project found</div>
  }

  return <ProjectCard project={project} onClick={props.onClick} />
}

const meta: Meta<typeof ProjectCardHelper> = {
  title: 'Components/ProjectCard',
  component: ProjectCardHelper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Project card component displaying project information and assigned team members.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const defaultProjectSetup = (store: Store) => {
  store.commit(
    events.projectCreated({
      id: 'project-1',
      name: 'Project Alpha',
      description: 'Main development project for our new product launch',
      createdAt: new Date('2023-01-01'),
      actorId: '1',
    })
  )
}

export const Default: Story = {
  args: {
    projectId: 'project-1',
  },
  decorators: [
    Story => (
      <LiveStoreProvider
        schema={schema}
        adapter={adapter}
        batchUpdates={batchUpdates}
        boot={defaultProjectSetup}
      >
        <Story />
      </LiveStoreProvider>
    ),
  ],
}

const withTeamSetup = (store: Store) => {
  // Create project
  store.commit(
    events.projectCreated({
      id: 'project-2',
      name: 'Marketing Campaign',
      description: 'Q4 marketing campaign for product promotion',
      createdAt: new Date('2023-01-01'),
      actorId: '1',
    })
  )

  // Create workers
  store.commit(
    events.workerCreated({
      id: 'worker-1',
      name: 'Alice',
      avatar: '👩‍💼',
      createdAt: new Date(),
      systemPrompt: 'You are a helpful assistant.',
      defaultModel: 'claude-sonnet-4-20250514',
      actorId: '1',
    })
  )
  store.commit(
    events.workerCreated({
      id: 'worker-2',
      name: 'Bob',
      avatar: '👨‍💻',
      createdAt: new Date(),
      systemPrompt: 'You are a helpful assistant.',
      defaultModel: 'claude-sonnet-4-20250514',
      actorId: '1',
    })
  )
  store.commit(
    events.workerCreated({
      id: 'worker-3',
      name: 'Carol',
      avatar: '👩‍🎨',
      createdAt: new Date(),
      systemPrompt: 'You are a helpful assistant.',
      defaultModel: 'claude-sonnet-4-20250514',
      actorId: '1',
    })
  )

  // Assign workers to project
  store.commit(
    events.workerAssignedToProject({
      workerId: 'worker-1',
      projectId: 'project-2',
      assignedAt: new Date(),
      actorId: '1',
    })
  )
  store.commit(
    events.workerAssignedToProject({
      workerId: 'worker-2',
      projectId: 'project-2',
      assignedAt: new Date(),
      actorId: '1',
    })
  )
  store.commit(
    events.workerAssignedToProject({
      workerId: 'worker-3',
      projectId: 'project-2',
      assignedAt: new Date(),
      actorId: '1',
    })
  )
}

export const WithTeamMembers: Story = {
  args: {
    projectId: 'project-2',
  },
  decorators: [
    Story => (
      <LiveStoreProvider
        schema={schema}
        adapter={adapter}
        batchUpdates={batchUpdates}
        boot={withTeamSetup}
      >
        <Story />
      </LiveStoreProvider>
    ),
  ],
}

const largeTeamSetup = (store: Store) => {
  // Create project
  store.commit(
    events.projectCreated({
      id: 'project-3',
      name: 'Enterprise Solution',
      description: 'Large-scale enterprise project with multiple teams',
      createdAt: new Date('2023-01-01'),
      actorId: '1',
    })
  )

  // Create 5 workers
  const workers = [
    { id: 'worker-1', name: 'Alice', avatar: '👩‍💼' },
    { id: 'worker-2', name: 'Bob', avatar: '👨‍💻' },
    { id: 'worker-3', name: 'Carol', avatar: '👩‍🎨' },
    { id: 'worker-4', name: 'David', avatar: '👨‍🔬' },
    { id: 'worker-5', name: 'Eve', avatar: '👩‍🚀' },
  ]

  workers.forEach(worker => {
    store.commit(
      events.workerCreated({
        id: worker.id,
        name: worker.name,
        avatar: worker.avatar,
        createdAt: new Date(),
        systemPrompt: 'You are a helpful assistant.',
        defaultModel: 'claude-sonnet-4-20250514',
        actorId: '1',
      })
    )
    store.commit(
      events.workerAssignedToProject({
        workerId: worker.id,
        projectId: 'project-3',
        assignedAt: new Date(),
        actorId: '1',
      })
    )
  })
}

export const LargeTeam: Story = {
  args: {
    projectId: 'project-3',
  },
  decorators: [
    Story => (
      <LiveStoreProvider
        schema={schema}
        adapter={adapter}
        batchUpdates={batchUpdates}
        boot={largeTeamSetup}
      >
        <Story />
      </LiveStoreProvider>
    ),
  ],
}

const longNameSetup = (store: Store) => {
  store.commit(
    events.projectCreated({
      id: 'project-4',
      name: 'Very Long Project Name That Should Wrap Properly in the Card Layout',
      description: 'Long-term project strategy and feature planning',
      createdAt: new Date('2023-01-01'),
      actorId: '1',
    })
  )
  store.commit(
    events.workerCreated({
      id: 'worker-1',
      name: 'Alice',
      avatar: '👩‍💼',
      createdAt: new Date(),
      systemPrompt: 'You are a helpful assistant.',
      defaultModel: 'claude-sonnet-4-20250514',
      actorId: '1',
    })
  )
  store.commit(
    events.workerAssignedToProject({
      workerId: 'worker-1',
      projectId: 'project-4',
      assignedAt: new Date(),
      actorId: '1',
    })
  )
}

export const LongName: Story = {
  args: {
    projectId: 'project-4',
  },
  decorators: [
    Story => (
      <LiveStoreProvider
        schema={schema}
        adapter={adapter}
        batchUpdates={batchUpdates}
        boot={longNameSetup}
      >
        <Story />
      </LiveStoreProvider>
    ),
  ],
}

const withoutDescriptionSetup = (store: Store) => {
  store.commit(
    events.projectCreated({
      id: 'project-5',
      name: 'Minimal Project',
      createdAt: new Date('2023-01-01'),
      actorId: '1',
    })
  )
}

export const WithoutDescription: Story = {
  args: {
    projectId: 'project-5',
    onClick: undefined,
  },
  decorators: [
    Story => (
      <LiveStoreProvider
        schema={schema}
        adapter={adapter}
        batchUpdates={batchUpdates}
        boot={withoutDescriptionSetup}
      >
        <Story />
      </LiveStoreProvider>
    ),
  ],
}
