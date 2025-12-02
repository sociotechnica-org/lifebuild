import React from 'react'
import '../new-ui.css'
import { Link, useLocation } from 'react-router-dom'
import { generateRoute } from '../../../constants/routes.js'
import { useQuery } from '@livestore/react'
import { useAuth } from '../../../contexts/AuthContext.js'
import { getUsers$ } from '@work-squared/shared/queries'
import type { User } from '@work-squared/shared/schema'
import { TableBar } from './TableBar.js'
import { getInitials } from '../../../utils/initials.js'

type NewUiShellProps = {
  children: React.ReactNode
  isChatOpen?: boolean
  onChatToggle?: () => void
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
}) => {
  const location = useLocation()
  const { user: authUser } = useAuth()
  const users = useQuery(getUsers$) ?? []

  const currentUser = users.find((user: User) => user.id === authUser?.id)

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className='new-ui-container'>
      <header className='new-ui-header'>
        <nav className='new-ui-nav-links'>
          <Link
            to={generateRoute.newDraftingRoom()}
            className={isActive('/new/drafting-room') ? 'active' : ''}
          >
            Drafting Room
          </Link>
          <Link
            to='#'
            className={isActive('/new/sorting-room') ? 'active' : ''}
            style={{ opacity: 0.5, pointerEvents: 'none' }}
          >
            Sorting Room
          </Link>
          <Link
            to='#'
            className={isActive('/new/roster-room') ? 'active' : ''}
            style={{ opacity: 0.5, pointerEvents: 'none' }}
          >
            Roster Room
          </Link>
          <Link
            to={generateRoute.newLifeMap()}
            className={isActive('/new/life-map') ? 'active' : ''}
          >
            Life Map
          </Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onChatToggle && (
            <button
              type='button'
              onClick={onChatToggle}
              className='new-ui-chat-toggle'
              aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
              title={isChatOpen ? 'Close chat' : 'Open chat'}
            >
              💬
            </button>
          )}
          <div className='new-ui-user-pill'>{getInitials(currentUser?.name || 'User')}</div>
        </div>
      </header>
      <main className='new-ui-main'>{children}</main>
      <TableBar />
    </div>
  )
}
