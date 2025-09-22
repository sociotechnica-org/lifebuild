import type { Meta, StoryObj } from '@storybook/react'
import { AdminToggle, type AdminToggleProps } from './AdminToggle.js'

const meta: Meta<AdminToggleProps> = {
  title: 'Components/Admin/AdminToggle',
  component: AdminToggle as any,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A toggle component for managing user admin status with a modern switch interface.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isAdmin: {
      control: 'boolean',
      description: 'Whether the user currently has admin privileges',
    },
    onToggle: {
      action: 'toggle',
      description: 'Callback when toggle is clicked with new admin status',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the toggle is disabled (e.g., during update)',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const AdminUser: Story = {
  args: {
    isAdmin: true,
    onToggle: () => {},
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle showing a user with admin privileges.',
      },
    },
  },
}

export const RegularUser: Story = {
  args: {
    isAdmin: false,
    onToggle: () => {},
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle showing a regular user without admin privileges.',
      },
    },
  },
}

export const DisabledAdmin: Story = {
  args: {
    isAdmin: true,
    onToggle: () => {},
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle disabled during update operation for an admin user.',
      },
    },
  },
}

export const DisabledRegular: Story = {
  args: {
    isAdmin: false,
    onToggle: () => {},
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle disabled during update operation for a regular user.',
      },
    },
  },
}

export const InteractiveDemo: Story = {
  args: {
    isAdmin: false,
    onToggle: () => {},
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Try clicking the toggle to see the admin status change.',
      },
    },
  },
}
