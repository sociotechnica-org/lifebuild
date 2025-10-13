import React from 'react'
import {
  SANCTUARY_WHITE,
  SOFT_PLATINUM,
  WARM_STONE,
  DEEP_EARTH,
  CLAY_BROWN,
  SHADOW_LEVEL_1,
  SHADOW_LEVEL_2,
  SHADOW_LEVEL_3,
  SPRING_EASING,
  HEALTH_EMERALD,
  RELATIONSHIPS_ROSE,
  FINANCES_GOLD,
  GROWTH_SAPPHIRE,
  LEISURE_LAVENDER,
  SPIRITUALITY_INDIGO,
  HOME_AMBER,
  CONTRIBUTION_TERRA,
} from '../../styles/colors.js'

export type CategoryColorName =
  | 'health'
  | 'relationships'
  | 'finances'
  | 'growth'
  | 'leisure'
  | 'spirituality'
  | 'home'
  | 'contribution'

export interface MiniProject {
  id: string
  name: string
}

export interface ProjectCategory {
  id: string
  name: string
  icon?: string
  letter?: string // Single letter symbol for letterpress
  symbol?: string // Unicode symbol for letterpress center (e.g., '♥', '✦', '◆')
  color?: CategoryColorName
  projectCount?: number
  projects?: MiniProject[] // Up to 3 mini projects to display
  advisorInitials?: string // Advisor assigned to this category
  materialization?: 0 | 1 | 2 | 3 | 4 // Progressive materialization level
  isActive?: boolean // One of three active quests
}

export interface ProjectCategorySquareProps {
  category: ProjectCategory
  onClick?: (category: ProjectCategory) => void
}

/**
 * ProjectCategorySquare - Progressive materialization with warm neutral palette
 *
 * Levels:
 * 0: Ghost (20% opacity, dashed outline)
 * 1: Emerging (40% opacity, partial border)
 * 2: Forming (60% opacity, mostly solid border)
 * 3: Crystallizing (80% opacity, solid border)
 * 4: Materialized (100% opacity, full presence)
 *
 * Active state: Breathing animation, progress ring, elevated shadow
 */
export const ProjectCategorySquare: React.FC<ProjectCategorySquareProps> = ({
  category,
  onClick,
}) => {
  const level = category.materialization ?? 4
  const isActive = category.isActive ?? false

  // Map category color names to actual colors
  const getCategoryColor = (colorName?: CategoryColorName): string => {
    switch (colorName) {
      case 'health':
        return HEALTH_EMERALD
      case 'relationships':
        return RELATIONSHIPS_ROSE
      case 'finances':
        return FINANCES_GOLD
      case 'growth':
        return GROWTH_SAPPHIRE
      case 'leisure':
        return LEISURE_LAVENDER
      case 'spirituality':
        return SPIRITUALITY_INDIGO
      case 'home':
        return HOME_AMBER
      case 'contribution':
        return CONTRIBUTION_TERRA
      default:
        return SOFT_PLATINUM
    }
  }

  const categoryColor = getCategoryColor(category.color)

  // Opacity based on materialization level
  const opacity = [0.2, 0.4, 0.6, 0.8, 1.0][level]

  // Border style based on level
  const getBorderStyle = () => {
    if (level === 0) return 'dashed'
    if (level === 1) return 'dashed'
    return 'solid'
  }

  // Border width and color based on level - visible and material
  const borderWidth = level === 4 ? '3px' : level === 3 ? '2.5px' : level === 2 ? '2px' : '1px'
  const getBorderColor = () => {
    if (level === 0) return `${CLAY_BROWN}40` // Dashed, faint
    if (level === 1) return `${CLAY_BROWN}60` // Partial, more visible
    if (level === 2) return `${categoryColor}A0` // Category color emerging (63% opacity)
    if (level >= 3) return categoryColor // Full category color for materialized
    return `${CLAY_BROWN}60`
  }

  // Shadow based on level and active state - 3D depth with warm shadows
  const getShadow = () => {
    if (isActive)
      return `
        0 12px 32px ${categoryColor}25,
        0 6px 16px rgba(101, 67, 33, 0.2),
        0 2px 8px rgba(92, 83, 74, 0.15),
        inset 0 1px 2px rgba(255, 250, 240, 0.5)
      `
    if (level >= 3)
      return `
        0 6px 20px ${categoryColor}18,
        0 3px 10px rgba(101, 67, 33, 0.12),
        0 1px 4px rgba(92, 83, 74, 0.1)
      `
    if (level >= 2)
      return `
        0 4px 12px rgba(101, 67, 33, 0.1),
        0 2px 6px rgba(92, 83, 74, 0.08)
      `
    return `0 2px 6px rgba(92, 83, 74, 0.06)`
  }

  // Scale based on active state
  const scale = isActive ? 1.1 : 1.0

  // Background color with warm neutrals and rich, earthy category color
  const getBgColor = () => {
    if (level === 0) return `${SANCTUARY_WHITE}50` // Very faint for ghost
    if (level === 1) return `linear-gradient(135deg, ${SOFT_PLATINUM} 0%, ${categoryColor}45 100%)` // Emerging color
    if (level === 2)
      return `linear-gradient(135deg, ${categoryColor}40 0%, ${SOFT_PLATINUM} 50%, ${categoryColor}50 100%)` // Forming with color
    if (level === 3)
      return `
        radial-gradient(circle at 25% 25%, ${categoryColor}45 0%, transparent 60%),
        linear-gradient(135deg, ${categoryColor}50 0%, ${SANCTUARY_WHITE} 50%, ${categoryColor}55 100%)
      ` // Crystallizing
    // Fully materialized: rich earthy presence, not metallic
    return `
      radial-gradient(circle at 30% 30%, ${categoryColor}55 0%, transparent 65%),
      radial-gradient(circle at 70% 70%, ${categoryColor}50 0%, transparent 60%),
      linear-gradient(135deg, ${categoryColor}60 0%, ${SANCTUARY_WHITE}CC 40%, ${categoryColor}65 100%)
    `
  }

  return (
    <button
      onClick={() => onClick?.(category)}
      className='relative rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 group'
      style={{
        width: '100%',
        height: '100%',
        opacity,
        background:
          typeof getBgColor() === 'string' && !getBgColor().includes('gradient')
            ? getBgColor()
            : undefined,
        backgroundImage:
          typeof getBgColor() === 'string' && getBgColor().includes('gradient')
            ? getBgColor()
            : undefined,
        border: `${borderWidth} ${getBorderStyle()} ${getBorderColor()}`,
        boxShadow: getShadow(),
        transform: `scale(${scale}) perspective(1000px) rotateX(2deg)`,
        transformStyle: 'preserve-3d',
        transition: `all 250ms ${SPRING_EASING}`,
        animation: isActive ? 'breathe 3s ease-in-out infinite' : undefined,
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.transform = `scale(1.05) perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(8px)`
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = `scale(${scale}) perspective(1000px) rotateX(2deg)`
      }}
    >
      {/* Paper/fabric texture overlay */}
      {level >= 1 && (
        <div
          className='absolute inset-0 rounded-2xl pointer-events-none'
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(101, 67, 33, 0.02) 2px,
                rgba(101, 67, 33, 0.02) 3px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(92, 83, 74, 0.015) 2px,
                rgba(92, 83, 74, 0.015) 3px
              )
            `,
            opacity: level >= 3 ? 0.6 : 0.4,
          }}
        />
      )}

      {/* Noise texture for material feel */}
      {level >= 2 && (
        <div
          className='absolute inset-0 rounded-2xl pointer-events-none mix-blend-overlay'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.08,
          }}
        />
      )}

      {/* Top highlight for 3D effect */}
      {level >= 3 && (
        <div
          className='absolute inset-0 rounded-2xl pointer-events-none'
          style={{
            background: `linear-gradient(180deg, rgba(255, 250, 240, 0.4) 0%, transparent 30%)`,
          }}
        />
      )}

      {/* Bottom shadow/depth for 3D effect */}
      {level >= 3 && (
        <div
          className='absolute inset-0 rounded-2xl pointer-events-none'
          style={{
            background: `linear-gradient(180deg, transparent 70%, rgba(101, 67, 33, 0.15) 100%)`,
          }}
        />
      )}

      {/* Active state: glow aura with category color */}
      {isActive && (
        <div
          className='absolute inset-0 rounded-2xl pointer-events-none'
          style={{
            boxShadow: `0 0 24px ${categoryColor}60, 0 0 48px ${categoryColor}30`,
          }}
        />
      )}

      {/* Top-left: Category name - letterpress style with serif font */}
      {level >= 1 && (
        <div
          className='absolute top-3 left-3 text-sm uppercase tracking-wider'
          style={{
            fontFamily: 'Georgia, Palatino, "Times New Roman", serif',
            fontWeight: 500,
            color: DEEP_EARTH,
            opacity: level === 1 ? 0.5 : 0.8,
            textShadow: `
              0 1px 0 rgba(255, 255, 255, 0.8),
              0 -1px 0 rgba(0, 0, 0, 0.2)
            `, // Letterpress effect
            letterSpacing: '0.1em',
            transform: `translateZ(2px)`,
          }}
        >
          {category.name}
        </div>
      )}

      {/* Top-right: Advisor avatar if assigned */}
      {category.advisorInitials && level >= 2 && (
        <div
          className='absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold'
          style={{
            backgroundColor: categoryColor,
            color: SANCTUARY_WHITE,
            fontFamily: 'Inter, sans-serif',
            boxShadow: `0 2px 4px rgba(92, 83, 74, 0.3)`,
            transform: `translateZ(5px)`,
          }}
        >
          {category.advisorInitials}
        </div>
      )}

      {/* Center: Letterpress symbol */}
      {(category.symbol || category.letter) && (
        <div
          className='flex-1 flex items-center justify-center transition-all'
          style={{
            fontSize: level === 0 ? '64px' : level === 1 ? '72px' : '80px',
            fontFamily: 'Georgia, Palatino, "Times New Roman", serif',
            color: categoryColor,
            opacity: level === 0 ? 0.25 : level === 1 ? 0.5 : level === 2 ? 0.7 : 0.85,
            textShadow: `
              0 2px 0 rgba(255, 255, 255, 0.5),
              0 -1px 0 rgba(0, 0, 0, 0.25),
              0 4px 8px ${categoryColor}20
            `, // Deep letterpress effect
            transform: `translateZ(${level >= 3 ? '8px' : '4px'})`,
            fontWeight: 400,
          }}
        >
          {category.symbol || category.letter}
        </div>
      )}

      {/* Bottom: 3 mini project squares */}
      <div
        className='absolute bottom-3 left-3 right-3 flex gap-2 justify-center'
        style={{
          transform: `translateZ(3px)`,
        }}
      >
        {[0, 1, 2].map(i => {
          const project = category.projects?.[i]
          const hasProject = !!project

          return (
            <div
              key={i}
              className='flex-1 aspect-square rounded flex items-center justify-center text-xs'
              style={{
                maxWidth: '60px',
                backgroundColor: hasProject ? `${categoryColor}40` : `${WARM_STONE}30`,
                border: `1px solid ${hasProject ? `${categoryColor}60` : `${CLAY_BROWN}30`}`,
                boxShadow: hasProject
                  ? `inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.5)`
                  : `inset 0 1px 2px rgba(0, 0, 0, 0.05)`,
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                color: hasProject ? DEEP_EARTH : CLAY_BROWN,
                opacity: hasProject ? 1.0 : 0.4,
                transition: `all 150ms ${SPRING_EASING}`,
              }}
              title={project?.name}
            >
              {hasProject ? '•' : ''}
            </div>
          )
        })}
      </div>

      {/* Subtle corner accent - appears at level 3+ */}
      {level >= 3 && (
        <div
          className='absolute top-0 right-0 w-16 h-16 rounded-tr-2xl pointer-events-none'
          style={{
            background: `linear-gradient(135deg, ${SANCTUARY_WHITE}40 0%, transparent 100%)`,
          }}
        />
      )}

      {/* Active state: progress ring with category color */}
      {isActive && (
        <div
          className='absolute inset-0 rounded-2xl pointer-events-none'
          style={{
            border: `3px solid ${categoryColor}`,
            opacity: 0.4,
          }}
        />
      )}
    </button>
  )
}

// Add keyframes for breathing animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes breathe {
      0%, 100% {
        transform: scale(1.1);
      }
      50% {
        transform: scale(1.13);
      }
    }
  `
  document.head.appendChild(style)
}
