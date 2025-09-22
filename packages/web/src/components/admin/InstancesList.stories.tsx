import type { Meta, StoryObj } from '@storybook/react'
import { InstancesList, type InstancesListProps } from './InstancesList.js'

const meta: Meta<InstancesListProps> = {
  title: 'Components/Admin/InstancesList',
  component: InstancesList as any,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A list component for displaying multiple user instances with remove functionality.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    instances: {
      control: 'object',
      description: 'Array of instances to display',
    },
    onRemoveInstance: {
      action: 'removeInstance',
      description: 'Callback when an instance remove button is clicked',
    },
    removing: {
      control: 'boolean',
      description: 'Whether a remove operation is in progress',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const sampleInstances = [
  {
    id: 'store_default',
    name: 'Personal Workspace',
    createdAt: '2025-01-15T10:00:00Z',
    lastAccessedAt: '2025-01-15T12:00:00Z',
    isDefault: true,
  },
  {
    id: 'store_project1',
    name: 'Project Alpha',
    createdAt: '2025-01-16T10:00:00Z',
    lastAccessedAt: '2025-01-16T12:00:00Z',
    isDefault: false,
  },
  {
    id: 'store_project2',
    name: 'Project Beta',
    createdAt: '2025-01-17T10:00:00Z',
    lastAccessedAt: '2025-01-17T12:00:00Z',
    isDefault: false,
  },
]

export const Default: Story = {
  args: {
    instances: sampleInstances,
    removing: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'A list of instances showing default and regular instances.',
      },
    },
  },
}

export const Empty: Story = {
  args: {
    instances: [],
    removing: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when user has no instances.',
      },
    },
  },
}

export const SingleInstance: Story = {
  args: {
    instances: [sampleInstances[0]!],
    removing: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'List with only the default instance.',
      },
    },
  },
}

export const ManyInstances: Story = {
  args: {
    instances: [
      ...sampleInstances,
      {
        id: 'store_project3',
        name: 'Project Gamma',
        createdAt: '2025-01-18T10:00:00Z',
        lastAccessedAt: '2025-01-18T12:00:00Z',
        isDefault: false,
      },
      {
        id: 'store_project4',
        name: 'Project Delta',
        createdAt: '2025-01-19T10:00:00Z',
        lastAccessedAt: '2025-01-19T12:00:00Z',
        isDefault: false,
      },
    ],
    removing: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'List with many instances to test scrolling and layout.',
      },
    },
  },
}

export const Removing: Story = {
  args: {
    instances: sampleInstances,
    removing: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'List in removing state with all remove buttons disabled.',
      },
    },
  },
}
