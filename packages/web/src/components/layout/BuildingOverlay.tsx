import React, { useEffect } from 'react'

type BuildingOverlayProps = {
  title: string
  onClose: () => void
  children: React.ReactNode
  panelClassName?: string
}

/**
 * Shared map overlay frame for building surfaces.
 */
export const BuildingOverlay: React.FC<BuildingOverlayProps> = ({
  title,
  onClose,
  children,
  panelClassName,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className='pointer-events-none absolute inset-0 z-[100] flex items-center justify-center p-4 sm:p-6'
      data-testid='building-overlay'
    >
      <div
        className='pointer-events-auto absolute inset-0 bg-[#2f2b27]/45 backdrop-blur-[1px]'
        aria-label='Close overlay'
        onClick={onClose}
        data-testid='building-overlay-backdrop'
      />

      <section
        role='dialog'
        aria-modal='true'
        aria-label={title}
        className={`pointer-events-auto relative z-[1] w-full max-w-[920px] max-h-[calc(100dvh-8.5rem)] overflow-hidden rounded-2xl border border-[#d8cab3] bg-[#f5f3f0] shadow-[0_20px_60px_rgba(0,0,0,0.28)] ${panelClassName ?? ''}`}
        data-testid='building-overlay-panel'
      >
        <button
          type='button'
          className='absolute right-3 top-3 z-[2] rounded-md border border-[#d8cab3] bg-[#fff8ec] px-2 py-1 text-xs font-semibold text-[#5f4a36] transition-colors hover:bg-white'
          aria-label='Close overlay'
          onClick={onClose}
          data-testid='building-overlay-close'
        >
          Close
        </button>
        <div className='h-full overflow-y-auto p-4 sm:p-6'>{children}</div>
      </section>
    </div>
  )
}
