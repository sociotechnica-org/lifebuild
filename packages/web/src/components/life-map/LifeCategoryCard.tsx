import React from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import type { ProjectCategory } from '@work-squared/shared'
import { PROJECT_CATEGORIES } from '@work-squared/shared'
import {
  CATEGORY_CARD_LAYOUT_DURATION,
  CARD_FADE_OUT_DURATION,
  CARD_FADE_IN_DURATION,
  CARD_FADE_IN_DELAY,
  CARD_TEXT_FADE_DURATION,
  CARD_TEXT_FADE_DELAY,
  EXIT_TRANSITION_DURATION,
  EASE_CARD,
} from './animationTimings.js'

/**
 * Color mixing configuration
 */
const CARD_BASE_COLOR = '#a0856f'
const TINT_STRENGTH: number = 0.03
const SATURATION_BOOST: number = 0.035
const BRIGHTNESS_ADJUST: number = 0.2

/**
 * Glow effect configuration
 */
const GLOW_ENABLED: boolean = true
const GLOW_OPACITY: number = 0.1
const GLOW_SPREAD: number = 8
const GLOW_BLUR: number = 12

/**
 * Mix a category color with the brown background and apply adjustments
 */
function mixWithBrown(categoryColorHex: string): string {
  const baseR = parseInt(CARD_BASE_COLOR.slice(1, 3), 16)
  const baseG = parseInt(CARD_BASE_COLOR.slice(3, 5), 16)
  const baseB = parseInt(CARD_BASE_COLOR.slice(5, 7), 16)

  const catR = parseInt(categoryColorHex.slice(1, 3), 16)
  const catG = parseInt(categoryColorHex.slice(3, 5), 16)
  const catB = parseInt(categoryColorHex.slice(5, 7), 16)

  let r = baseR * (1 - TINT_STRENGTH) + catR * TINT_STRENGTH
  let g = baseG * (1 - TINT_STRENGTH) + catG * TINT_STRENGTH
  let b = baseB * (1 - TINT_STRENGTH) + catB * TINT_STRENGTH

  if (SATURATION_BOOST > 0) {
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    r = r + (catR - gray) * SATURATION_BOOST
    g = g + (catG - gray) * SATURATION_BOOST
    b = b + (catB - gray) * SATURATION_BOOST
  }

  if (BRIGHTNESS_ADJUST !== 0) {
    if (BRIGHTNESS_ADJUST > 0) {
      r = r + (255 - r) * BRIGHTNESS_ADJUST
      g = g + (255 - g) * BRIGHTNESS_ADJUST
      b = b + (255 - b) * BRIGHTNESS_ADJUST
    } else {
      r = r * (1 + BRIGHTNESS_ADJUST)
      g = g * (1 + BRIGHTNESS_ADJUST)
      b = b * (1 + BRIGHTNESS_ADJUST)
    }
  }

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

export interface LifeCategoryCardProps {
  category: ProjectCategory
  expandedCategoryId: ProjectCategory | null
  morphingCategoryId: ProjectCategory | null
  onClick: (categoryId: ProjectCategory) => void
  layoutId?: string // For Framer Motion layoutId animation
}

/**
 * LifeCategoryCard - Animated category card for the new LifeMap UI
 * Features pulsing glow effect and smooth animations
 */
export const LifeCategoryCard: React.FC<LifeCategoryCardProps> = ({
  category,
  expandedCategoryId,
  morphingCategoryId,
  onClick,
  layoutId,
}) => {
  const categoryInfo = PROJECT_CATEGORIES.find(c => c.value === category)
  if (!categoryInfo) return null

  const glowOpacity = useMotionValue(GLOW_OPACITY)
  const cardOpacity = useMotionValue(1)
  const [isHovered, setIsHovered] = React.useState(false)
  const pulseAnimationRef = React.useRef<ReturnType<typeof animate> | null>(null)

  const cardColor = mixWithBrown(categoryInfo.colorHex)

  // Start pulsing animation on mount or when hover ends
  React.useEffect(() => {
    if (!GLOW_ENABLED || isHovered) {
      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.stop()
        pulseAnimationRef.current = null
      }
      return
    }

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
    getBoxShadow(categoryInfo.colorHex, opacity)
  )

  // Use static shadow for hover (base opacity)
  const hoverBoxShadow = getHoverBoxShadow(categoryInfo.colorHex, GLOW_OPACITY)

  const isMorphing = morphingCategoryId === category
  const isExpanding = expandedCategoryId !== null
  const targetOpacity = isExpanding && !isMorphing ? 0 : 1

  // Control opacity with motion value to ensure transition always applies
  React.useEffect(() => {
    // CRITICAL: When morphing (expanding), keep card at opacity 1 for layoutId animation
    if (isMorphing || morphingCategoryId === category) {
      cardOpacity.set(1)
      return
    }

    if (morphingCategoryId !== null && !isExpanding) {
      // Collapsing - start at 0, then fade in with delay
      cardOpacity.set(0)
      animate(cardOpacity, 1, {
        duration: CARD_FADE_IN_DURATION,
        delay: CARD_FADE_IN_DELAY,
        ease: 'easeOut',
      })
    } else {
      // Normal state - animate to target opacity
      animate(cardOpacity, targetOpacity, {
        duration: isExpanding && !isMorphing ? CARD_FADE_OUT_DURATION : CARD_FADE_IN_DURATION,
        delay: isExpanding && !isMorphing ? 0 : CARD_FADE_IN_DELAY,
        ease: 'easeOut',
      })
    }
  }, [cardOpacity, morphingCategoryId, isMorphing, isExpanding, targetOpacity, category])

  return (
    <motion.div
      layoutId={layoutId || category}
      className='flex items-center justify-center cursor-pointer flex-shrink-0'
      style={{
        width: '250px',
        aspectRatio: 1,
        background: cardColor,
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
        transition: { duration: EXIT_TRANSITION_DURATION },
      }}
      transition={{
        layout: { duration: CATEGORY_CARD_LAYOUT_DURATION, ease: EASE_CARD },
      }}
      whileHover={{
        boxShadow: hoverBoxShadow,
        y: -2,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onClick(category)}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{
          opacity: isExpanding ? 0 : 1,
        }}
        transition={{
          opacity: {
            duration: isExpanding ? CARD_FADE_OUT_DURATION : CARD_TEXT_FADE_DURATION,
            delay: isExpanding ? 0 : CARD_TEXT_FADE_DELAY,
          },
        }}
        exit={{ opacity: 0, transition: { duration: EXIT_TRANSITION_DURATION } }}
      >
        {categoryInfo.name}
      </motion.span>
    </motion.div>
  )
}
