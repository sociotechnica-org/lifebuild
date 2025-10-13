import React from 'react'
import { WorkSquaredLogo } from '../components/ui/WorkSquaredLogo.js'
import { UserAvatar } from '../components/ui/UserAvatar.js'
import { AdvisorRail, type Advisor } from '../components/advisors/AdvisorRail.js'
import {
  ProjectCategorySquare,
  type ProjectCategory,
} from '../components/projects/ProjectCategorySquare.js'
import { SANCTUARY_WHITE, SOFT_PLATINUM, WARM_STONE, CLAY_BROWN } from '../styles/colors.js'

export interface HomePageProps {
  // User data
  userInitials: string
  userName?: string
  userEmail?: string
  isAuthenticated?: boolean
  isAdmin?: boolean
  onLogout?: () => void

  // Advisors (workers)
  advisors: Advisor[]
  selectedAdvisorId?: string | null
  onAdvisorClick: (advisorId: string) => void

  // Project categories
  categories: ProjectCategory[]
  onCategoryClick?: (category: ProjectCategory) => void

  // Chat window
  isChatOpen?: boolean
  chatAdvisorName?: string
  onChatClose?: () => void
}

/**
 * HomePage Presenter - High-level workspace with warm neutral palette
 *
 * Features the LifeSquared design system:
 * - Sanctuary White background with subtle warm texture
 * - W² logo in top-left (warm neutral scrabble tile)
 * - User avatar in top-right with popover
 * - Geometric advisor avatars on left rail
 * - 4x2 grid of project category squares with progressive materialization
 * - Animated chat window that slides in from left
 */
export const HomePage: React.FC<HomePageProps> = ({
  userInitials,
  userName,
  userEmail,
  isAuthenticated = false,
  isAdmin = false,
  onLogout,
  advisors,
  selectedAdvisorId,
  onAdvisorClick,
  categories,
  onCategoryClick,
  isChatOpen = false,
  chatAdvisorName,
  onChatClose,
}) => {
  return (
    <div
      className='min-h-screen relative'
      style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(210, 180, 140, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(232, 220, 200, 0.4) 0%, transparent 50%),
          linear-gradient(135deg,
            #FAF8F3 0%,
            #F5F0E8 30%,
            #EFE8DC 70%,
            #E8E0D0 100%
          ),
          repeating-linear-gradient(
            90deg,
            transparent 0px,
            transparent 100px,
            rgba(200, 180, 150, 0.08) 100px,
            rgba(200, 180, 150, 0.08) 102px
          )
        `,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Top-left: W² Logo */}
      <div className='fixed top-6 left-6 z-20'>
        <WorkSquaredLogo />
      </div>

      {/* Top-right: User Avatar */}
      <div className='fixed top-6 right-6 z-20'>
        <UserAvatar
          initials={userInitials}
          displayName={userName}
          email={userEmail}
          isAuthenticated={isAuthenticated}
          showAdminLink={isAdmin}
          onLogout={onLogout}
        />
      </div>

      {/* Left: Advisor Rail */}
      <AdvisorRail
        advisors={advisors}
        selectedAdvisorId={selectedAdvisorId}
        onAdvisorClick={onAdvisorClick}
      />

      {/* Main Content Area */}
      <div className='flex min-h-screen'>
        {/* Chat Window (left side when open) */}
        <div
          className='transition-all duration-300 ease-in-out overflow-hidden'
          style={{
            width: isChatOpen ? '384px' : '0',
          }}
        >
          {isChatOpen && (
            <div
              className='h-screen border-r p-6'
              style={{
                backgroundColor: `${SANCTUARY_WHITE}F0`,
                backdropFilter: 'blur(8px)',
                borderColor: `${CLAY_BROWN}30`,
              }}
            >
              <div className='flex justify-between items-center mb-4'>
                <h2
                  className='text-xl font-bold'
                  style={{
                    color: CLAY_BROWN,
                    fontFamily: 'Inter Display, sans-serif',
                  }}
                >
                  Chat with {chatAdvisorName || 'Advisor'}
                </h2>
                <button
                  onClick={onChatClose}
                  className='text-2xl leading-none hover:opacity-70 transition-opacity'
                  style={{ color: CLAY_BROWN }}
                >
                  ×
                </button>
              </div>
              <div
                className='text-sm'
                style={{
                  color: CLAY_BROWN,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Chat interface coming soon...
              </div>
            </div>
          )}
        </div>

        {/* Center: Project Category Grid */}
        <div className='flex-1 flex items-center justify-center p-12 transition-all duration-300'>
          <div className='max-w-6xl w-full'>
            <div
              className='grid gap-8 transition-all duration-300'
              style={{
                gridTemplateColumns: isChatOpen
                  ? 'repeat(2, minmax(0, 1fr))'
                  : 'repeat(4, minmax(0, 1fr))',
                gridAutoRows: '1fr',
              }}
            >
              {categories.map(category => (
                <div key={category.id} style={{ aspectRatio: '1 / 1' }}>
                  <ProjectCategorySquare category={category} onClick={onCategoryClick} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
