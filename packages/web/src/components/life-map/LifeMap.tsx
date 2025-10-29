import React from 'react'
import { AuthStatusBanner } from '../auth/AuthStatusBanner.js'
import { UserProfile } from '../user/UserProfile.js'

/**
 * LifeMap - Experimental new homepage UI
 * This component is for exploring a completely new UI and layout
 */
type CategoryId = 'finances' | 'health'

interface CategoryConfig {
  id: CategoryId
  label: string
  color: string
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'finances', label: 'Finances', color: 'rgba(203, 184, 157, 0.75)' },
  { id: 'health', label: 'Health', color: 'rgba(204, 183, 154, 0.75)' },
]

export const LifeMap: React.FC = () => {
  const [isLogoHovered, setIsLogoHovered] = React.useState(false)
  const [expandedCategoryId, setExpandedCategoryId] = React.useState<CategoryId | null>(null)
  const [collapsingCategoryId, setCollapsingCategoryId] = React.useState<CategoryId | null>(null)
  const [categoriesVisible, setCategoriesVisible] = React.useState(true)
  const [expandStartPosition, setExpandStartPosition] = React.useState<{
    top: number
    left: number
  } | null>(null)
  const [collapseTargetPosition, setCollapseTargetPosition] = React.useState<{
    top: number
    left: number
  } | null>(null)

  // Create refs for each category
  const financesRef = React.useRef<HTMLDivElement>(null)
  const healthRef = React.useRef<HTMLDivElement>(null)
  const categoryRefs = {
    finances: financesRef,
    health: healthRef,
  } as const

  const anyExpanded = expandedCategoryId !== null || collapsingCategoryId !== null

  const handleCollapse = React.useCallback(() => {
    if (!expandedCategoryId) return

    const categoryId = expandedCategoryId

    // Calculate target position mathematically
    // The cards are centered in a flex container with gap-8 (32px)
    const cardWidth = 240
    const cardHeight = 240
    const gap = 32
    const numCards = CATEGORIES.length
    const totalWidth = numCards * cardWidth + (numCards - 1) * gap

    // Nav height is approximately 60px (py-3 = 12px top + 12px bottom + text height)
    const navHeight = 60
    const availableHeight = window.innerHeight - navHeight

    // Calculate center position for this card
    const categoryIndex = CATEGORIES.findIndex(c => c.id === categoryId)
    const left = (window.innerWidth - totalWidth) / 2 + categoryIndex * (cardWidth + gap)
    const top = navHeight + (availableHeight - cardHeight) / 2

    setCollapseTargetPosition({ top, left })
    setExpandedCategoryId(null)
    setCollapsingCategoryId(categoryId)
    setCategoriesVisible(false)

    // Wait for collapse animation to complete (400ms)
    setTimeout(() => {
      setCollapsingCategoryId(null)
      setCollapseTargetPosition(null)
      // Small delay before fading in other categories (100ms)
      setTimeout(() => {
        setCategoriesVisible(true)
      }, 100)
    }, 400)
  }, [expandedCategoryId])

  // Handle escape key to close expanded view
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedCategoryId) {
        handleCollapse()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [expandedCategoryId, handleCollapse])

  const handleCategoryClick = React.useCallback(
    (categoryId: CategoryId) => {
      const categoryRef = categoryRefs[categoryId]

      if (expandedCategoryId === categoryId) {
        // Collapse this category
        handleCollapse()
      } else if (!expandedCategoryId && categoryRef.current) {
        // Expand this category
        setCategoriesVisible(false)
        const rect = categoryRef.current.getBoundingClientRect()
        setExpandStartPosition({ top: rect.top, left: rect.left })
        setExpandedCategoryId(categoryId)
        // Reset position after animation starts
        setTimeout(() => setExpandStartPosition(null), 50)
      }
    },
    [expandedCategoryId, handleCollapse, categoryRefs]
  )

  const getBackgroundColor = () => {
    const category = CATEGORIES.find(c => c.id === expandedCategoryId)
    return category ? category.color : '#f5f1e8'
  }

  // Determine if a category should be rendered in the DOM
  const shouldRenderCategory = (categoryId: CategoryId) => {
    // Always render if this is the expanded or collapsing category
    if (expandedCategoryId === categoryId || collapsingCategoryId === categoryId) return true
    // When collapsing, render all categories (they'll be invisible)
    if (collapsingCategoryId !== null) return true
    // Don't render if another category is expanded
    if (expandedCategoryId !== null) return false
    // Otherwise render
    return true
  }

  // Get styles for a category based on its state
  const getCategoryStyle = (categoryId: CategoryId, color: string) => {
    const isExpanded = expandedCategoryId === categoryId
    const isCollapsing = collapsingCategoryId === categoryId
    const isActive = isExpanded || isCollapsing

    // Determine position based on state
    let top: string | number = 'auto'
    let left: string | number = 'auto'
    let width = '240px'
    let height = '240px'

    if (isExpanded) {
      // Expanding: start from expandStartPosition, animate to fullscreen
      if (expandStartPosition) {
        top = `${expandStartPosition.top}px`
        left = `${expandStartPosition.left}px`
        width = '240px'
        height = '240px'
      } else {
        top = '0'
        left = '0'
        width = '100vw'
        height = '100vh'
      }
    } else if (isCollapsing) {
      // Collapsing: start from fullscreen, animate to collapseTargetPosition
      if (collapseTargetPosition) {
        top = `${collapseTargetPosition.top}px`
        left = `${collapseTargetPosition.left}px`
        width = '240px'
        height = '240px'
      } else {
        top = '0'
        left = '0'
        width = '100vw'
        height = '100vh'
      }
    }

    // Determine background and styling based on state
    let background: string
    let borderRadius: string
    let boxShadow: string
    let backdropFilter: string

    if (isExpanded) {
      // When expanded: transparent (page background shows)
      background = 'transparent'
      borderRadius = '0'
      boxShadow = 'none'
      backdropFilter = 'none'
    } else if (isCollapsing) {
      // When collapsing: show card background so you can see it shrink
      background = `linear-gradient(135deg, ${color.replace('0.75', '0.85')}, ${color.replace('0.75', '0.65')})`
      // Animate border radius from 0 to 16px as it collapses
      borderRadius = collapseTargetPosition ? '16px' : '0'
      boxShadow = collapseTargetPosition
        ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
        : 'none'
      backdropFilter = collapseTargetPosition ? 'blur(8px)' : 'none'
    } else {
      // Normal state
      background = `linear-gradient(135deg, ${color.replace('0.75', '0.85')}, ${color.replace('0.75', '0.65')})`
      borderRadius = '16px'
      boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
      backdropFilter = 'blur(8px)'
    }

    return {
      opacity: isActive || categoriesVisible ? 1 : 0,
      position: isActive ? ('fixed' as const) : ('relative' as const),
      top,
      left,
      width,
      height,
      background,
      borderRadius,
      boxShadow,
      backdropFilter,
      fontFamily: 'Georgia, serif',
      fontSize: isExpanded ? '64px' : '32px',
      fontWeight: 400,
      color: 'white',
      transition: isExpanded
        ? 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1), background 0.8s ease, border-radius 0.8s ease, opacity 0.15s ease'
        : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease, border-radius 0.4s ease, opacity 0.15s ease',
      zIndex: isActive ? 10 : 1,
    }
  }

  return (
    <div
      className='w-full h-screen flex flex-col'
      style={{
        backgroundColor: getBackgroundColor(),
        transition: anyExpanded ? 'background-color 0.7s ease' : 'background-color 0.35s ease',
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
    >
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
          onClick={handleCollapse}
        >
          LB
          <span
            style={{
              opacity: anyExpanded ? 1 : 0,
              transition: expandedCategoryId ? 'opacity 0.8s ease' : 'opacity 0.4s ease',
            }}
          >
            {expandedCategoryId || collapsingCategoryId
              ? ` > ${CATEGORIES.find(c => c.id === (expandedCategoryId || collapsingCategoryId))?.label}`
              : ''}
          </span>
        </div>

        {/* Right side - User Profile */}
        <UserProfile />
      </nav>

      {/* Main content */}
      <div className='flex-1 flex items-center justify-center gap-8 relative'>
        {CATEGORIES.map(category => {
          if (!shouldRenderCategory(category.id)) return null

          const isExpanded = expandedCategoryId === category.id
          const isCollapsing = collapsingCategoryId === category.id

          return (
            <div
              key={category.id}
              ref={categoryRefs[category.id]}
              className='flex items-center justify-center cursor-pointer'
              style={getCategoryStyle(category.id, category.color)}
              onMouseEnter={e => {
                if (!isExpanded) {
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={e => {
                if (!isExpanded) {
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
              onClick={() => handleCategoryClick(category.id)}
            >
              {isExpanded || isCollapsing ? '' : category.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
