import React from 'react'
import { UserListItem } from './UserListItem.js'

export interface AdminUser {
  email: string
  createdAt: string
  storeIds: string[]
  instanceCount: number
  isAdmin?: boolean
}

interface UserListProps {
  users: AdminUser[]
}

export const UserList: React.FC<UserListProps> = ({ users }) => {
  if (users.length === 0) {
    return (
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
    )
  }

  return (
    <div className='bg-white shadow overflow-hidden sm:rounded-md'>
      <ul className='divide-y divide-gray-200'>
        {users.map(user => (
          <UserListItem key={user.email} user={user} />
        ))}
      </ul>
    </div>
  )
}
