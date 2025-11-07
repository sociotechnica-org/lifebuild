import { useEffect, useRef } from 'react'

/**
 * Hook to trap focus within a container element (e.g., modal, dropdown)
 * Ensures keyboard navigation stays within the container and restores focus on unmount
 * Follows WCAG 2.2 Level AA guidelines for focus management
 *
 * @param isActive - Whether the focus trap is active
 * @param restoreFocus - Whether to restore focus to the previously focused element on unmount
 * @returns A ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement>(
  isActive: boolean = true,
  restoreFocus: boolean = true
) {
  const containerRef = useRef<T>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive) return

    // Store the currently focused element to restore later
    previousFocusRef.current = document.activeElement as HTMLElement

    const container = containerRef.current
    if (!container) return

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',')

      return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
        el => !el.hasAttribute('disabled') && el.offsetParent !== null
      )
    }

    // Focus the first focusable element
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0 && focusableElements[0]) {
      focusableElements[0].focus()
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        e.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      // Ensure both elements exist before accessing them
      if (!firstElement || !lastElement) return

      if (e.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    // Add event listener to trap focus
    container.addEventListener('keydown', handleTabKey)

    return () => {
      container.removeEventListener('keydown', handleTabKey)

      // Restore focus to the previously focused element
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isActive, restoreFocus])

  return containerRef
}
