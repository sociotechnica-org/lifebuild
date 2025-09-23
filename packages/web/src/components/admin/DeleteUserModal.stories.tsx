import type { Meta, StoryObj } from '@storybook/react'
import { DeleteUserModal } from './DeleteUserModal.js'

const meta = {
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
} satisfies Meta<typeof DeleteUserModal>

export default meta
type Story = StoryObj<typeof meta>

const defaultActions = {
  onConfirm: () => {},
  onCancel: () => {},
}

export const Default: Story = {
  args: {
    isOpen: true,
    userEmail: 'user@example.com',
    isDeleting: false,
    ...defaultActions,
  },
}

export const Deleting: Story = {
  args: {
    isOpen: true,
    userEmail: 'user@example.com',
    isDeleting: true,
    ...defaultActions,
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
    ...defaultActions,
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
    ...defaultActions,
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal in closed state (not visible).',
      },
    },
  },
}
