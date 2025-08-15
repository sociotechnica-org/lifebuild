import React, { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { UserDetailPage } from './UserDetailPage.js'

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

      if (urlString.includes('/admin/users/')) {
        if (urlString.includes('/store-ids')) {
          // Mock store ID management response
          return new Response(
            JSON.stringify({
              success: true,
              user: (mockProps as any).mockUser || {
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
                ],
                isAdmin: false,
              },
              message: 'Instance updated successfully',
            }),
            { status: 200 }
          )
        } else if (urlString.includes('/admin-status')) {
          // Mock admin status update response
          return new Response(
            JSON.stringify({
              success: true,
              user: { ...(mockProps as any).mockUser, isAdmin: !(mockProps as any).mockUser?.isAdmin },
              message: 'Admin status updated successfully',
            }),
            { status: 200 }
          )
        } else {
          // Mock user detail response
          return new Response(
            JSON.stringify({
              user: (mockProps as any).mockUser || {
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
            }),
            { status: 200 }
          )
        }
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
const UserDetailPageStory = ({
  userEmail = 'user@example.com',
  mockUser = null,
  authProps = {},
}: { userEmail?: string; mockUser?: any; authProps?: any }) => {
  useEffect(() => {
    // Set environment variables for Storybook
    ;(import.meta as any).env = {
      ...import.meta.env,
      VITE_AUTH_SERVICE_URL: 'http://localhost:8788',
    }
  }, [])

  return (
    <MockAuthProvider mockProps={{ mockUser, ...authProps }}>
      <MemoryRouter initialEntries={[`/admin/users/${encodeURIComponent(userEmail)}`]}>
        <UserDetailPage />
      </MemoryRouter>
    </MockAuthProvider>
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
    authProps: {
      // Force loading state by not providing mock user initially
      getCurrentToken: async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)) // Never resolves in Storybook
        return 'mock-token'
      },
    },
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
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state when user cannot be found or loaded. Mock fetch will return 404.',
      },
    },
  },
  beforeEach: () => {
    // Override fetch to return error for this story
    const originalFetch = global.fetch
    global.fetch = async (url: string | URL | Request) => {
      if (url.toString().includes('/admin/users/error%40example.com')) {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
      }
      return originalFetch(url)
    }

    return () => {
      global.fetch = originalFetch
    }
  },
}

export const NonAdminAccess: Story = {
  args: {
    userEmail: 'user@example.com',
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
    userEmail: 'user@example.com',
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
