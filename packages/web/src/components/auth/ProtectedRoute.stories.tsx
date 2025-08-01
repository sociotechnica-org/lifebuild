import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ProtectedRoute } from './ProtectedRoute.js'

// Simple protected content
const ProtectedContent = () => (
  <div className='p-8 bg-green-50 border border-green-200 rounded-lg'>
    <h2 className='text-xl font-semibold text-green-800 mb-2'>Protected Content</h2>
    <p className='text-green-700'>
      This content is only visible when authentication requirements are met.
    </p>
  </div>
)

// Simple story component - uses existing router and auth context from preview
const ProtectedRouteStory = () => {
  return (
    <div className='p-4'>
      <div className='mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
        <h1 className='text-lg font-semibold text-blue-800'>ProtectedRoute Demo</h1>
        <p className='text-sm text-blue-700'>
          Auth required:{' '}
          <strong>{import.meta.env.VITE_REQUIRE_AUTH === 'true' ? 'Yes' : 'No'}</strong>
        </p>
      </div>

      <ProtectedRoute>
        <ProtectedContent />
      </ProtectedRoute>
    </div>
  )
}

const meta: Meta<typeof ProtectedRouteStory> = {
  title: 'Components/Auth/ProtectedRoute',
  component: ProtectedRouteStory,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Higher-order component that protects routes by redirecting unauthenticated users to login.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Protected route with current auth context. Shows content if auth is disabled or user is authenticated.',
      },
    },
  },
}
