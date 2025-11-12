import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { UserListItem } from './UserListItem.js'

const meta = {
  title: 'Admin/UserListItem',
  component: UserListItem,
  decorators: [
    Story => (
      <ul className='divide-y divide-gray-200 bg-white shadow sm:rounded-md'>
        <Story />
      </ul>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Individual user list item component for the admin users page.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof UserListItem>

export default meta
type Story = StoryObj<typeof meta>

export const RegularUser: Story = {
  args: {
    user: {
      email: 'user@example.com',
      createdAt: '2025-01-15T10:00:00Z',
      storeIds: ['store_abc123', 'store_def456'],
      instanceCount: 2,
      isAdmin: false,
    },
  },
}

export const AdminUser: Story = {
  args: {
    user: {
      email: 'admin@example.com',
      createdAt: '2025-01-10T10:00:00Z',
      storeIds: ['store_admin123'],
      instanceCount: 1,
      isAdmin: true,
    },
  },
}

export const PowerUser: Story = {
  args: {
    user: {
      email: 'poweruser@example.com',
      createdAt: '2025-01-01T10:00:00Z',
      storeIds: Array.from({ length: 8 }, (_, i) => `store_${i}`),
      instanceCount: 8,
      isAdmin: false,
    },
  },
}

export const NewUser: Story = {
  args: {
    user: {
      email: 'newuser@example.com',
      createdAt: '2025-01-20T10:00:00Z',
      storeIds: ['store_new123'],
      instanceCount: 1,
      isAdmin: false,
    },
  },
}

export const LongEmail: Story = {
  args: {
    user: {
      email: 'very.long.email.address.that.might.truncate@example.com',
      createdAt: '2025-01-12T10:00:00Z',
      storeIds: ['store_long123'],
      instanceCount: 1,
      isAdmin: false,
    },
  },
}
