import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import { getUsers$ } from '@work-squared/shared/queries'
import { getInitials } from '../../util/initials.js'
import { preserveStoreIdInUrl } from '../../util/navigation.js'
import { ROUTES, ROUTE_PATTERNS } from '../../constants/routes.js'
import { useAuth } from '../../contexts/AuthContext.js'

export const Navigation: React.FC = () => {
  const location = useLocation()
  const users = useQuery(getUsers$) ?? []
  const legacyUser = users[0] // Get first user as fallback for non-auth systems
  const { user: authUser, isAuthenticated, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Use auth user if available, otherwise fall back to legacy user system
  const currentUser = authUser || legacyUser

  // Helper to get display name and email
  const getDisplayName = () => {
    if (authUser) return authUser.email // AuthUser only has email
    if (legacyUser) return legacyUser.name // Legacy user has name
    return 'User'
  }

  const getEmail = () => {
    if (authUser) return authUser.email
    if (legacyUser) return legacyUser.name // Legacy user uses name as display
    return ''
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (path: string) => {
    if (path === ROUTES.PROJECTS) {
      return (
        location.pathname === ROUTES.PROJECTS ||
        location.pathname === ROUTES.HOME ||
        location.pathname.startsWith(ROUTE_PATTERNS.PROJECT)
      )
    }
    if (path === ROUTES.TASKS) {
      return location.pathname === ROUTES.TASKS
    }
    if (path === ROUTES.TEAM) {
      return location.pathname === ROUTES.TEAM
    }
    if (path === ROUTES.DOCUMENTS) {
      return (
        location.pathname === ROUTES.DOCUMENTS ||
        location.pathname.startsWith(ROUTE_PATTERNS.DOCUMENT)
      )
    }
    if (path === ROUTES.HISTORY) {
      return location.pathname === ROUTES.HISTORY
    }
    return location.pathname === path
  }

  return (
    <nav className='bg-white border-b border-gray-200'>
      <div className='px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex space-x-8'>
            <Link
              to={preserveStoreIdInUrl(ROUTES.PROJECTS)}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive(ROUTES.PROJECTS)
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Projects
            </Link>
            <Link
              to={preserveStoreIdInUrl(ROUTES.TASKS)}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive(ROUTES.TASKS)
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tasks
            </Link>
            <Link
              to={preserveStoreIdInUrl(ROUTES.TEAM)}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive(ROUTES.TEAM)
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Team
            </Link>
            <Link
              to={preserveStoreIdInUrl(ROUTES.DOCUMENTS)}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive(ROUTES.DOCUMENTS)
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Documents
            </Link>
            <Link
              to={preserveStoreIdInUrl(ROUTES.HISTORY)}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive(ROUTES.HISTORY)
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              History
            </Link>
          </div>

          {/* User Profile / Auth */}
          <div className='flex items-center relative'>
            {isAuthenticated && currentUser ? (
              <div className='relative' ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className='w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  title={getDisplayName()}
                >
                  {getInitials(getDisplayName())}
                </button>

                {showDropdown && (
                  <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200'>
                    <div className='px-4 py-2 text-sm text-gray-700 border-b border-gray-100'>
                      <div className='font-medium'>{getDisplayName()}</div>
                      <div className='text-gray-500'>{getEmail()}</div>
                    </div>
                    <button
                      onClick={async () => {
                        await logout()
                        setShowDropdown(false)
                      }}
                      className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
