import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import { getUsers$ } from '@work-squared/shared/queries'
import { getInitials } from '../../utils/initials.js'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'
import { ROUTES, ROUTE_PATTERNS } from '../../constants/routes.js'
import { useAuth } from '../../contexts/AuthContext.js'
import { isCurrentUserAdmin } from '../../utils/adminCheck.jsx'
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher.js'

interface NavigationProps {
  isChatOpen?: boolean
  onChatToggle?: () => void
}

export const Navigation: React.FC<NavigationProps> = ({ isChatOpen = false, onChatToggle }) => {
  const location = useLocation()
  const users = useQuery(getUsers$) ?? []
  const legacyUser = users[0] // Get first user as fallback for non-auth systems
  const { user: authUser, isAuthenticated, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

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
    return '' // Legacy users don't have email addresses
  }

  // Handle dropdown toggle with position calculation
  const handleToggleDropdown = () => {
    if (!showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap (mt-2)
        right: window.innerWidth - rect.right,
      })
    }
    setShowDropdown(!showDropdown)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (path: string) => {
    if (path === ROUTES.LIFE_MAP) {
      return (
        location.pathname === ROUTES.LIFE_MAP ||
        location.pathname === ROUTES.HOME ||
        location.pathname.startsWith(ROUTE_PATTERNS.CATEGORY)
      )
    }
    if (path === ROUTES.PROJECTS) {
      return (
        location.pathname === ROUTES.PROJECTS ||
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
    if (path === ROUTES.CONTACTS) {
      return location.pathname === ROUTES.CONTACTS
    }
    if (path === ROUTES.HISTORY) {
      return location.pathname === ROUTES.HISTORY
    }
    if (path === ROUTES.SETTINGS) {
      return location.pathname === ROUTES.SETTINGS
    }
    if (path === ROUTES.ADMIN) {
      return location.pathname === ROUTES.ADMIN
    }
    return location.pathname === path
  }

  return (
    <nav className='relative z-[100] bg-white border-b border-gray-200'>
      <div className='px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16 overflow-x-auto'>
          <div className='flex space-x-8'>
            <Link
              to={preserveStoreIdInUrl(ROUTES.LIFE_MAP)}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive(ROUTES.LIFE_MAP)
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Life Map
            </Link>
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
              to={preserveStoreIdInUrl(ROUTES.CONTACTS)}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive(ROUTES.CONTACTS)
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contacts
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
          <div className='flex items-center gap-4 relative'>
            {/* Workspace Switcher - only show when authenticated */}
            {isAuthenticated && <WorkspaceSwitcher />}

            {/* Chat Toggle Button */}
            {onChatToggle && (
              <button
                type='button'
                onClick={onChatToggle}
                className={`inline-flex items-center justify-center h-8 w-8 rounded-md mr-4 transition ${
                  isChatOpen
                    ? 'bg-gray-100 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
                title={isChatOpen ? 'Close chat' : 'Open chat'}
                aria-label={isChatOpen ? 'Close chat sidebar' : 'Open chat sidebar'}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='h-5 w-5'
                >
                  <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'></path>
                  <circle cx='9' cy='7' r='4'></circle>
                  <path d='M23 21v-2a4 4 0 0 0-3-3.87'></path>
                  <path d='M16 3.13a4 4 0 0 1 0 7.75'></path>
                </svg>
              </button>
            )}

            {isAuthenticated && currentUser ? (
              <>
                <button
                  ref={buttonRef}
                  onClick={handleToggleDropdown}
                  className='w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium hover:bg-blue-600'
                  title={getDisplayName()}
                  data-testid='user-menu-button'
                >
                  {getInitials(getDisplayName())}
                </button>

                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    className='fixed min-w-64 max-w-80 bg-white rounded-md shadow-lg py-1 z-[9999] border border-gray-200'
                    style={{
                      top: `${dropdownPosition.top}px`,
                      right: `${dropdownPosition.right}px`,
                    }}
                  >
                    <div className='px-4 py-2 text-sm text-gray-700 border-b border-gray-100'>
                      <div className='font-medium truncate'>{getDisplayName()}</div>
                      <div className='text-gray-500 truncate'>{getEmail()}</div>
                    </div>
                    <Link
                      to={preserveStoreIdInUrl(ROUTES.SETTINGS)}
                      onClick={() => setShowDropdown(false)}
                      className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                    >
                      Settings
                    </Link>
                    {isCurrentUserAdmin(authUser) && (
                      <Link
                        to={ROUTES.ADMIN}
                        onClick={() => setShowDropdown(false)}
                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                      >
                        Admin
                      </Link>
                    )}
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
              </>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
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
