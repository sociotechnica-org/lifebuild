import React from 'react'
import { AuthStatusBanner } from '../auth/AuthStatusBanner.js'
import { UserProfile } from '../user/UserProfile.js'

/**
 * LifeMap - Experimental new homepage UI
 * This component is for exploring a completely new UI and layout
 */
export const LifeMap: React.FC = () => {
  const [isLogoHovered, setIsLogoHovered] = React.useState(false)
  const [isFinancesExpanded, setIsFinancesExpanded] = React.useState(false)
  const [isHealthExpanded, setIsHealthExpanded] = React.useState(false)
  const [isCollapsing, setIsCollapsing] = React.useState(false)
  const [categoriesVisible, setCategoriesVisible] = React.useState(true)
  const [financesStartPosition, setFinancesStartPosition] = React.useState<{
    top: number
    left: number
  } | null>(null)
  const [healthStartPosition, setHealthStartPosition] = React.useState<{
    top: number
    left: number
  } | null>(null)
  const financesRef = React.useRef<HTMLDivElement>(null)
  const healthRef = React.useRef<HTMLDivElement>(null)

  const anyExpanded = isFinancesExpanded || isHealthExpanded

  // Handle escape key to close expanded view
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (isFinancesExpanded || isHealthExpanded)) {
        // Start collapse animation (keep expanded state true during animation)
        setIsCollapsing(true)
        // Wait for collapse animation to complete (400ms), THEN change expanded state
        setTimeout(() => {
          setIsFinancesExpanded(false)
          setIsHealthExpanded(false)
          // Delay clearing isCollapsing so other categories don't render immediately
          setTimeout(() => {
            setIsCollapsing(false)
            // Then trigger fade-in
            setTimeout(() => setCategoriesVisible(true), 0)
          }, 0)
        }, 400)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isFinancesExpanded, isHealthExpanded])

  const handleFinancesClick = () => {
    if (!isFinancesExpanded && financesRef.current) {
      // Hide other categories and capture position before expanding
      setCategoriesVisible(false)
      const rect = financesRef.current.getBoundingClientRect()
      setFinancesStartPosition({ top: rect.top, left: rect.left })
      setIsFinancesExpanded(true)
      // Reset position after animation starts
      setTimeout(() => setFinancesStartPosition(null), 50)
    } else {
      // Start collapse animation (keep expanded state true during animation)
      setIsCollapsing(true)
      // Wait for collapse animation to complete (400ms), THEN change expanded state
      setTimeout(() => {
        setIsFinancesExpanded(false)
        // Delay clearing isCollapsing so other categories don't render immediately
        setTimeout(() => {
          setIsCollapsing(false)
          // Then trigger fade-in
          setTimeout(() => setCategoriesVisible(true), 0)
        }, 0)
      }, 400)
    }
  }

  const handleHealthClick = () => {
    if (!isHealthExpanded && healthRef.current) {
      // Hide other categories and capture position before expanding
      setCategoriesVisible(false)
      const rect = healthRef.current.getBoundingClientRect()
      setHealthStartPosition({ top: rect.top, left: rect.left })
      setIsHealthExpanded(true)
      // Reset position after animation starts
      setTimeout(() => setHealthStartPosition(null), 50)
    } else {
      // Start collapse animation (keep expanded state true during animation)
      setIsCollapsing(true)
      // Wait for collapse animation to complete (400ms), THEN change expanded state
      setTimeout(() => {
        setIsHealthExpanded(false)
        // Delay clearing isCollapsing so other categories don't render immediately
        setTimeout(() => {
          setIsCollapsing(false)
          // Then trigger fade-in
          setTimeout(() => setCategoriesVisible(true), 0)
        }, 0)
      }, 400)
    }
  }

  const handleLogoClick = () => {
    if (isFinancesExpanded || isHealthExpanded) {
      // Start collapse animation (keep expanded state true during animation)
      setIsCollapsing(true)
      // Wait for collapse animation to complete (400ms), THEN change expanded state
      setTimeout(() => {
        setIsFinancesExpanded(false)
        setIsHealthExpanded(false)
        // Delay clearing isCollapsing so other categories don't render immediately
        setTimeout(() => {
          setIsCollapsing(false)
          // Then trigger fade-in
          setTimeout(() => setCategoriesVisible(true), 0)
        }, 0)
      }, 400)
    }
  }

  return (
    <div
      className='w-full h-screen flex flex-col'
      style={{
        backgroundColor: isFinancesExpanded
          ? 'rgba(203, 184, 157, 0.75)'
          : isHealthExpanded
            ? 'rgba(204, 183, 154, 0.75)'
            : '#f5f1e8',
        transition: anyExpanded ? 'background-color 0.7s ease' : 'background-color 0.35s ease',
        backgroundImage: anyExpanded
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
          onClick={handleLogoClick}
        >
          LB
          <span
            style={{
              opacity: anyExpanded ? 1 : 0,
              transition: anyExpanded ? 'opacity 0.8s ease' : 'opacity 0.4s ease',
            }}
          >
            {isFinancesExpanded ? ' > Finances' : isHealthExpanded ? ' > Health' : ''}
          </span>
        </div>

        {/* Right side - User Profile */}
        <UserProfile />
      </nav>

      {/* Main content */}
      <div className='flex-1 flex items-center justify-center gap-8 relative'>
        {/* Finances life category square */}
        {!isHealthExpanded && (
          <div
            ref={financesRef}
            className='flex items-center justify-center cursor-pointer'
            style={{
              opacity: isFinancesExpanded || categoriesVisible ? 1 : 0,
              position: isFinancesExpanded ? 'fixed' : 'relative',
              top: isFinancesExpanded
                ? financesStartPosition
                  ? `${financesStartPosition.top}px`
                  : '0'
                : 'auto',
              left: isFinancesExpanded
                ? financesStartPosition
                  ? `${financesStartPosition.left}px`
                  : '0'
                : 'auto',
              width: isFinancesExpanded ? (financesStartPosition ? '240px' : '100vw') : '240px',
              height: isFinancesExpanded ? (financesStartPosition ? '240px' : '100vh') : '240px',
              background: isFinancesExpanded
                ? 'transparent'
                : 'linear-gradient(135deg, rgba(203, 184, 157, 0.85), rgba(203, 184, 157, 0.65))',
              borderRadius: isFinancesExpanded ? '0' : '16px',
              boxShadow: isFinancesExpanded
                ? 'none'
                : '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
              backdropFilter: isFinancesExpanded ? 'none' : 'blur(8px)',
              fontFamily: 'Georgia, serif',
              fontSize: isFinancesExpanded ? '64px' : '32px',
              fontWeight: 400,
              color: 'white',
              transition: isFinancesExpanded
                ? 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1), background 0.8s ease, border-radius 0.8s ease, opacity 0.15s ease'
                : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease, border-radius 0.4s ease, opacity 0.15s ease',
              zIndex: isFinancesExpanded ? 10 : 1,
            }}
            onMouseEnter={e => {
              if (!isFinancesExpanded) {
                e.currentTarget.style.boxShadow =
                  '0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }
            }}
            onMouseLeave={e => {
              if (!isFinancesExpanded) {
                e.currentTarget.style.boxShadow =
                  '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }
            }}
            onClick={handleFinancesClick}
          >
            {isFinancesExpanded ? '' : 'Finances'}
          </div>
        )}

        {/* Health life category square */}
        {!isFinancesExpanded && !isCollapsing && (
          <div
            ref={healthRef}
            className='flex items-center justify-center cursor-pointer'
            style={{
              opacity: isHealthExpanded || categoriesVisible ? 1 : 0,
              position: isHealthExpanded ? 'fixed' : 'relative',
              top: isHealthExpanded
                ? healthStartPosition
                  ? `${healthStartPosition.top}px`
                  : '0'
                : 'auto',
              left: isHealthExpanded
                ? healthStartPosition
                  ? `${healthStartPosition.left}px`
                  : '0'
                : 'auto',
              width: isHealthExpanded ? (healthStartPosition ? '240px' : '100vw') : '240px',
              height: isHealthExpanded ? (healthStartPosition ? '240px' : '100vh') : '240px',
              background: isHealthExpanded
                ? 'transparent'
                : 'linear-gradient(135deg, rgba(204, 183, 154, 0.85), rgba(204, 183, 154, 0.65))',
              borderRadius: isHealthExpanded ? '0' : '16px',
              boxShadow: isHealthExpanded
                ? 'none'
                : '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
              backdropFilter: isHealthExpanded ? 'none' : 'blur(8px)',
              fontFamily: 'Georgia, serif',
              fontSize: isHealthExpanded ? '64px' : '32px',
              fontWeight: 400,
              color: 'white',
              transition: isHealthExpanded
                ? 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1), background 0.8s ease, border-radius 0.8s ease, opacity 0.15s ease'
                : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease, border-radius 0.4s ease, opacity 0.15s ease',
              zIndex: isHealthExpanded ? 10 : 1,
            }}
            onMouseEnter={e => {
              if (!isHealthExpanded) {
                e.currentTarget.style.boxShadow =
                  '0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }
            }}
            onMouseLeave={e => {
              if (!isHealthExpanded) {
                e.currentTarget.style.boxShadow =
                  '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }
            }}
            onClick={handleHealthClick}
          >
            {isHealthExpanded ? '' : 'Health'}
          </div>
        )}
      </div>
    </div>
  )
}
