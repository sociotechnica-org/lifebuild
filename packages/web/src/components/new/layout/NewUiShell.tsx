import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { generateRoute } from '../../../constants/routes.js'
import { useQuery } from '@livestore/react'
import { useAuth } from '../../../contexts/AuthContext.js'
import { getUsers$ } from '@lifebuild/shared/queries'
import type { User } from '@lifebuild/shared/schema'
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
    <div
      className='min-h-screen text-[#2f2b27] leading-relaxed pb-36'
      style={{
        background:
          'radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.8), transparent 40%), #f5f3f0',
      }}
    >
      <header className='sticky top-0 z-[8] backdrop-blur-[10px] bg-[rgba(250,249,247,0.88)] border-b border-[#e8e4de] py-3.5 px-6 flex items-center justify-between'>
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
          <div className='bg-[#2f2b27] text-[#faf9f7] py-[0.45rem] px-3 rounded-full font-semibold text-sm shadow-[0_8px_16px_rgba(0,0,0,0.12)]'>
            {getInitials(currentUser?.name || 'User')}
          </div>
        </div>
      </header>
      <main className='max-w-[1200px] mx-auto p-2'>{children}</main>
      <TableBar />
    </div>
  )
}
