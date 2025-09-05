import { useEffect } from 'react'
import { useFileNavigation } from './useFileNavigation.js'

/**
 * Global hook that handles clicks on CHORUS_TAG elements via event delegation
 * Uses document-level event listener to avoid re-render issues
 */
export const useChorusNavigation = () => {
  const { navigateToFile } = useFileNavigation()

  useEffect(() => {
    const handleChorusClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Check if the clicked element is a CHORUS element
      const chorusElement = target.closest('[data-chorus="true"]')
      if (!chorusElement) return

      // Prevent default link behavior and stop propagation to avoid conflicts
      event.preventDefault()
      event.stopPropagation()

      const filePath = chorusElement.getAttribute('data-file-path')
      if (filePath) {
        navigateToFile(filePath)
      }
    }

    // Add document-level event listener for safe event delegation
    document.addEventListener('click', handleChorusClick, true) // Use capture phase

    return () => {
      document.removeEventListener('click', handleChorusClick, true)
    }
  }, [navigateToFile])
}
