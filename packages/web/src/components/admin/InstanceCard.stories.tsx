import type { Meta, StoryObj } from '@storybook/react'
import { InstanceCard } from './InstanceCard.js'

const meta = {
  title: 'Admin/InstanceCard',
  component: InstanceCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A card component for displaying individual user instances with remove functionality.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    instance: {
      control: 'object',
      description: 'Instance data to display',
    },
    onRemove: {
      action: 'remove',
      description: 'Callback when remove button is clicked',
    },
    removing: {
      control: 'boolean',
      description: 'Whether a remove operation is in progress',
    },
  },
} satisfies Meta<typeof InstanceCard>

export default meta
type Story = StoryObj<typeof meta>

const sampleInstance = {
  id: 'store_abc123',
  name: 'Personal Workspace',
  createdAt: '2025-01-15T10:00:00Z',
  lastAccessedAt: '2025-01-15T12:00:00Z',
  role: 'member',
  isDefault: false,
}

const defaultInstance = {
  ...sampleInstance,
  id: 'store_default',
  name: 'Default Workspace',
  role: 'owner',
  isDefault: true,
}

export const Default: Story = {
  args: {
    instance: sampleInstance,
    removing: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'A regular instance card with remove functionality.',
      },
    },
  },
}

export const DefaultInstance: Story = {
  args: {
    instance: defaultInstance,
    removing: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'An instance card for the default instance, which cannot be removed.',
      },
    },
  },
}

export const Removing: Story = {
  args: {
    instance: sampleInstance,
    removing: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Instance card in removing state with disabled button.',
      },
    },
  },
}

export const WithoutRemove: Story = {
  args: {
    instance: sampleInstance,
    onRemove: undefined,
    removing: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Instance card without remove functionality.',
      },
    },
  },
}

export const LongInstanceName: Story = {
  args: {
    instance: {
      ...sampleInstance,
      name: 'Very Long Instance Name That Might Wrap to Multiple Lines in the Interface',
      id: 'store_very_long_instance_name_that_might_cause_layout_issues',
    },
    removing: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Instance card with long name to test layout behavior.',
      },
    },
  },
}
