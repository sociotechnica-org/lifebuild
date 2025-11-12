import type { Meta, StoryObj } from '@storybook/react'
import { AddInstanceForm } from './AddInstanceForm.js'

const meta = {
  title: 'Admin/AddInstanceForm',
  component: AddInstanceForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A form component for adding new instances to a user account.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onAddInstance: {
      action: 'addInstance',
      description: 'Callback when form is submitted with a new instance ID',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the form is disabled (e.g., during submission)',
    },
  },
} satisfies Meta<typeof AddInstanceForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onAddInstance: () => {},
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default form state ready for input.',
      },
    },
  },
}

export const Disabled: Story = {
  args: {
    onAddInstance: () => {},
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Form disabled during submission or loading state.',
      },
    },
  },
}

export const InteractiveDemo: Story = {
  args: {
    onAddInstance: () => {},
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Try entering a store ID like "store_demo123" and submitting the form.',
      },
    },
  },
}
