import React, { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'

// Simplified AdminUsersPage component for Storybook
const AdminUsersPageStory = ({
  mockUsers = null,
  showError = false,
  showLoading = false,
}: {
  mockUsers?: any
  showError?: boolean
  showLoading?: boolean
}) => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(showLoading)
  const [error, setError] = useState<string | null>(showError ? 'Failed to load users' : null)

  useEffect(() => {
    if (showLoading) {
      // Keep loading state
      return
    }

    if (showError) {
      setError('Failed to load users')
      setLoading(false)
      return
    }

    // Simulate loading then set users
    setTimeout(() => {
      setUsers(
        mockUsers || [
          {
            email: 'admin@example.com',
            createdAt: '2025-01-10T10:00:00Z',
            storeIds: ['store_admin123'],
            instanceCount: 1,
            isAdmin: true,
          },
          {
            email: 'user1@example.com',
            createdAt: '2025-01-15T10:00:00Z',
            storeIds: ['store_abc123', 'store_def456'],
            instanceCount: 2,
            isAdmin: false,
          },
          {
            email: 'user2@example.com',
            createdAt: '2025-01-18T10:00:00Z',
            storeIds: ['store_xyz789'],
            instanceCount: 1,
            isAdmin: false,
          },
        ]
      )
      setLoading(false)
    }, 100)
  }, [mockUsers, showError, showLoading])

  const handleUserClick = (userEmail: string) => {
    console.log('Navigate to user detail:', userEmail)
  }

  return (
    <div className='p-6 bg-white min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>Admin Users</h1>
          <p className='text-gray-600 mt-1'>Manage registered users and their admin status</p>
        </div>

        {loading && (
          <div className='flex justify-center items-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-2 text-gray-600'>Loading users...</span>
          </div>
        )}

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4'>
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
                <h3 className='text-sm font-medium text-red-800'>Error loading users</h3>
                <div className='mt-2 text-sm text-red-700'>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className='text-center py-12'>
            <svg
              className='mx-auto h-12 w-12 text-gray-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
              />
            </svg>
            <h3 className='mt-2 text-sm font-medium text-gray-900'>No users found</h3>
            <p className='mt-1 text-sm text-gray-500'>No users have registered yet.</p>
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className='bg-white shadow overflow-hidden sm:rounded-md'>
            <ul className='divide-y divide-gray-200'>
              {users.map(user => (
                <li key={user.email}>
                  <button
                    onClick={() => handleUserClick(user.email)}
                    className='block hover:bg-gray-50 w-full text-left'
                  >
                    <div className='px-4 py-4 sm:px-6'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center'>
                          <p className='text-sm font-medium text-indigo-600 truncate'>
                            {user.email}
                          </p>
                          {user.isAdmin && (
                            <span className='ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                              Admin
                            </span>
                          )}
                        </div>
                        <div className='ml-2 flex-shrink-0 flex'>
                          <p className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'>
                            {user.instanceCount} instance{user.instanceCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className='mt-2 sm:flex sm:justify-between'>
                        <div className='sm:flex'>
                          <p className='flex items-center text-sm text-gray-500'>
                            Created: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

const meta: Meta<typeof AdminUsersPageStory> = {
  title: 'Components/Admin/AdminUsersPage',
  component: AdminUsersPageStory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Admin users list page showing all registered users with their instance counts and admin status.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mockUsers: {
      control: 'object',
      description: 'Mock users data for testing different scenarios',
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
    mockUsers: [
      {
        email: 'admin@example.com',
        createdAt: '2025-01-10T10:00:00Z',
        storeIds: ['store_admin123'],
        instanceCount: 1,
        isAdmin: true,
      },
      {
        email: 'user1@example.com',
        createdAt: '2025-01-15T10:00:00Z',
        storeIds: ['store_abc123', 'store_def456'],
        instanceCount: 2,
        isAdmin: false,
      },
      {
        email: 'user2@example.com',
        createdAt: '2025-01-18T10:00:00Z',
        storeIds: ['store_xyz789'],
        instanceCount: 1,
        isAdmin: false,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Default admin users list showing various users with different instance counts.',
      },
    },
  },
}

export const ManyUsers: Story = {
  args: {
    mockUsers: Array.from({ length: 15 }, (_, i) => ({
      email: `user${i + 1}@example.com`,
      createdAt: new Date(2025, 0, 10 + i).toISOString(),
      storeIds: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 },
        (_, j) => `store_${i}_${j}`
      ),
      instanceCount: Math.floor(Math.random() * 3) + 1,
      isAdmin: i === 0 || i === 5, // Make some users admins
    })),
  },
  parameters: {
    docs: {
      description: {
        story: 'Users list with many users to test scrolling and layout with larger datasets.',
      },
    },
  },
}

export const AdminOnlyList: Story = {
  args: {
    mockUsers: [
      {
        email: 'superadmin@example.com',
        createdAt: '2025-01-05T10:00:00Z',
        storeIds: ['store_super123', 'store_super456'],
        instanceCount: 2,
        isAdmin: true,
      },
      {
        email: 'admin1@example.com',
        createdAt: '2025-01-08T10:00:00Z',
        storeIds: ['store_admin123'],
        instanceCount: 1,
        isAdmin: true,
      },
      {
        email: 'admin2@example.com',
        createdAt: '2025-01-12T10:00:00Z',
        storeIds: ['store_admin456'],
        instanceCount: 1,
        isAdmin: true,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'List showing only admin users with admin badges prominently displayed.',
      },
    },
  },
}

export const EmptyState: Story = {
  args: {
    mockUsers: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no users have registered yet.',
      },
    },
  },
}

export const LoadingState: Story = {
  args: {
    showLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state while fetching users list.',
      },
    },
  },
}

export const ErrorState: Story = {
  args: {
    showError: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state when users list cannot be loaded.',
      },
    },
  },
}

export const PowerUsers: Story = {
  args: {
    mockUsers: [
      {
        email: 'poweruser1@example.com',
        createdAt: '2025-01-01T10:00:00Z',
        storeIds: Array.from({ length: 8 }, (_, i) => `store_power1_${i}`),
        instanceCount: 8,
        isAdmin: false,
      },
      {
        email: 'poweruser2@example.com',
        createdAt: '2025-01-02T10:00:00Z',
        storeIds: Array.from({ length: 12 }, (_, i) => `store_power2_${i}`),
        instanceCount: 12,
        isAdmin: true,
      },
      {
        email: 'regularuser@example.com',
        createdAt: '2025-01-15T10:00:00Z',
        storeIds: ['store_regular123'],
        instanceCount: 1,
        isAdmin: false,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Users with many instances to test the instance count display and formatting.',
      },
    },
  },
}
