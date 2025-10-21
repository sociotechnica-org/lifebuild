import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ConfirmModal } from './ConfirmModal.js'

const meta: Meta<typeof ConfirmModal> = {
  title: 'Components/ConfirmModal',
  component: ConfirmModal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Reusable confirmation modal for yes/no decisions. Supports both regular and destructive actions with loading states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is visible',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when modal should close',
    },
    onConfirm: {
      action: 'confirmed',
      description: 'Callback when user confirms',
    },
    destructive: {
      control: 'boolean',
      description: 'Whether this is a destructive action (red button)',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether confirm action is loading',
    },
  },
  decorators: [
    Story => (
      <div style={{ height: '100vh', background: '#f5f5f5', padding: '2rem' }}>
        <h1>Background Content</h1>
        <p>Confirmation modals appear centered with a dark backdrop.</p>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed with this action?',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default confirmation modal with standard styling.',
      },
    },
  },
}

export const Destructive: Story = {
  args: {
    isOpen: true,
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText: 'Delete',
    destructive: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Destructive action with red confirm button for dangerous operations.',
      },
    },
  },
}

export const CustomButtons: Story = {
  args: {
    isOpen: true,
    title: 'Archive Document',
    message:
      'Are you sure you want to archive this document? It will be removed from all lists but can be restored later.',
    confirmText: 'Archive',
    cancelText: 'Keep Document',
  },
  parameters: {
    docs: {
      description: {
        story: 'Confirmation modal with custom button text.',
      },
    },
  },
}

export const Loading: Story = {
  args: {
    isOpen: true,
    title: 'Delete Account',
    message: 'Are you sure you want to delete your account? This action cannot be undone.',
    confirmText: 'Delete Account',
    destructive: true,
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal in loading state - buttons are disabled and confirm shows "Loading...".',
      },
    },
  },
}

export const LongMessage: Story = {
  args: {
    isOpen: true,
    title: 'Update Terms of Service',
    message: (
      <div>
        <p className='mb-3'>
          We've updated our Terms of Service to provide more clarity around data usage and privacy.
        </p>
        <p className='mb-3'>Key changes include:</p>
        <ul className='list-disc list-inside mb-3 space-y-1'>
          <li>Enhanced data protection measures</li>
          <li>Clearer explanation of data retention policies</li>
          <li>Updated third-party service disclosures</li>
        </ul>
        <p>Do you accept the updated Terms of Service?</p>
      </div>
    ),
    confirmText: 'Accept',
    cancelText: 'Review Later',
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal with complex message content including lists and multiple paragraphs.',
      },
    },
  },
}

export const MultipleConfirmations: Story = {
  render: () => {
    const [currentModal, setCurrentModal] = React.useState<
      'none' | 'archive' | 'delete' | 'publish'
    >('none')

    return (
      <div className='p-8'>
        <div className='space-x-4'>
          <button
            onClick={() => setCurrentModal('archive')}
            className='px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300'
          >
            Archive Item
          </button>
          <button
            onClick={() => setCurrentModal('delete')}
            className='px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200'
          >
            Delete Item
          </button>
          <button
            onClick={() => setCurrentModal('publish')}
            className='px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200'
          >
            Publish Item
          </button>
        </div>

        <ConfirmModal
          isOpen={currentModal === 'archive'}
          onClose={() => setCurrentModal('none')}
          onConfirm={() => {
            console.log('Archived!')
            setCurrentModal('none')
          }}
          title='Archive Item'
          message='This will move the item to the archive. You can restore it later.'
          confirmText='Archive'
        />

        <ConfirmModal
          isOpen={currentModal === 'delete'}
          onClose={() => setCurrentModal('none')}
          onConfirm={() => {
            console.log('Deleted!')
            setCurrentModal('none')
          }}
          title='Delete Item'
          message='This action cannot be undone. Are you sure?'
          confirmText='Delete'
          destructive
        />

        <ConfirmModal
          isOpen={currentModal === 'publish'}
          onClose={() => setCurrentModal('none')}
          onConfirm={() => {
            console.log('Published!')
            setCurrentModal('none')
          }}
          title='Publish Item'
          message='This will make the item visible to everyone. Continue?'
          confirmText='Publish'
        />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example showing multiple different confirmation modals in action.',
      },
    },
  },
}
