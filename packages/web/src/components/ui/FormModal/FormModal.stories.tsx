import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { FormModal } from './FormModal.js'
import { useModalForm } from '../../../hooks/useModalForm.js'

const meta: Meta<typeof FormModal> = {
  title: 'Components/FormModal',
  component: FormModal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Reusable modal with standard form structure (header with close button, content area, footer with buttons). Works perfectly with the useModalForm hook.',
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
    isSubmitting: {
      control: 'boolean',
      description: 'Whether form is submitting',
    },
    submitDisabled: {
      control: 'boolean',
      description: 'Whether submit button is disabled',
    },
  },
  decorators: [
    Story => (
      <div style={{ height: '100vh', background: '#f5f5f5', padding: '2rem' }}>
        <h1>Background Content</h1>
        <p>Form modals provide a consistent structure for form-based interactions.</p>
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
    title: 'Create Project',
    children: (
      <div className='space-y-4'>
        <div>
          <label htmlFor='name' className='block text-sm font-medium text-gray-900 mb-2'>
            Project Name *
          </label>
          <input
            id='name'
            type='text'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter project name'
          />
        </div>
        <div>
          <label htmlFor='description' className='block text-sm font-medium text-gray-900 mb-2'>
            Description
          </label>
          <textarea
            id='description'
            rows={4}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical'
            placeholder='Enter description'
          />
        </div>
      </div>
    ),
    submitText: 'Create Project',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default form modal with header, content area, and footer buttons.',
      },
    },
  },
}

export const WithValidation: Story = {
  render: () => {
    interface FormValues {
      email: string
      password: string
    }

    const [isOpen, setIsOpen] = React.useState(true)

    const { values, errors, handleChange, handleSubmit, isSubmitting } = useModalForm<FormValues>({
      initialValues: { email: '', password: '' },
      isOpen,
      validate: values => {
        const errors: Partial<Record<keyof FormValues, string>> = {}
        if (!values.email) {
          errors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(values.email)) {
          errors.email = 'Email is invalid'
        }
        if (!values.password) {
          errors.password = 'Password is required'
        } else if (values.password.length < 8) {
          errors.password = 'Password must be at least 8 characters'
        }
        return errors
      },
      onSubmit: async values => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('Form submitted:', values)
        setIsOpen(false)
      },
    })

    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className='px-4 py-2 bg-blue-500 text-white rounded-md'
        >
          Open Form
        </button>

        <FormModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title='Sign In'
          onSubmit={handleSubmit}
          submitText='Sign In'
          submitDisabled={!values.email || !values.password}
          isSubmitting={isSubmitting}
        >
          <div className='space-y-4'>
            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-900 mb-2'>
                Email *
              </label>
              <input
                id='email'
                type='email'
                value={values.email}
                onChange={handleChange('email')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder='Enter your email'
              />
              {errors.email && <p className='text-red-500 text-sm mt-1'>{errors.email}</p>}
            </div>

            <div>
              <label htmlFor='password' className='block text-sm font-medium text-gray-900 mb-2'>
                Password *
              </label>
              <input
                id='password'
                type='password'
                value={values.password}
                onChange={handleChange('password')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder='Enter your password'
              />
              {errors.password && <p className='text-red-500 text-sm mt-1'>{errors.password}</p>}
            </div>
          </div>
        </FormModal>
      </>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive example using useModalForm hook with validation. Try submitting with invalid data!',
      },
    },
  },
}

export const LargeForm: Story = {
  args: {
    isOpen: true,
    title: 'Create New Task',
    maxWidth: 'max-w-2xl',
    children: (
      <div className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>Title *</label>
            <input
              type='text'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Task title'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>Priority</label>
            <select className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-900 mb-2'>Description</label>
          <textarea
            rows={4}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical'
            placeholder='Task description'
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>Due Date</label>
            <input
              type='date'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-900 mb-2'>Assignee</label>
            <select className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
              <option>Select assignee...</option>
              <option>John Doe</option>
              <option>Jane Smith</option>
            </select>
          </div>
        </div>
      </div>
    ),
    submitText: 'Create Task',
  },
  parameters: {
    docs: {
      description: {
        story: 'Larger form modal with custom max-width and complex form layout.',
      },
    },
  },
}

export const CustomFooter: Story = {
  args: {
    isOpen: true,
    title: 'Review Changes',
    children: (
      <div className='space-y-4'>
        <p className='text-gray-600'>Review the following changes before saving:</p>
        <div className='bg-gray-50 p-4 rounded-md space-y-2'>
          <div className='flex justify-between'>
            <span className='font-medium'>Name:</span>
            <span>Project Alpha → Project Beta</span>
          </div>
          <div className='flex justify-between'>
            <span className='font-medium'>Status:</span>
            <span>Active → Archived</span>
          </div>
        </div>
      </div>
    ),
    footer: (
      <div className='flex justify-between w-full'>
        <button className='px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md'>
          Reset Changes
        </button>
        <div className='flex gap-2'>
          <button className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'>
            Cancel
          </button>
          <button className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'>
            Save Changes
          </button>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Form modal with custom footer layout including additional actions.',
      },
    },
  },
}

export const LoadingState: Story = {
  args: {
    isOpen: true,
    title: 'Uploading Files',
    isSubmitting: true,
    children: (
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-900 mb-2'>File Name</label>
          <input
            type='text'
            value='document.pdf'
            disabled
            className='w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50'
          />
        </div>
        <div className='bg-gray-50 p-4 rounded-md'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm text-gray-600'>Uploading...</span>
            <span className='text-sm font-medium'>75%</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div className='bg-blue-500 h-2 rounded-full' style={{ width: '75%' }} />
          </div>
        </div>
      </div>
    ),
    submitText: 'Upload',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Form modal in loading/submitting state with disabled buttons and progress indicator.',
      },
    },
  },
}
