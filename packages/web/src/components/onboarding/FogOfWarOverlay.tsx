import React from 'react'

type FogOfWarOverlayProps = {
  isVisible: boolean
  isRevealing?: boolean
  dismissible?: boolean
  onDismiss?: () => void
}

export const FogOfWarOverlay: React.FC<FogOfWarOverlayProps> = ({
  isVisible,
  isRevealing = false,
  dismissible = false,
  onDismiss,
}) => {
  if (!isVisible && !isRevealing) {
    return null
  }

  return (
    <div
      className='pointer-events-none absolute inset-0 z-[18] transition-opacity duration-[1200ms]'
      data-testid='onboarding-fog-overlay'
      style={{
        opacity: isRevealing ? 0 : 1,
        background:
          'radial-gradient(circle at center, rgba(255, 248, 236, 0.06) 0%, rgba(40, 29, 20, 0.72) 36%, rgba(22, 15, 9, 0.9) 100%)',
      }}
      aria-hidden='true'
    >
      {dismissible && !isRevealing && (
        <div className='pointer-events-auto absolute right-4 top-4'>
          <button
            type='button'
            className='rounded-md border border-[#cdb89f] bg-[#fff8ec]/90 px-2.5 py-1 text-xs font-semibold text-[#5f4a36] transition-colors hover:bg-white'
            onClick={onDismiss}
            data-testid='onboarding-fog-dismiss'
          >
            Dismiss fog
          </button>
        </div>
      )}
    </div>
  )
}
