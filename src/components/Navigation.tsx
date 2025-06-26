import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import { getUsers$ } from '../livestore/queries.js'
import { getInitials } from '../util/initials.js'
import { preserveStoreIdInUrl } from '../util/navigation.js'

export const Navigation: React.FC = () => {
  const location = useLocation()
  const users = useQuery(getUsers$) ?? []
  const currentUser = users[0] // Get first user as current user

  const isActive = (path: string) => {
    if (path === '/projects') {
      return location.pathname === '/projects' || location.pathname.startsWith('/project/')
    }
    if (path === '/tasks') {
      return location.pathname === '/tasks'
    }
    return location.pathname === path
  }

  return (
    <nav className='bg-white border-b border-gray-200'>
      <div className='px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex space-x-8'>
            <Link
              to={preserveStoreIdInUrl('/projects')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive('/projects')
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Projects
            </Link>
            <Link
              to={preserveStoreIdInUrl('/tasks')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive('/tasks')
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tasks
            </Link>
          </div>

          {/* User Profile */}
          <div className='flex items-center'>
            {currentUser && (
              <div
                className='w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium'
                title={currentUser.name}
              >
                {getInitials(currentUser.name)}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
