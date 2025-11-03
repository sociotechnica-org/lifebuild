import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PROJECT_CATEGORIES, type ProjectCategory } from '@work-squared/shared'
import { LifeCategoryCard } from './LifeCategoryCard.js'
import { CategoryExpandedView } from './CategoryExpandedView.js'
import {
  MORPHING_CATEGORY_TIMEOUT,
  BACKGROUND_EXPAND_DURATION,
  BACKGROUND_COLLAPSE_DURATION,
} from './animationTimings.js'

/**
 * LifeMap - NEW UI - Life category cards with zoom animation
 * Clicking a category zooms it up to full screen, showing projects
 */
export type CategoryId = ProjectCategory

interface LifeMapProps {
  hideNavbar?: boolean
  // Legacy props for backward compatibility with AnimatedHomeView
  onCategoryChange?: (categoryId: CategoryId | null) => void
  onRegisterCloseHandler?: (handler: () => void) => void
}

/**
 * Page background color
 */
const PAGE_BACKGROUND = '#f5f1e8'

/**
 * Export categories for use in other components (e.g., AnimatedHomeView)
 */
export const CATEGORIES = PROJECT_CATEGORIES.map(c => ({
  id: c.value,
  label: c.name,
}))

export const LifeMap: React.FC<LifeMapProps> = ({
  hideNavbar: _hideNavbar = false,
  onCategoryChange,
  onRegisterCloseHandler,
}) => {
  const [expandedCategoryId, setExpandedCategoryId] = React.useState<CategoryId | null>(null)
  const [morphingCategoryId, setMorphingCategoryId] = React.useState<CategoryId | null>(null)

  const anyExpanded = expandedCategoryId !== null

  // Close handler that can be called by parent
  const handleClose = React.useCallback(() => {
    if (expandedCategoryId) {
      setMorphingCategoryId(expandedCategoryId)
      setExpandedCategoryId(null)
      setTimeout(() => setMorphingCategoryId(null), MORPHING_CATEGORY_TIMEOUT)
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
  // Note: CategoryExpandedView handles its own ESC key for project modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedCategoryId) {
        // Only handle if category is expanded and no project modal is open
        // The CategoryExpandedView will handle ESC if a project is open
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [handleClose, expandedCategoryId])

  const handleCategoryClick = (categoryId: CategoryId) => {
    if (expandedCategoryId === categoryId) {
      setMorphingCategoryId(categoryId)
      setExpandedCategoryId(null)
      setTimeout(() => setMorphingCategoryId(null), MORPHING_CATEGORY_TIMEOUT)
    } else if (!expandedCategoryId) {
      setMorphingCategoryId(categoryId)
      setExpandedCategoryId(categoryId)
      setTimeout(() => setMorphingCategoryId(null), MORPHING_CATEGORY_TIMEOUT)
    }
  }

  const getBackgroundColor = () => {
    const category = PROJECT_CATEGORIES.find(c => c.value === expandedCategoryId)
    if (!category) return PAGE_BACKGROUND
    // Use a subtle tint of the category color for the background
    return category.colorHex + '15' // Add alpha
  }

  return (
    <>
      {/* Fixed background layer - covers full viewport, doesn't shift */}
      {!expandedCategoryId && (
        <motion.div
          className='fixed inset-0'
          style={{
            backgroundImage: `
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
            zIndex: 0, // Above BackgroundLayer (zIndex: 0) but below content
          }}
          animate={{
            backgroundColor: getBackgroundColor(),
          }}
          transition={{
            backgroundColor: {
              duration: anyExpanded ? BACKGROUND_EXPAND_DURATION : BACKGROUND_COLLAPSE_DURATION,
              ease: 'easeInOut',
            },
          }}
        />
      )}

      {/* Content container - shifts with ContentArea */}
      <motion.div
        className='w-full h-screen flex flex-col relative'
        style={{
          backgroundColor: expandedCategoryId ? getBackgroundColor() : 'transparent',
        }}
        animate={{
          backgroundColor: expandedCategoryId ? getBackgroundColor() : 'transparent',
        }}
        transition={{
          backgroundColor: {
            duration: anyExpanded ? BACKGROUND_EXPAND_DURATION : BACKGROUND_COLLAPSE_DURATION,
            ease: 'easeInOut',
          },
        }}
      >
        {/* Main content */}
        <div className='flex-1 flex items-center justify-center relative p-8'>
          <AnimatePresence initial={false}>
            <div className='flex items-start justify-center flex-wrap gap-x-4 gap-y-4'>
              {PROJECT_CATEGORIES.map(category => {
                // Always render all cards - control visibility with opacity
                return (
                  <LifeCategoryCard
                    key={category.value}
                    category={category.value}
                    expandedCategoryId={expandedCategoryId}
                    morphingCategoryId={morphingCategoryId}
                    onClick={handleCategoryClick}
                    layoutId={category.value}
                  />
                )
              })}
            </div>

            {/* Expanded view - rendered alongside cards for layoutId animation */}
            {expandedCategoryId && (
              <CategoryExpandedView categoryId={expandedCategoryId} onClose={handleClose} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}
