import React, { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminUsersPage } from './AdminUsersPage.js'

// Mock auth context for admin users
const MockAuthProvider = ({ children, mockProps = {} }: { children: React.ReactNode; mockProps?: any }) => {
  const mockContext = {
    user: { id: '1', email: 'admin@example.com', isAdmin: true },
    isAuthenticated: true,
    isLoading: false,
    getCurrentToken: async () => 'mock-token',
    ...mockProps,
  }

  // Mock the auth context
  React.useEffect(() => {
    // Store original fetch
    const originalFetch = global.fetch

    // Mock fetch for auth service calls
    global.fetch = async (url: string | URL | Request, options?: any) => {
      const urlString = url.toString()

      if (urlString.includes('/admin/users') && !urlString.includes('/admin/users/')) {
        // Mock users list response
        return new Response(
          JSON.stringify({
            users: (mockProps as any).mockUsers || [
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
          }),
          { status: 200 }
        )
      }

      return originalFetch(url, options)
    }

    return () => {
      global.fetch = originalFetch
    }
  }, [])

  return <div data-mock-auth={JSON.stringify(mockContext)}>{children}</div>
}

// Story wrapper component
const AdminUsersPageStory = ({ mockUsers = null, authProps = {} }: { mockUsers?: any; authProps?: any }) => {
  useEffect(() => {
    // Set environment variables for Storybook
    ;(import.meta as any).env = {
      ...import.meta.env,
      VITE_AUTH_SERVICE_URL: 'http://localhost:8788',
    }
  }, [])

  return (
    <MockAuthProvider mockProps={{ mockUsers, ...authProps }}>
      <MemoryRouter initialEntries={['/admin']}>
        <AdminUsersPage />
      </MemoryRouter>
    </MockAuthProvider>
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
    authProps: {
      control: 'object',
      description: 'Mock auth context properties',
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
    authProps: {
      getCurrentToken: async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)) // Never resolves in Storybook
        return 'mock-token'
      },
    },
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
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Error state when users list cannot be loaded.',
      },
    },
  },
  beforeEach: () => {
    // Override fetch to return error for this story
    const originalFetch = global.fetch
    global.fetch = async (url: string | URL | Request) => {
      if (url.toString().includes('/admin/users')) {
        return new Response(JSON.stringify({ error: 'Failed to load users' }), { status: 500 })
      }
      return originalFetch(url)
    }

    return () => {
      global.fetch = originalFetch
    }
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

export const NonAdminAccess: Story = {
  args: {
    authProps: {
      user: { id: '2', email: 'user@example.com', isAdmin: false },
      isAuthenticated: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Non-admin user attempting to access admin pages - should redirect.',
      },
    },
  },
}

export const UnauthenticatedAccess: Story = {
  args: {
    authProps: {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Unauthenticated user attempting to access admin pages - should redirect to login.',
      },
    },
  },
}
