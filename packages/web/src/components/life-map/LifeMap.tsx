import React from 'react'
import { AuthStatusBanner } from '../auth/AuthStatusBanner.js'
import { UserProfile } from '../user/UserProfile.js'

/**
 * LifeMap - Experimental new homepage UI
 * This component is for exploring a completely new UI and layout
 */
export const LifeMap: React.FC = () => {
  return (
    <div
      className='w-full h-screen flex flex-col bg-[#f5f1e8]'
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
      }}
    >
      {/* Auth Status Banner - centered when shown */}
      <div className='flex justify-center'>
        <AuthStatusBanner />
      </div>

      {/* Top navbar */}
      <nav className='flex items-center justify-between px-4 py-3'>
        {/* Left side - LB logo */}
        <div className='text-2xl font-bold'>LB</div>

        {/* Right side - User Profile */}
        <UserProfile />
      </nav>

      {/* Main content */}
      <div className='flex-1 p-4'>{/* Content will go here */}</div>
    </div>
  )
}
