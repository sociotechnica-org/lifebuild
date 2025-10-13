import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { preserveStoreIdInUrl } from '../../util/navigation.js'
import { ROUTES } from '../../constants/routes.js'

export interface UserAvatarProps {
  initials: string
  displayName?: string
  email?: string
  isAuthenticated?: boolean
  onLogout?: () => void
  showAdminLink?: boolean
}

/**
 * UserAvatar - Circular avatar with initials and dropdown menu
 *
 * Displays user initials in a circle with a popover menu for settings and logout
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  initials,
  displayName,
  email,
  isAuthenticated = false,
  onLogout,
  showAdminLink = false,
}) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  if (!isAuthenticated) {
    return (
      <Link
        to={ROUTES.LOGIN}
        className='inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white bg-black/20 hover:bg-black/30 backdrop-blur-sm transition-all'
      >
        Sign in
      </Link>
    )
  }

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className='w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent'
        title={displayName}
      >
        {initials}
      </button>

      {showDropdown && (
        <div className='absolute right-0 mt-2 min-w-64 max-w-80 bg-white/95 backdrop-blur-lg rounded-xl shadow-xl py-2 z-50 border border-gray-200'>
          {(displayName || email) && (
            <div className='px-4 py-3 text-sm text-gray-700 border-b border-gray-200'>
              {displayName && <div className='font-medium truncate'>{displayName}</div>}
              {email && <div className='text-gray-500 truncate text-xs mt-1'>{email}</div>}
            </div>
          )}
          <Link
            to={preserveStoreIdInUrl(ROUTES.SETTINGS)}
            onClick={() => setShowDropdown(false)}
            className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors'
          >
            Settings
          </Link>
          {showAdminLink && (
            <Link
              to={ROUTES.ADMIN}
              onClick={() => setShowDropdown(false)}
              className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors'
            >
              Admin
            </Link>
          )}
          {onLogout && (
            <button
              onClick={async () => {
                await onLogout()
                setShowDropdown(false)
              }}
              className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors'
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </div>
  )
}
