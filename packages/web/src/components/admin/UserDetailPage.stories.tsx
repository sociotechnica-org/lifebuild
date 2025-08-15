import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'

// Simplified UserDetailPage component for Storybook
const UserDetailPageStory = ({
  userEmail = 'user@example.com',
  mockUser = null,
  showError = false,
  showLoading = false,
}: {
  userEmail?: string
  mockUser?: any
  showError?: boolean
  showLoading?: boolean
}) => {
  // Default user data
  const defaultUser = {
    id: '2',
    email: userEmail,
    createdAt: '2025-01-15T10:00:00Z',
    instances: [
      {
        id: 'store_abc123',
        name: 'Personal Workspace',
        createdAt: '2025-01-15T10:00:00Z',
        lastAccessedAt: '2025-01-15T12:00:00Z',
        isDefault: true,
      },
      {
        id: 'store_def456',
        name: 'Instance 2',
        createdAt: '2025-01-16T10:00:00Z',
        lastAccessedAt: '2025-01-16T12:00:00Z',
        isDefault: false,
      },
    ],
    isAdmin: false,
  }

  const user = mockUser || defaultUser
  const [currentUser, setCurrentUser] = useState(user)
  const [newInstanceId, setNewInstanceId] = useState('')

  const handleToggleAdmin = () => {
    setCurrentUser({ ...currentUser, isAdmin: !currentUser.isAdmin })
  }

  const handleAddInstance = () => {
    if (newInstanceId.trim()) {
      const newInstance = {
        id: newInstanceId,
        name: `Instance ${currentUser.instances.length + 1}`,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        isDefault: false,
      }
      setCurrentUser({
        ...currentUser,
        instances: [...currentUser.instances, newInstance],
      })
      setNewInstanceId('')
    }
  }

  const handleRemoveInstance = (instanceId: string) => {
    setCurrentUser({
      ...currentUser,
      instances: currentUser.instances.filter((instance: any) => instance.id !== instanceId),
    })
  }

  if (showLoading) {
    return (
      <div className='p-6 bg-white min-h-screen'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex justify-center items-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-2 text-gray-600'>Loading user details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (showError) {
    return (
      <div className='p-6 bg-white min-h-screen'>
        <div className='max-w-4xl mx-auto'>
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-5 w-5 text-red-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  aria-hidden='true'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>Error loading user</h3>
                <div className='mt-2 text-sm text-red-700'>
                  <p>User not found or failed to load user details.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 bg-white min-h-screen'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center gap-4 mb-3'>
            <button className='flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors'>
              <svg
                className='w-4 h-4 text-gray-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            </button>
            <nav className='flex items-center text-sm text-gray-500'>
              <span className='hover:text-gray-700 transition-colors'>Admin Users</span>
              <svg className='w-4 h-4 mx-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
              <span className='text-gray-900 font-medium'>{currentUser.email}</span>
            </nav>
          </div>

          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-3'>
                {currentUser.email}
                {currentUser.isAdmin && (
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                    Admin
                  </span>
                )}
              </h1>
              <p className='text-gray-600'>
                Created on {new Date(currentUser.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Status Section */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 mb-6'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>Admin Status</h2>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-900'>Admin Access</p>
              <p className='text-sm text-gray-500'>
                {currentUser.isAdmin
                  ? 'This user has administrator privileges'
                  : 'This user does not have administrator privileges'}
              </p>
            </div>
            <button
              onClick={handleToggleAdmin}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                currentUser.isAdmin ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  currentUser.isAdmin ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Instances Section */}
        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>Instances</h2>

          {/* Add Instance */}
          <div className='mb-6'>
            <div className='flex gap-3'>
              <input
                type='text'
                value={newInstanceId}
                onChange={e => setNewInstanceId(e.target.value)}
                placeholder='store_abc123'
                className='flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
              />
              <button
                onClick={handleAddInstance}
                disabled={!newInstanceId.trim()}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed'
              >
                Add Instance
              </button>
            </div>
          </div>

          {/* Instances List */}
          {currentUser.instances.length === 0 ? (
            <div className='text-center py-6'>
              <p className='text-gray-500'>No instances found for this user.</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {currentUser.instances.map((instance: any) => (
                <div
                  key={instance.id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                >
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <h3 className='text-sm font-medium text-gray-900'>{instance.name}</h3>
                      {instance.isDefault && (
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                          Default
                        </span>
                      )}
                    </div>
                    <p className='text-sm text-gray-500'>ID: {instance.id}</p>
                    <p className='text-xs text-gray-400'>
                      Created: {new Date(instance.createdAt).toLocaleDateString()} • Last accessed:{' '}
                      {new Date(instance.lastAccessedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveInstance(instance.id)}
                    disabled={instance.isDefault}
                    className='ml-4 inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
                  >
                    {instance.isDefault ? 'Default' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const meta: Meta<typeof UserDetailPageStory> = {
  title: 'Components/Admin/UserDetailPage',
  component: UserDetailPageStory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Admin user detail page for managing individual users, their instances, and admin status.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    userEmail: {
      control: 'text',
      description: 'Email of the user being managed',
    },
    mockUser: {
      control: 'object',
      description: 'Mock user data for testing different scenarios',
    },
    showError: {
      control: 'boolean',
      description: 'Show error state',
    },
    showLoading: {
      control: 'boolean',
      description: 'Show loading state',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    userEmail: 'user@example.com',
    mockUser: {
      id: '2',
      email: 'user@example.com',
      createdAt: '2025-01-15T10:00:00Z',
      instances: [
        {
          id: 'store_abc123',
          name: 'Personal Workspace',
          createdAt: '2025-01-15T10:00:00Z',
          lastAccessedAt: '2025-01-15T12:00:00Z',
          isDefault: true,
        },
        {
          id: 'store_def456',
          name: 'Instance 2',
          createdAt: '2025-01-16T10:00:00Z',
          lastAccessedAt: '2025-01-16T12:00:00Z',
          isDefault: false,
        },
      ],
      isAdmin: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Default user detail page showing a regular user with multiple instances.',
      },
    },
  },
}

export const AdminUser: Story = {
  args: {
    userEmail: 'admin@example.com',
    mockUser: {
      id: '1',
      email: 'admin@example.com',
      createdAt: '2025-01-10T10:00:00Z',
      instances: [
        {
          id: 'store_admin123',
          name: 'Personal Workspace',
          createdAt: '2025-01-10T10:00:00Z',
          lastAccessedAt: '2025-01-15T12:00:00Z',
          isDefault: true,
        },
      ],
      isAdmin: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'User detail page for an admin user, showing admin status badge.',
      },
    },
  },
}

export const NewUser: Story = {
  args: {
    userEmail: 'newuser@example.com',
    mockUser: {
      id: '3',
      email: 'newuser@example.com',
      createdAt: '2025-01-20T10:00:00Z',
      instances: [
        {
          id: 'store_new123',
          name: 'Personal Workspace',
          createdAt: '2025-01-20T10:00:00Z',
          lastAccessedAt: '2025-01-20T10:05:00Z',
          isDefault: true,
        },
      ],
      isAdmin: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'User detail page for a new user with only the default instance.',
      },
    },
  },
}

export const UserWithManyInstances: Story = {
  args: {
    userEmail: 'poweruser@example.com',
    mockUser: {
      id: '4',
      email: 'poweruser@example.com',
      createdAt: '2025-01-01T10:00:00Z',
      instances: [
        {
          id: 'store_default123',
          name: 'Personal Workspace',
          createdAt: '2025-01-01T10:00:00Z',
          lastAccessedAt: '2025-01-20T12:00:00Z',
          isDefault: true,
        },
        {
          id: 'store_project1',
          name: 'Instance 2',
          createdAt: '2025-01-05T10:00:00Z',
          lastAccessedAt: '2025-01-19T12:00:00Z',
          isDefault: false,
        },
        {
          id: 'store_project2',
          name: 'Instance 3',
          createdAt: '2025-01-10T10:00:00Z',
          lastAccessedAt: '2025-01-18T12:00:00Z',
          isDefault: false,
        },
        {
          id: 'store_project3',
          name: 'Instance 4',
          createdAt: '2025-01-15T10:00:00Z',
          lastAccessedAt: '2025-01-17T12:00:00Z',
          isDefault: false,
        },
      ],
      isAdmin: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'User with multiple instances showing the full instance management interface.',
      },
    },
  },
}

export const LoadingState: Story = {
  args: {
    userEmail: 'loading@example.com',
    showLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state while fetching user details.',
      },
    },
  },
}

export const ErrorState: Story = {
  args: {
    userEmail: 'error@example.com',
    showError: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state when user cannot be found or loaded.',
      },
    },
  },
}

export const InteractiveDemo: Story = {
  args: {
    userEmail: 'demo@example.com',
    mockUser: {
      id: '5',
      email: 'demo@example.com',
      createdAt: '2025-01-15T10:00:00Z',
      instances: [
        {
          id: 'store_demo123',
          name: 'Personal Workspace',
          createdAt: '2025-01-15T10:00:00Z',
          lastAccessedAt: '2025-01-20T12:00:00Z',
          isDefault: true,
        },
      ],
      isAdmin: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo - try adding instances, toggling admin status, and removing instances.',
      },
    },
  },
}
