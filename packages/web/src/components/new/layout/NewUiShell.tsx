import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { generateRoute, ROUTES } from '../../../constants/routes.js'
import { useQuery } from '@livestore/react'
import { useAuth } from '../../../contexts/AuthContext.js'
import { getUsers$ } from '@lifebuild/shared/queries'
import type { User } from '@lifebuild/shared/schema'
import { TableBar } from './TableBar.js'
import { getInitials } from '../../../utils/initials.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'
import { isCurrentUserAdmin } from '../../../utils/adminCheck.jsx'

type NewUiShellProps = {
  children: React.ReactNode
  isChatOpen?: boolean
  onChatToggle?: () => void
  /** When true, uses h-screen flex layout for full-height content like kanban boards */
  fullHeight?: boolean
  /** When true, disables scrolling on main content (children handle their own scrolling, e.g. kanban boards) */
  noScroll?: boolean
}

/**
 * Minimal shell for the next-generation UI surfaces.
 * Keeps legacy navigation/chat chrome out of new routes while providing
 * a consistent canvas and spacing baseline with persistent navigation and table bar.
 */
export const NewUiShell: React.FC<NewUiShellProps> = ({
  children,
  isChatOpen = false,
  onChatToggle,
  fullHeight = false,
  noScroll = false,
}) => {
  const location = useLocation()
  const { user: authUser, isAuthenticated, logout } = useAuth()
  const users = useQuery(getUsers$) ?? []
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const currentUser = users.find((user: User) => user.id === authUser?.id)

  // Helper to get display name and email
  const getDisplayName = () => {
    if (authUser) return authUser.email
    if (currentUser) return currentUser.name
    return 'User'
  }

  const getEmail = () => {
    if (authUser) return authUser.email
    return ''
  }

  // Handle dropdown toggle with position calculation
  const handleToggleDropdown = () => {
    if (!showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
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
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Always use h-screen flex layout to keep TableBar at the bottom
  // The main content area scrolls, TableBar stays fixed at bottom via flexbox
  const outerClasses = 'h-screen flex flex-col overflow-hidden text-[#2f2b27] leading-relaxed'

  // fullHeight mode: full width content area
  // noScroll mode: children handle their own scrolling (e.g. kanban boards with scrollable columns)
  // normal mode: content scrolls within the main area
  const mainClasses = fullHeight
    ? `flex-1 min-h-0 w-full ${noScroll ? 'overflow-hidden' : 'overflow-y-auto'}`
    : 'flex-1 min-h-0 overflow-y-auto'

  const contentClasses = fullHeight ? 'h-full' : 'max-w-[1200px] mx-auto p-2'

  return (
    <div
      className={outerClasses}
      style={{
        background:
          'radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.8), transparent 40%), #f5f3f0',
      }}
    >
      <header className='sticky top-0 z-[8] backdrop-blur-[10px] bg-[rgba(250,249,247,0.88)] border-b border-[#e8e4de] py-3.5 px-6 flex items-center justify-between flex-shrink-0'>
        <nav className='flex gap-4 items-center font-semibold'>
          <Link
            to={generateRoute.draftingRoom()}
            className={`no-underline py-2 px-3 rounded-xl transition-all duration-[160ms] ${
              isActive('/drafting-room')
                ? 'text-[#2f2b27] bg-black/[0.04]'
                : 'text-[#8b8680] hover:text-[#2f2b27]'
            }`}
          >
            Drafting Room
          </Link>
          <Link
            to={generateRoute.sortingRoom()}
            className={`no-underline py-2 px-3 rounded-xl transition-all duration-[160ms] ${
              isActive('/sorting-room')
                ? 'text-[#2f2b27] bg-black/[0.04]'
                : 'text-[#8b8680] hover:text-[#2f2b27]'
            }`}
          >
            Sorting Room
          </Link>
          <Link
            to='#'
            className='no-underline text-[#8b8680] py-2 px-3 rounded-xl opacity-50 pointer-events-none'
          >
            Roster Room
          </Link>
          <Link
            to={generateRoute.lifeMap()}
            className={`no-underline py-2 px-3 rounded-xl transition-all duration-[160ms] ${
              isActive('/life-map')
                ? 'text-[#2f2b27] bg-black/[0.04]'
                : 'text-[#8b8680] hover:text-[#2f2b27]'
            }`}
          >
            Life Map
          </Link>
        </nav>
        <div className='flex items-center gap-4'>
          {onChatToggle && (
            <button
              type='button'
              onClick={onChatToggle}
              className='bg-transparent border-none text-2xl cursor-pointer p-1 rounded-lg transition-all duration-[160ms] leading-none hover:bg-black/[0.04]'
              aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
              title={isChatOpen ? 'Close chat' : 'Open chat'}
            >
              💬
            </button>
          )}
          {isAuthenticated ? (
            <>
              <button
                ref={buttonRef}
                type='button'
                onClick={handleToggleDropdown}
                className='bg-[#2f2b27] text-[#faf9f7] p-3 rounded-full font-semibold text-sm shadow-[0_8px_16px_rgba(0,0,0,0.12)] cursor-pointer border-none hover:bg-[#3f3b37] transition-colors duration-[160ms]'
                title={getDisplayName()}
                data-testid='user-menu-button'
              >
                {getInitials(currentUser?.name || getDisplayName())}
              </button>

              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className='fixed min-w-64 max-w-80 bg-white rounded-md shadow-lg py-1 z-[9999] border border-[#e8e4de]'
                  style={{
                    top: `${dropdownPosition.top}px`,
                    right: `${dropdownPosition.right}px`,
                  }}
                >
                  <div className='px-4 py-2 text-sm text-[#2f2b27] border-b border-[#e8e4de]'>
                    <div className='font-medium truncate'>{getDisplayName()}</div>
                    <div className='text-[#8b8680] truncate'>{getEmail()}</div>
                  </div>
                  <Link
                    to={preserveStoreIdInUrl(ROUTES.SETTINGS)}
                    onClick={() => setShowDropdown(false)}
                    className='block px-4 py-2 text-sm text-[#2f2b27] hover:bg-black/[0.04] no-underline'
                  >
                    Settings
                  </Link>
                  {isCurrentUserAdmin(authUser) && (
                    <Link
                      to={ROUTES.ADMIN}
                      onClick={() => setShowDropdown(false)}
                      className='block px-4 py-2 text-sm text-[#2f2b27] hover:bg-black/[0.04] no-underline'
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    type='button'
                    onClick={async () => {
                      await logout()
                      setShowDropdown(false)
                    }}
                    className='block w-full text-left px-4 py-2 text-sm text-[#2f2b27] hover:bg-black/[0.04] bg-transparent border-none cursor-pointer'
                  >
                    Sign out
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              to={ROUTES.LOGIN}
              className='bg-[#2f2b27] text-[#faf9f7] py-2 px-4 rounded-xl font-semibold text-sm no-underline hover:bg-[#3f3b37] transition-colors duration-[160ms]'
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      <main className={`${mainClasses} p-3.5`}>
        <div className={contentClasses}>{children}</div>
      </main>
      <TableBar />
    </div>
  )
}
