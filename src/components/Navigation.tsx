import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export const Navigation: React.FC = () => {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/projects') {
      return location.pathname === '/projects' || location.pathname.startsWith('/project/')
    }
    return location.pathname === path
  }

  return (
    <nav className='bg-white border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex space-x-8'>
            <Link
              to='/projects'
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive('/projects')
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Projects
            </Link>
            <Link
              to='/orphaned-tasks'
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive('/orphaned-tasks')
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Orphaned Tasks
            </Link>
            <Link
              to='/chat'
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive('/chat')
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Chat
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
