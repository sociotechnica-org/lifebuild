import React from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { AuthStatusBanner } from '../auth/AuthStatusBanner.js'
import { UserProfile } from '../user/UserProfile.js'
import { PROJECT_CATEGORIES, type ProjectCategory } from '@work-squared/shared'

/**
 * LifeMap - Experimental new homepage UI
 * This component is for exploring a completely new UI and layout
 * Now powered by Framer Motion for smooth, declarative animations
 */
export type CategoryId = ProjectCategory

interface CategoryConfig {
  id: CategoryId
  label: string
  color: string
  glowColorHex: string // Original category color for glow effect
}

interface LifeMapProps {
  hideNavbar?: boolean
  onCategoryChange?: (categoryId: CategoryId | null) => void
  onRegisterCloseHandler?: (handler: () => void) => void
}

/**
 * Page background color - used when no category is expanded
 */
const PAGE_BACKGROUND = '#f5f1e8'

/**
 * Card base color - this is what gets mixed with category colors for the cards
 * Current: '#a0856f' (dark brown)
 *
 * Darker brown options:
 * - '#8b7358' (very dark brown)
 * - '#7a624a' (deep dark brown)
 * - '#6b5640' (almost chocolate)
 *
 * Medium brown options:
 * - '#b8a082' (medium brown)
 * - '#c9b5a0' (medium warm brown)
 * - '#d4c5b8' (light brown)
 *
 * Lighter options:
 * - '#e8ddd4' (warm beige)
 * - '#f5f1e8' (light beige/cream)
 */
const CARD_BASE_COLOR = '#a0856f'

// ============================================================================
// COLOR MIXING KNOBS - Adjust these to fine-tune the card colors
// ============================================================================

/**
 * TINT_STRENGTH: How much category color to mix with brown background
 * - Range: 0.0 to 1.0
 * - 0.0 = Pure brown (no category color)
 * - 0.1 = Subtle tint (10% category color, 90% brown) - default
 * - 0.3 = Moderate tint (30% category color, 70% brown)
 * - 0.5 = Equal mix (50/50)
 * - 1.0 = Pure category color (no brown)
 */
const TINT_STRENGTH: number = 0.03

/**
 * SATURATION_BOOST: Increase color vibrancy after mixing
 * - Range: 0.0 to 1.0
 * - 0.0 = No change (keeps mixed color as-is)
 * - 0.2 = Slight boost (makes colors more vibrant)
 * - 0.5 = Moderate boost
 * - 1.0 = Maximum saturation (very vibrant, possibly oversaturated)
 */
const SATURATION_BOOST: number = 0.035

/**
 * BRIGHTNESS_ADJUST: Make colors lighter or darker
 * - Range: -1.0 to 1.0
 * - -1.0 = Much darker (toward black)
 * - -0.2 = Slightly darker
 * - 0.0 = No change (default)
 * - 0.2 = Slightly lighter
 * - 1.0 = Much lighter (toward white)
 */
const BRIGHTNESS_ADJUST: number = 0.2

// ============================================================================
// GLOW EFFECT KNOBS - Control the category-colored edge glow
// ============================================================================

/**
 * GLOW_ENABLED: Turn the edge glow effect on/off
 * - true = Show glow (default)
 * - false = No glow
 */
const GLOW_ENABLED: boolean = true

/**
 * GLOW_OPACITY: How visible the glow is
 * - Range: 0.0 to 1.0
 * - 0.0 = Invisible (no glow)
 * - 0.2 = Very faint glow
 * - 0.4 = Subtle glow (default)
 * - 0.6 = Moderate glow
 * - 1.0 = Strong, vibrant glow
 */
const GLOW_OPACITY: number = 0.1

/**
 * GLOW_SPREAD: How far the glow extends from the edge
 * - Range: 0 to 50 (pixels)
 * - 0 = No spread (tight glow)
 * - 8 = Subtle spread (default)
 * - 16 = Moderate spread
 * - 24 = Wide glow
 * - 50 = Very wide glow
 */
const GLOW_SPREAD: number = 8

/**
 * GLOW_BLUR: How soft/diffused the glow is
 * - Range: 0 to 50 (pixels)
 * - 0 = Sharp, hard edge
 * - 12 = Soft glow (default)
 * - 20 = Very soft, diffused
 * - 50 = Extremely soft/blurry
 */
const GLOW_BLUR: number = 12

/**
 * Mix a category color with the brown background and apply adjustments
 * @param categoryColorHex - The category color in hex format (e.g., '#10B981')
 * @returns RGB color string
 */
function mixWithBrown(categoryColorHex: string): string {
  // Parse card base color
  const baseR = parseInt(CARD_BASE_COLOR.slice(1, 3), 16)
  const baseG = parseInt(CARD_BASE_COLOR.slice(3, 5), 16)
  const baseB = parseInt(CARD_BASE_COLOR.slice(5, 7), 16)

  // Parse category color
  const catR = parseInt(categoryColorHex.slice(1, 3), 16)
  const catG = parseInt(categoryColorHex.slice(3, 5), 16)
  const catB = parseInt(categoryColorHex.slice(5, 7), 16)

  // Mix colors based on TINT_STRENGTH
  let r = baseR * (1 - TINT_STRENGTH) + catR * TINT_STRENGTH
  let g = baseG * (1 - TINT_STRENGTH) + catG * TINT_STRENGTH
  let b = baseB * (1 - TINT_STRENGTH) + catB * TINT_STRENGTH

  // Apply saturation boost
  if (SATURATION_BOOST > 0) {
    // Calculate grayscale (luminance)
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    // Boost saturation by moving toward the original color
    r = r + (catR - gray) * SATURATION_BOOST
    g = g + (catG - gray) * SATURATION_BOOST
    b = b + (catB - gray) * SATURATION_BOOST
  }

  // Apply brightness adjustment
  if (BRIGHTNESS_ADJUST !== 0) {
    if (BRIGHTNESS_ADJUST > 0) {
      // Lighten: move toward white
      r = r + (255 - r) * BRIGHTNESS_ADJUST
      g = g + (255 - g) * BRIGHTNESS_ADJUST
      b = b + (255 - b) * BRIGHTNESS_ADJUST
    } else {
      // Darken: move toward black
      r = r * (1 + BRIGHTNESS_ADJUST)
      g = g * (1 + BRIGHTNESS_ADJUST)
      b = b * (1 + BRIGHTNESS_ADJUST)
    }
  }

  // Clamp values to valid RGB range (0-255)
  r = Math.max(0, Math.min(255, Math.round(r)))
  g = Math.max(0, Math.min(255, Math.round(g)))
  b = Math.max(0, Math.min(255, Math.round(b)))

  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Generate glow box-shadow using category color with optional opacity override
 */
function getGlowStyle(categoryColorHex: string, opacityOverride?: number): string {
  if (!GLOW_ENABLED) return ''

  // Convert hex to rgba for the glow
  const r = parseInt(categoryColorHex.slice(1, 3), 16)
  const g = parseInt(categoryColorHex.slice(3, 5), 16)
  const b = parseInt(categoryColorHex.slice(5, 7), 16)
  const opacity = opacityOverride !== undefined ? opacityOverride : GLOW_OPACITY

  return `0 0 ${GLOW_SPREAD}px ${GLOW_BLUR}px rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Generate full box-shadow string with glow and regular shadows
 */
function getBoxShadow(categoryColorHex: string, opacityOverride?: number): string {
  const regularShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
  if (!GLOW_ENABLED) return regularShadow
  return `${getGlowStyle(categoryColorHex, opacityOverride)}, ${regularShadow}`
}

function getHoverBoxShadow(categoryColorHex: string, opacityOverride?: number): string {
  const regularShadow = '0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15)'
  if (!GLOW_ENABLED) return regularShadow
  return `${getGlowStyle(categoryColorHex, opacityOverride)}, ${regularShadow}`
}

/**
 * Transform PROJECT_CATEGORIES into CategoryConfig format for LifeMap
 */
export const CATEGORIES: CategoryConfig[] = PROJECT_CATEGORIES.map(
  (category): CategoryConfig => ({
    id: category.value,
    label: category.name,
    color: mixWithBrown(category.colorHex),
    glowColorHex: category.colorHex,
  })
)

/**
 * Pulsing card component with animated glow
 */
interface PulsingCardProps {
  category: CategoryConfig
  expandedCategoryId: CategoryId | null
  morphingCategoryId: CategoryId | null
  onCategoryClick: (categoryId: CategoryId) => void
}

const PulsingCard: React.FC<PulsingCardProps> = ({
  category,
  expandedCategoryId,
  morphingCategoryId,
  onCategoryClick,
}) => {
  const glowOpacity = useMotionValue(GLOW_OPACITY)
  const cardOpacity = useMotionValue(1)
  const [isHovered, setIsHovered] = React.useState(false)
  const pulseAnimationRef = React.useRef<ReturnType<typeof animate> | null>(null)

  // Start pulsing animation on mount or when hover ends
  React.useEffect(() => {
    if (!GLOW_ENABLED || isHovered) {
      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.stop()
        pulseAnimationRef.current = null
      }
      return
    }

    // Reset to base opacity before starting animation
    glowOpacity.set(GLOW_OPACITY)

    pulseAnimationRef.current = animate(glowOpacity, [GLOW_OPACITY + 0.05, GLOW_OPACITY - 0.05], {
      duration: 2,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    })

    return () => {
      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.stop()
        pulseAnimationRef.current = null
      }
    }
  }, [glowOpacity, isHovered])

  // Stop animation and reset to base opacity on hover
  React.useEffect(() => {
    if (isHovered) {
      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.stop()
        pulseAnimationRef.current = null
      }
      animate(glowOpacity, GLOW_OPACITY, {
        duration: 0.3,
        ease: 'easeOut',
      })
    }
  }, [isHovered, glowOpacity])

  // Transform opacity to box-shadow string
  const boxShadow = useTransform(glowOpacity, opacity =>
    getBoxShadow(category.glowColorHex, opacity)
  )

  // Use static shadow for hover (base opacity)
  const hoverBoxShadow = getHoverBoxShadow(category.glowColorHex, GLOW_OPACITY)

  const isMorphing = morphingCategoryId === category.id
  const isExpanding = expandedCategoryId !== null
  const targetOpacity = isExpanding && !isMorphing ? 0 : 1

  // Control opacity with motion value to ensure transition always applies
  React.useEffect(() => {
    if (morphingCategoryId !== null && !isMorphing && !isExpanding) {
      // Collapsing - start at 0, then fade in with delay
      cardOpacity.set(0)
      animate(cardOpacity, 1, {
        duration: 0.3,
        delay: 0.15,
        ease: 'easeOut',
      })
    } else {
      // Normal state - animate to target opacity
      animate(cardOpacity, targetOpacity, {
        duration: isExpanding && !isMorphing ? 0.05 : 0.3,
        delay: isExpanding && !isMorphing ? 0 : 0.15,
        ease: 'easeOut',
      })
    }
  }, [cardOpacity, morphingCategoryId, isMorphing, isExpanding, targetOpacity])

  return (
    <motion.div
      key={`normal-${category.id}`}
      layoutId={category.id}
      className='flex items-center justify-center cursor-pointer flex-shrink-0'
      style={{
        width: '250px',
        aspectRatio: 1,
        background: category.color,
        borderRadius: '16px',
        boxShadow: boxShadow,
        backdropFilter: 'blur(8px)',
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        fontWeight: 400,
        color: '#333',
        opacity: cardOpacity,
      }}
      exit={{
        opacity: isMorphing ? 1 : 0,
        transition: { duration: 0.05 },
      }}
      transition={{
        layout: { duration: 0.3, ease: [0.2, 0, 0.1, 1] },
      }}
      whileHover={{
        boxShadow: hoverBoxShadow,
        y: -2,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onCategoryClick(category.id)}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{
          opacity: isExpanding ? 0 : 1,
        }}
        transition={{
          // ADJUST TEXT FADE-IN TIMING HERE:
          // - delay: wait time before text fade-in starts (in seconds)
          // - duration: how long the text fade-in takes (in seconds)
          opacity: {
            duration: isExpanding ? 0.05 : 0.3,
            delay: isExpanding ? 0 : 0.1, // 0.1s delay before text fade-in starts
          },
        }}
        exit={{ opacity: 0, transition: { duration: 0.05 } }}
      >
        {category.label}
      </motion.span>
    </motion.div>
  )
}

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
      setTimeout(() => setMorphingCategoryId(null), 600)
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
      setTimeout(() => setMorphingCategoryId(null), 600)
    } else if (!expandedCategoryId) {
      setMorphingCategoryId(categoryId)
      setExpandedCategoryId(categoryId)
      setTimeout(() => setMorphingCategoryId(null), 600)
    }
  }

  const getBackgroundColor = () => {
    const category = CATEGORIES.find(c => c.id === expandedCategoryId)
    return category ? category.color : PAGE_BACKGROUND
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
      <div className='flex-1 flex items-center justify-center relative p-8'>
        <AnimatePresence initial={false}>
          <div className='flex items-start justify-center flex-wrap gap-x-4 gap-y-4'>
            {CATEGORIES.map(category => {
              // Always render all cards - control visibility with opacity instead
              // This ensures cards are always in DOM, so fade-in delay works properly
              // Cards will be hidden via opacity when expanded (except morphing card)
              return (
                <PulsingCard
                  key={category.id}
                  category={category}
                  expandedCategoryId={expandedCategoryId}
                  morphingCategoryId={morphingCategoryId}
                  onCategoryClick={handleCategoryClick}
                />
              )
            })}
          </div>

          {/* Expanded view - rendered alongside cards for layoutId animation */}
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
                layout: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
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
