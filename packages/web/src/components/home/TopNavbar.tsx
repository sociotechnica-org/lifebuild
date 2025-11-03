import React from 'react'
import { motion } from 'framer-motion'
import { AuthStatusBanner } from '../auth/AuthStatusBanner.js'
import { UserProfile } from '../user/UserProfile.js'
import { CategoryId, CATEGORIES } from '../life-map/LifeMap.js'

interface TopNavbarProps {
  currentView: 'lifemap' | 'strategy'
  expandedCategoryId: CategoryId | null
  onLogoClick: () => void
}

/**
 * TopNavbar - Fixed top navigation bar
 * Shows LB logo with breadcrumb and user profile
 */
export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentView,
  expandedCategoryId,
  onLogoClick,
}) => {
  const [isLogoHovered, setIsLogoHovered] = React.useState(false)

  return (
    <div className='absolute top-0 left-0 right-0 z-50 pointer-events-none'>
      {/* Auth Status Banner - centered when shown */}
      <div className='flex justify-center pointer-events-auto'>
        <AuthStatusBanner />
      </div>

      {/* Top navbar */}
      <nav className='flex items-center justify-between px-4 py-3 pointer-events-auto'>
        {/* Left side - LB logo */}
        <div
          className='text-2xl cursor-pointer transition-transform'
          style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 400,
            transform: isLogoHovered ? 'translateY(-2px)' : 'translateY(0)',
          }}
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          onClick={onLogoClick}
        >
          LB
          <motion.span
            style={{
              fontSize: '1.125rem', // text-lg
              marginLeft: '0.5rem',
              color: '#4b5563', // text-gray-600
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: currentView === 'strategy' || expandedCategoryId ? 1 : 0,
              transition:
                currentView === 'strategy' || expandedCategoryId
                  ? { duration: 0.3, delay: 0.2, ease: 'easeOut' }
                  : { duration: 0.2, ease: 'easeIn' },
            }}
          >
            {currentView === 'strategy'
              ? ' > Strategy Studio'
              : expandedCategoryId
                ? ` > ${CATEGORIES.find(c => c.id === expandedCategoryId)?.label}`
                : ''}
          </motion.span>
        </div>

        {/* Right side - User Profile */}
        <UserProfile />
      </nav>
    </div>
  )
}
