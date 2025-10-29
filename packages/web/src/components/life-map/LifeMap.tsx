import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthStatusBanner } from '../auth/AuthStatusBanner.js'
import { UserProfile } from '../user/UserProfile.js'

/**
 * LifeMap - Experimental new homepage UI
 * This component is for exploring a completely new UI and layout
 * Now powered by Framer Motion for smooth, declarative animations
 */
export type CategoryId = 'finances' | 'health'

interface CategoryConfig {
  id: CategoryId
  label: string
  color: string
}

interface LifeMapProps {
  hideNavbar?: boolean
  onCategoryChange?: (categoryId: CategoryId | null) => void
  onRegisterCloseHandler?: (handler: () => void) => void
}

export const CATEGORIES: CategoryConfig[] = [
  { id: 'finances', label: 'Finances', color: 'rgba(203, 184, 157, 0.75)' },
  { id: 'health', label: 'Health', color: 'rgba(204, 183, 154, 0.75)' },
]

export const LifeMap: React.FC<LifeMapProps> = ({
  hideNavbar = false,
  onCategoryChange,
  onRegisterCloseHandler,
}) => {
  const [isLogoHovered, setIsLogoHovered] = React.useState(false)
  const [expandedCategoryId, setExpandedCategoryId] = React.useState<CategoryId | null>(null)
  const [morphingCategoryId, setMorphingCategoryId] = React.useState<CategoryId | null>(null)

  const anyExpanded = expandedCategoryId !== null

  // Close handler that can be called by parent
  const handleClose = React.useCallback(() => {
    if (expandedCategoryId) {
      setMorphingCategoryId(expandedCategoryId)
      setExpandedCategoryId(null)
      setTimeout(() => setMorphingCategoryId(null), 800)
    }
  }, [expandedCategoryId])

  // Register close handler with parent
  React.useEffect(() => {
    onRegisterCloseHandler?.(handleClose)
  }, [handleClose, onRegisterCloseHandler])

  // Notify parent of category changes
  React.useEffect(() => {
    onCategoryChange?.(expandedCategoryId)
  }, [expandedCategoryId, onCategoryChange])

  // Handle escape key to close expanded view
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [handleClose])

  const handleCategoryClick = (categoryId: CategoryId) => {
    if (expandedCategoryId === categoryId) {
      setMorphingCategoryId(categoryId)
      setExpandedCategoryId(null)
      setTimeout(() => setMorphingCategoryId(null), 800)
    } else if (!expandedCategoryId) {
      setMorphingCategoryId(categoryId)
      setExpandedCategoryId(categoryId)
      setTimeout(() => setMorphingCategoryId(null), 800)
    }
  }

  const getBackgroundColor = () => {
    const category = CATEGORIES.find(c => c.id === expandedCategoryId)
    return category ? category.color : '#f5f1e8'
  }

  return (
    <motion.div
      className='w-full h-screen flex flex-col'
      style={{
        backgroundImage: expandedCategoryId
          ? 'none'
          : `
          radial-gradient(ellipse 1200px 900px at 15% 25%, rgba(0,0,0,.08) 0%, transparent 60%),
          radial-gradient(ellipse 950px 1300px at 85% 15%, rgba(0,0,0,.06) 0%, transparent 65%),
          radial-gradient(ellipse 1100px 700px at 35% 75%, rgba(0,0,0,.09) 0%, transparent 55%),
          radial-gradient(ellipse 800px 1100px at 70% 85%, rgba(0,0,0,.07) 0%, transparent 60%),
          radial-gradient(ellipse 650px 850px at 55% 40%, rgba(0,0,0,.05) 0%, transparent 70%),
          radial-gradient(ellipse 900px 600px at 5% 60%, rgba(0,0,0,.06) 0%, transparent 65%),
          radial-gradient(ellipse 750px 950px at 95% 70%, rgba(0,0,0,.07) 0%, transparent 60%),
          repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.03) 2px, rgba(0,0,0,.03) 4px),
          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.03) 2px, rgba(0,0,0,.03) 4px)
        `,
      }}
      animate={{
        backgroundColor: getBackgroundColor(),
      }}
      transition={{
        backgroundColor: {
          duration: anyExpanded ? 0.7 : 0.35,
          ease: 'easeInOut',
        },
      }}
    >
      {!hideNavbar && (
        <>
          {/* Auth Status Banner - centered when shown */}
          <div className='flex justify-center'>
            <AuthStatusBanner />
          </div>

          {/* Top navbar */}
          <nav className='flex items-center justify-between px-4 py-3'>
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
              onClick={handleClose}
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
                  opacity: anyExpanded ? 1 : 0,
                  transition: anyExpanded
                    ? { duration: 0.3, delay: 0.2, ease: 'easeOut' }
                    : { duration: 0.2, ease: 'easeIn' },
                }}
              >
                {expandedCategoryId
                  ? ` > ${CATEGORIES.find(c => c.id === expandedCategoryId)?.label}`
                  : ''}
              </motion.span>
            </div>

            {/* Right side - User Profile */}
            <UserProfile />
          </nav>
        </>
      )}

      {/* Main content */}
      <div className='flex-1 flex items-center justify-center gap-8 relative'>
        <AnimatePresence initial={false}>
          {/* Normal view - show all cards in flex layout */}
          {!expandedCategoryId &&
            CATEGORIES.map(category => (
              <motion.div
                key={`normal-${category.id}`}
                layoutId={category.id}
                className='flex items-center justify-center cursor-pointer'
                style={{
                  width: '350px',
                  height: '350px',
                  background: `linear-gradient(135deg, ${category.color.replace('0.75', '0.85')}, ${category.color.replace('0.75', '0.65')})`,
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(8px)',
                  fontFamily: 'Georgia, serif',
                  fontSize: '40px',
                  fontWeight: 400,
                  color: 'white',
                }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: morphingCategoryId === category.id ? 1 : 0,
                  transition: { duration: 0.2 },
                }}
                transition={{
                  layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                }}
                whileHover={{
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15)',
                  y: -2,
                }}
                onClick={() => handleCategoryClick(category.id)}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.1, delay: 0.4 } }}
                  exit={{ opacity: 0, transition: { duration: 0.05 } }}
                >
                  {category.label}
                </motion.span>
              </motion.div>
            ))}

          {/* Expanded view - show only the expanded card fullscreen */}
          {expandedCategoryId && (
            <motion.div
              key={`expanded-${expandedCategoryId}`}
              layoutId={expandedCategoryId}
              className='flex items-center justify-center cursor-pointer'
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'transparent',
                borderRadius: '0',
                fontFamily: 'Georgia, serif',
                fontSize: '64px',
                fontWeight: 400,
                color: 'white',
                zIndex: 10,
              }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
              transition={{
                layout: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
              }}
              onClick={() => handleCategoryClick(expandedCategoryId)}
            >
              {/* Empty when expanded - title shows in navbar */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
