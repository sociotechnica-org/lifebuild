import React from 'react'
import { Link } from 'react-router-dom'
import { formatRegistrationDate } from '../../util/dates.js'
import { generateRoute } from '../../constants/routes.js'

export interface AdminUser {
  email: string
  createdAt: string
  storeIds: string[]
  instanceCount: number
  isAdmin?: boolean
}

interface UserListItemProps {
  user: AdminUser
}

export const UserListItem: React.FC<UserListItemProps> = ({ user }) => {
  return (
    <li>
      <Link
        to={generateRoute.adminUser(user.email)}
        className='block hover:bg-gray-50 w-full text-left transition-colors duration-150'
      >
        <div className='px-4 py-4 sm:px-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <p className='text-sm font-medium text-indigo-600 truncate'>{user.email}</p>
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
                Created: {formatRegistrationDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </li>
  )
}
