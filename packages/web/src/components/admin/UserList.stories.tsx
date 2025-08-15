import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { UserList } from './UserList.js'

const meta: Meta<typeof UserList> = {
  title: 'Components/Admin/UserList',
  component: UserList,
  decorators: [
    Story => (
      <div className='p-6 bg-gray-50 min-h-screen'>
        <div className='max-w-4xl mx-auto'>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'List component for displaying admin users with various states.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    users: [
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
}

export const EmptyState: Story = {
  args: {
    users: [],
  },
}

export const ManyUsers: Story = {
  args: {
    users: Array.from({ length: 15 }, (_, i) => ({
      email: `user${i + 1}@example.com`,
      createdAt: new Date(2025, 0, 10 + i).toISOString(),
      storeIds: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 },
        (_, j) => `store_${i}_${j}`
      ),
      instanceCount: Math.floor(Math.random() * 3) + 1,
      isAdmin: i === 0 || i === 5,
    })),
  },
}

export const AdminOnlyUsers: Story = {
  args: {
    users: [
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
}

export const PowerUsers: Story = {
  args: {
    users: [
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
    ],
  },
}
