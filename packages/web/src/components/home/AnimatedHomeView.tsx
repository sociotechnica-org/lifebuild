import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LifeMap } from '../life-map/LifeMap.js'
import { StrategyStudio } from '../strategy-studio/StrategyStudio.js'
import { AuthStatusBanner } from '../auth/AuthStatusBanner.js'
import { UserProfile } from '../user/UserProfile.js'

type View = 'lifemap' | 'strategy'

/**
 * AnimatedHomeView - Manages navigation between LifeMap and Strategy Studio
 * with smooth slide animations using Framer Motion
 */
export const AnimatedHomeView: React.FC = () => {
  const [currentView, setCurrentView] = React.useState<View>('lifemap')
  const [isLogoHovered, setIsLogoHovered] = React.useState(false)

  // Expose navigation functions globally for easy access
  // This allows clicking elements in LifeMap or StrategyStudio to trigger navigation
  React.useEffect(() => {
    // @ts-ignore - Adding to window for global access
    window.navigateToStrategyStudio = () => setCurrentView('strategy')
    // @ts-ignore
    window.navigateToLifeMap = () => setCurrentView('lifemap')

    return () => {
      // @ts-ignore
      delete window.navigateToStrategyStudio
      // @ts-ignore
      delete window.navigateToLifeMap
    }
  }, [])

  // Keyboard shortcut: Up arrow for Strategy Studio, Down arrow for LifeMap
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input/textarea is focused
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCurrentView('strategy')
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCurrentView('lifemap')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className='w-full h-screen overflow-hidden relative'>
      {/* Animated content area - full screen */}
      <div className='absolute inset-0'>
        <AnimatePresence mode='sync' initial={false}>
          {currentView === 'strategy' ? (
            <motion.div
              key='strategy'
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            >
              <StrategyStudio hideNavbar />
            </motion.div>
          ) : (
            <motion.div
              key='lifemap'
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            >
              <LifeMap hideNavbar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed navbar - positioned absolutely over the content */}
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
          >
            LB
            <span className='text-lg ml-2 text-gray-600'>
              {currentView === 'strategy' ? ' > Strategy Studio' : ''}
            </span>
          </div>

          {/* Right side - User Profile */}
          <UserProfile />
        </nav>
      </div>
    </div>
  )
}
