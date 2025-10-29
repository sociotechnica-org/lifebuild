import React from 'react'
import { AuthStatusBanner } from '../auth/AuthStatusBanner.js'
import { UserProfile } from '../user/UserProfile.js'

interface StrategyStudioProps {
  hideNavbar?: boolean
}

/**
 * Strategy Studio - Strategic planning and goal setting interface
 * This component is positioned "above" the LifeMap conceptually
 */
export const StrategyStudio: React.FC<StrategyStudioProps> = ({ hideNavbar = false }) => {
  const [isLogoHovered, setIsLogoHovered] = React.useState(false)

  return (
    <div
      className='w-full h-screen flex flex-col'
      style={{
        backgroundColor: '#e8f1f5',
        backgroundImage: `
          radial-gradient(ellipse 1200px 900px at 15% 25%, rgba(0,0,0,.08) 0%, transparent 60%),
          radial-gradient(ellipse 950px 1300px at 85% 15%, rgba(0,0,0,.06) 0%, transparent 65%),
          radial-gradient(ellipse 1100px 700px at 35% 75%, rgba(0,0,0,.09) 0%, transparent 55%),
          repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.03) 2px, rgba(0,0,0,.03) 4px),
          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.03) 2px, rgba(0,0,0,.03) 4px)
        `,
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
            >
              LB
              <span className='text-lg ml-2 text-gray-600'> &gt; Strategy Studio</span>
            </div>

            {/* Right side - User Profile */}
            <UserProfile />
          </nav>
        </>
      )}

      {/* Main content */}
      <div className='flex-1 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-6xl mb-4' style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
            Strategy Studio
          </h1>
          <p className='text-xl text-gray-600'>Coming soon...</p>
        </div>
      </div>
    </div>
  )
}
