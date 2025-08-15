import type { Meta, StoryObj } from '@storybook/react'
import { DeleteUserModal } from './DeleteUserModal.js'

const meta: Meta<typeof DeleteUserModal> = {
  title: 'Components/Admin/DeleteUserModal',
  component: DeleteUserModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A confirmation modal for deleting users with safety warnings and loading states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls whether the modal is visible',
    },
    userEmail: {
      control: 'text',
      description: 'Email of the user being deleted',
    },
    isDeleting: {
      control: 'boolean',
      description: 'Shows loading state during deletion',
    },
    onConfirm: { action: 'confirmed' },
    onCancel: { action: 'cancelled' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isOpen: true,
    userEmail: 'user@example.com',
    isDeleting: false,
  },
}

export const Deleting: Story = {
  args: {
    isOpen: true,
    userEmail: 'user@example.com',
    isDeleting: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the modal in a loading state while the delete operation is in progress.',
      },
    },
  },
}

export const LongEmail: Story = {
  args: {
    isOpen: true,
    userEmail: 'very-long-email-address-that-might-wrap@company-with-a-very-long-domain-name.com',
    isDeleting: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests how the modal handles long email addresses.',
      },
    },
  },
}

export const Closed: Story = {
  args: {
    isOpen: false,
    userEmail: 'user@example.com',
    isDeleting: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal in closed state (not visible).',
      },
    },
  },
}
