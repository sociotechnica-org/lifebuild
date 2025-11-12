import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'

// Create a simplified modal component for Storybook that doesn't need LiveStore
const CreateProjectModalStory = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [errors, setErrors] = React.useState<{ name?: string; description?: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For Storybook, just show in console
    console.log('Project would be created:', { name: name.trim(), description: description.trim() })
    onClose()
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    if (errors.name) {
      setErrors({ ...errors, name: undefined })
    }
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    if (errors.description) {
      setErrors({ ...errors, description: undefined })
    }
  }

  const validateForm = () => {
    const newErrors: { name?: string; description?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Project name is required'
    }

    if (description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setErrors({})
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-[9999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-start justify-between p-6 border-b border-gray-200'>
          <h3 className='text-lg font-semibold leading-6 text-gray-900'>Create New Project</h3>
          <button
            onClick={handleClose}
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

        {/* Content */}
        <div className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Project Name */}
            <div>
              <label
                htmlFor='project-name'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Project Name *
              </label>
              <input
                type='text'
                id='project-name'
                value={name}
                onChange={handleNameChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Enter project name'
                autoFocus
              />
              {errors.name && <p className='mt-1 text-sm text-red-600'>{errors.name}</p>}
            </div>

            {/* Project Description */}
            <div>
              <label
                htmlFor='project-description'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Description
              </label>
              <textarea
                id='project-description'
                rows={4}
                value={description}
                onChange={handleDescriptionChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[100px] ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Describe the project goals and context (optional)'
                maxLength={500}
              />
              <div className='mt-1 flex justify-between'>
                <div>
                  {errors.description && (
                    <p className='text-sm text-red-600'>{errors.description}</p>
                  )}
                </div>
                <p className='text-sm text-gray-500'>{description.length}/500 characters</p>
              </div>
            </div>

            {/* Actions */}
            <div className='flex justify-end space-x-3 pt-4'>
              <button
                type='button'
                onClick={handleClose}
                className='px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                onClick={e => {
                  e.preventDefault()
                  if (validateForm()) {
                    handleSubmit(e)
                  }
                }}
                className='px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors'
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const meta: Meta<typeof CreateProjectModalStory> = {
  title: 'Components/Modals/CreateProjectModal',
  component: CreateProjectModalStory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Modal for creating new projects with name and description fields. Includes form validation and character counting.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls whether the modal is visible',
    },
    onClose: {
      action: 'closed',
      description: 'Called when the modal should be closed',
    },
  },
  decorators: [
    Story => (
      <div style={{ height: '100vh', background: '#f5f5f5', padding: '2rem' }}>
        <h1>Background Content (to show backdrop blur)</h1>
        <p>This content should be blurred when the modal is open.</p>
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
  },
}

export const Closed: Story = {
  args: {
    isOpen: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'When closed, the modal is not rendered in the DOM.',
      },
    },
  },
}

export const ValidationExample: Story = {
  args: {
    isOpen: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates form validation. Try submitting without a name or enter more than 500 characters in the description to see validation errors.',
      },
    },
  },
}
