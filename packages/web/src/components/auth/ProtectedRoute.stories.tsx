import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute.js'

// Sample protected content
const ProtectedContent = () => (
  <div className='p-8 bg-green-50 border border-green-200 rounded-lg'>
    <h2 className='text-xl font-semibold text-green-800 mb-2'>Protected Content</h2>
    <p className='text-green-700'>
      This content is only visible to authenticated users. If you can see this, the ProtectedRoute
      is allowing access because the user is authenticated.
    </p>
    <div className='mt-4 p-4 bg-green-100 rounded'>
      <h3 className='font-medium text-green-800'>Features available:</h3>
      <ul className='mt-2 text-sm text-green-700'>
        <li>• View projects</li>
        <li>• Create tasks</li>
        <li>• Access team collaboration</li>
      </ul>
    </div>
  </div>
)

const ProtectedRouteStory = ({ currentPath = '/projects' }: { currentPath?: string }) => {
  return (
    <MemoryRouter initialEntries={[currentPath]}>
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <h1 className='text-lg font-semibold text-blue-800'>ProtectedRoute Demo</h1>
            <p className='text-sm text-blue-700 mt-1'>
              Current path: <code className='bg-blue-100 px-1 rounded'>{currentPath}</code>
            </p>
            <p className='text-sm text-blue-700'>
              Auth required:{' '}
              <strong>
                {import.meta.env.VITE_REQUIRE_AUTH === 'true' && !import.meta.env.DEV
                  ? 'Yes'
                  : 'No'}
              </strong>
            </p>
          </div>

          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </div>
      </div>
    </MemoryRouter>
  )
}

const meta: Meta<typeof ProtectedRouteStory> = {
  title: 'Components/Auth/ProtectedRoute',
  component: ProtectedRouteStory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Higher-order component that protects routes by redirecting unauthenticated users to login.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentPath: {
      control: 'text',
      description: 'Current route path (affects redirect URL)',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    currentPath: '/projects',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Protected route with current auth context (will show content or redirect based on auth state).',
      },
    },
  },
}

export const WithRedirectPath: Story = {
  args: {
    currentPath: '/projects/123/tasks',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When accessing a specific protected route, the redirect preserves the intended destination.',
      },
    },
  },
}

export const HomePageRedirect: Story = {
  args: {
    currentPath: '/',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When accessing the home page while unauthenticated, redirects to simple login (no redirect parameter).',
      },
    },
  },
}
