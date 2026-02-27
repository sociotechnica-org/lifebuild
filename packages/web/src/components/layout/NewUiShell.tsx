import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { generateRoute, ROUTES } from '../../constants/routes.js'
import { useQuery } from '../../livestore-compat.js'
import { useAuth } from '../../contexts/AuthContext.js'
import { usePostHog } from '../../lib/analytics.js'
import { getUsers$ } from '@lifebuild/shared/queries'
import type { User } from '@lifebuild/shared/schema'
import { getInitials, isCurrentUserAdmin } from '../utils/helpers.js'
import { AttendantChatPanel } from './AttendantChatPanel.js'
import { AttendantRail } from './AttendantRail.js'
import { useAttendantRail } from './AttendantRailProvider.js'
import { LiveStoreStatus } from './LiveStoreStatus.js'
import { TaskQueuePanel } from '../task-queue/TaskQueuePanel.js'

type NewUiShellProps = {
  children: React.ReactNode
  /** When true, uses h-screen flex layout for full-height content like project views */
  fullHeight?: boolean
  /** When true, disables scrolling on main content (children handle their own scrolling, e.g. project views) */
  noScroll?: boolean
  /** When true, removes content padding/max-width so children can render edge-to-edge */
  fullBleed?: boolean
}

/**
 * Minimal shell for the next-generation UI surfaces.
 * Keeps the app header/chat chrome while providing configurable content geometry.
 */
export const NewUiShell: React.FC<NewUiShellProps> = ({
  children,
  fullHeight = false,
  noScroll = false,
  fullBleed = false,
}) => {
  const { activeAttendantId, toggleAttendant } = useAttendantRail()
  const location = useLocation()
  const { user: authUser, isAuthenticated, logout } = useAuth()
  const users = useQuery(getUsers$) ?? []
  const posthog = usePostHog()
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const currentUser = users.find((user: User) => user.id === authUser?.id)

  // Helper to get display name and email
  const getDisplayName = () => {
    // Prefer currentUser.name if available (comes from LiveStore user record)
    if (currentUser?.name) return currentUser.name
    // Fall back to authUser email
    if (authUser) return authUser.email
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

  const isLifeMapActive =
    location.pathname === ROUTES.HOME ||
    location.pathname === ROUTES.LIFE_MAP ||
    location.pathname === ROUTES.WORKSHOP ||
    location.pathname === ROUTES.SANCTUARY ||
    location.pathname.startsWith('/projects/')

  const handleFeedbackClick = () => {
    const surveyId = import.meta.env.VITE_POSTHOG_FEEDBACK_SURVEY_ID
    if (!surveyId) {
      // Fallback: open email client if survey not configured
      window.location.href = 'mailto:team@sociotechnica.org?subject=LifeBuild%20Feedback'
      return
    }
    if (posthog) {
      // PostHog API-triggered surveys: this event causes the survey popup to display
      posthog.capture('survey shown', { $survey_id: surveyId })
    } else {
      // PostHog not available, fallback to email
      window.location.href = 'mailto:team@sociotechnica.org?subject=LifeBuild%20Feedback'
    }
  }

  // Always use h-dvh flex layout for a full-viewport shell.
  // h-dvh (dynamic viewport height) accounts for iOS Safari address bar.
  const outerClasses = 'h-dvh flex flex-col overflow-hidden text-[#2f2b27] leading-relaxed'

  // fullHeight mode: full width content area
  // noScroll mode: children handle their own scrolling (e.g. project views with scrollable columns)
  // normal mode: content scrolls within the main area
  const mainClasses = fullHeight
    ? `flex-1 min-h-0 w-full ${noScroll ? 'overflow-hidden' : 'overflow-y-auto'}`
    : 'flex-1 min-h-0 overflow-y-auto'

  const contentClasses = fullBleed
    ? 'h-full w-full'
    : fullHeight
      ? 'h-full'
      : 'max-w-[1200px] mx-auto p-2'

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
            to={generateRoute.lifeMap()}
            className={`no-underline py-2 px-3 rounded-xl transition-all duration-[160ms] ${
              isLifeMapActive
                ? 'text-[#2f2b27] bg-black/[0.04]'
                : 'text-[#8b8680] hover:text-[#2f2b27]'
            }`}
          >
            Life Map
          </Link>
        </nav>
        <div className='flex items-center gap-4'>
          <button
            type='button'
            onClick={handleFeedbackClick}
            className='bg-transparent border-none text-sm font-medium text-[#8b8680] cursor-pointer px-3 py-2 rounded-lg transition-all duration-[160ms] hover:bg-black/[0.04] hover:text-[#2f2b27]'
            aria-label='Send feedback'
          >
            Feedback
          </button>
          {isAuthenticated && <LiveStoreStatus />}
          {isAuthenticated ? (
            <div className='flex flex-col items-end gap-1'>
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
            </div>
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
      <TaskQueuePanel />
      <AttendantRail activeAttendantId={activeAttendantId} onAttendantClick={toggleAttendant} />
      <AttendantChatPanel />
      <main className={`${mainClasses} ${fullBleed ? '' : 'p-3.5'}`}>
        <div className={contentClasses}>{children}</div>
      </main>
    </div>
  )
}
