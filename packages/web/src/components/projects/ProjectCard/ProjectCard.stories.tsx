import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { formatDate } from '../../../util/dates.js'

// Mock ProjectCard component that doesn't use LiveStore
const ProjectCardStoryWrapper = ({ project, onClick, mockWorkers = [] }: any) => {
  // Create a version of ProjectCard that displays without LiveStore dependency

  const getAvatarColor = (id: string) => {
    // Simple avatar color logic for stories
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500']
    return colors[id.length % colors.length]
  }

  return (
    <div
      className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200'
      onClick={onClick}
    >
      <h3 className='text-lg font-semibold text-gray-900 mb-2'>{project.name}</h3>
      {project.description && (
        <p className='text-sm text-gray-600 mb-3 line-clamp-2'>{project.description}</p>
      )}

      {mockWorkers.length > 0 && (
        <div className='mb-3'>
          <div className='text-xs text-gray-500 mb-1'>Assigned Team:</div>
          <div className='flex flex-wrap gap-1'>
            {mockWorkers.slice(0, 3).map((worker: any) => (
              <span
                key={worker.id}
                className={`inline-flex items-center px-2 py-1 text-xs ${getAvatarColor(worker.id)} text-white rounded-full`}
              >
                {worker.avatar && <span className='mr-1'>{worker.avatar}</span>}
                {worker.name}
              </span>
            ))}
            {mockWorkers.length > 3 && (
              <span className='inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full'>
                +{mockWorkers.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className='text-sm text-gray-500'>
        <p>Created: {formatDate(project.createdAt)}</p>
        <p>Updated: {formatDate(project.updatedAt)}</p>
        <p>Team: {mockWorkers.length > 0 ? mockWorkers.length : 'None assigned'}</p>
      </div>
    </div>
  )
}

const meta: Meta<typeof ProjectCardStoryWrapper> = {
  title: 'Components/ProjectCard',
  component: ProjectCardStoryWrapper,
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
    mockWorkers: {
      control: 'object',
      description: 'Mock worker data for Storybook (replaces LiveStore data)',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    project: {
      id: 'project-1',
      name: 'Project Alpha',
      description: 'Main development project for our new product launch',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-15'),
      deletedAt: null,
    },
    mockWorkers: [],
  },
}

export const WithTeamMembers: Story = {
  args: {
    project: {
      id: 'project-2',
      name: 'Marketing Campaign',
      description: 'Q4 marketing campaign for product promotion',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date(),
      deletedAt: null,
    },
    mockWorkers: [
      { id: 'worker-1', name: 'Alice', avatar: '👩‍💼' },
      { id: 'worker-2', name: 'Bob', avatar: '👨‍💻' },
      { id: 'worker-3', name: 'Carol', avatar: '👩‍🎨' },
    ],
  },
}

export const LargeTeam: Story = {
  args: {
    project: {
      id: 'project-3',
      name: 'Enterprise Solution',
      description: 'Large-scale enterprise project with multiple teams',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-10'),
      deletedAt: null,
    },
    mockWorkers: [
      { id: 'worker-1', name: 'Alice', avatar: '👩‍💼' },
      { id: 'worker-2', name: 'Bob', avatar: '👨‍💻' },
      { id: 'worker-3', name: 'Carol', avatar: '👩‍🎨' },
      { id: 'worker-4', name: 'David', avatar: '👨‍🔬' },
      { id: 'worker-5', name: 'Eve', avatar: '👩‍🚀' },
    ],
  },
}

export const LongName: Story = {
  args: {
    project: {
      id: 'project-4',
      name: 'Very Long Project Name That Should Wrap Properly in the Card Layout',
      description: 'Long-term project strategy and feature planning',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-10'),
      deletedAt: null,
    },
    mockWorkers: [{ id: 'worker-1', name: 'Alice', avatar: '👩‍💼' }],
  },
}

export const WithoutDescription: Story = {
  args: {
    project: {
      id: 'project-5',
      name: 'Minimal Project',
      description: null,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-05'),
      deletedAt: null,
    },
    onClick: undefined,
    mockWorkers: [],
  },
}
