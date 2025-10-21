import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Modal } from './Modal.js'

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Reusable modal component with consistent z-index (9999) to appear above navigation. Supports backdrop blur, different alignments, and escape/backdrop close handling.',
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
    maxWidth: {
      control: 'text',
      description: 'Tailwind max-width class (e.g., max-w-md, max-w-2xl)',
    },
    backdropBlur: {
      control: 'boolean',
      description: 'Whether to blur the backdrop',
    },
    closeOnBackdropClick: {
      control: 'boolean',
      description: 'Whether clicking backdrop closes modal',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Whether pressing Escape closes modal',
    },
    align: {
      control: 'select',
      options: ['start', 'center'],
      description: 'Vertical alignment of modal',
    },
  },
  decorators: [
    Story => (
      <div style={{ height: '100vh', background: '#f5f5f5', padding: '2rem' }}>
        <h1>Background Content</h1>
        <p>This content should be visible through the backdrop.</p>
        <div style={{ marginBottom: '1rem' }}>
          <button style={{ padding: '0.5rem 1rem', marginRight: '1rem' }}>Sample Button</button>
          <button style={{ padding: '0.5rem 1rem' }}>Another Button</button>
        </div>
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
    children: (
      <div className='p-6'>
        <h2 className='text-lg font-semibold mb-4'>Modal Title</h2>
        <p className='text-gray-600 mb-4'>This is a simple modal with default settings.</p>
        <div className='flex justify-end gap-2'>
          <button className='px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200'>Cancel</button>
          <button className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'>
            Confirm
          </button>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default modal with backdrop blur, top alignment, and closes on backdrop/escape.',
      },
    },
  },
}

export const CenterAligned: Story = {
  args: {
    isOpen: true,
    align: 'center',
    children: (
      <div className='p-6'>
        <h2 className='text-lg font-semibold mb-4'>Centered Modal</h2>
        <p className='text-gray-600 mb-4'>This modal is vertically centered.</p>
        <div className='flex justify-end gap-2'>
          <button className='px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200'>Cancel</button>
          <button className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'>
            Confirm
          </button>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal with center vertical alignment, useful for confirmation dialogs.',
      },
    },
  },
}

export const NoBackdropBlur: Story = {
  args: {
    isOpen: true,
    backdropBlur: false,
    children: (
      <div className='p-6'>
        <h2 className='text-lg font-semibold mb-4'>No Backdrop Blur</h2>
        <p className='text-gray-600 mb-4'>This modal uses a dark backdrop without blur effect.</p>
        <div className='flex justify-end gap-2'>
          <button className='px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200'>Cancel</button>
          <button className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'>
            Confirm
          </button>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal with solid dark backdrop instead of blur effect.',
      },
    },
  },
}

export const LargeContent: Story = {
  args: {
    isOpen: true,
    maxWidth: 'max-w-2xl',
    children: (
      <div className='p-6'>
        <h2 className='text-lg font-semibold mb-4'>Large Modal</h2>
        <div className='space-y-4 text-gray-600'>
          <p>This modal has a larger max-width (max-w-2xl).</p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </p>
          <p>
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
            commodo consequat.
          </p>
        </div>
        <div className='flex justify-end gap-2 mt-6'>
          <button className='px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200'>Cancel</button>
          <button className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'>
            Confirm
          </button>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal with custom max-width for larger content.',
      },
    },
  },
}

export const FormExample: Story = {
  args: {
    isOpen: true,
    children: (
      <form
        onSubmit={e => {
          e.preventDefault()
          console.log('Form submitted')
        }}
      >
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-lg font-semibold'>Create New Item</h2>
          <button
            type='button'
            className='text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100'
            aria-label='Close modal'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <div className='p-6 space-y-4'>
          <div>
            <label htmlFor='name' className='block text-sm font-medium text-gray-900 mb-2'>
              Name *
            </label>
            <input
              id='name'
              type='text'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Enter name'
            />
          </div>

          <div>
            <label htmlFor='description' className='block text-sm font-medium text-gray-900 mb-2'>
              Description
            </label>
            <textarea
              id='description'
              rows={4}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical min-h-[100px]'
              placeholder='Enter description (optional)'
            />
          </div>
        </div>

        <div className='flex gap-3 px-6 py-4 border-t border-gray-200'>
          <button
            type='submit'
            className='flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors'
          >
            Create
          </button>
          <button
            type='button'
            className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
          >
            Cancel
          </button>
        </div>
      </form>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of using Modal with a form including header, content, and footer sections.',
      },
    },
  },
}

export const NoCloseOnBackdrop: Story = {
  args: {
    isOpen: true,
    closeOnBackdropClick: false,
    children: (
      <div className='p-6'>
        <h2 className='text-lg font-semibold mb-4'>Important Action</h2>
        <p className='text-gray-600 mb-4'>
          This modal requires explicit action. Clicking the backdrop will not close it.
        </p>
        <div className='flex justify-end gap-2'>
          <button className='px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200'>Cancel</button>
          <button className='px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600'>
            Confirm Delete
          </button>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Modal that requires explicit user action - clicking backdrop does not close. Try clicking outside!',
      },
    },
  },
}
