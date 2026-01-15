import React, { useState, useRef, useCallback } from 'react'

export interface TooltipProps {
  /** The content to show in the tooltip */
  content: React.ReactNode
  /** The element that triggers the tooltip */
  children: React.ReactElement
  /** Delay in milliseconds before showing the tooltip (default: 50) */
  delay?: number
  /** Position of the tooltip relative to the trigger */
  position?: 'top' | 'bottom'
}

/**
 * Tooltip component that shows content on hover with a configurable delay.
 *
 * Usage:
 * ```tsx
 * <Tooltip content="This is the tooltip text">
 *   <button>Hover me</button>
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = 50,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }, [delay])

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }, [])

  const positionClasses =
    position === 'top'
      ? 'bottom-full left-1/2 -translate-x-1/2 mb-1.5'
      : 'top-full left-1/2 -translate-x-1/2 mt-1.5'

  return (
    <div className='relative inline-block' onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      {children}
      {isVisible && (
        <div
          className={`absolute ${positionClasses} z-50 px-2.5 py-1.5 text-xs text-white bg-[#2f2b27] rounded-md whitespace-nowrap shadow-lg pointer-events-none`}
          role='tooltip'
        >
          {content}
        </div>
      )}
    </div>
  )
}
