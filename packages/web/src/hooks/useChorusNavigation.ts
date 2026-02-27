import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFileNavigation } from './useFileNavigation.js'
import { useStore } from '../livestore-compat.js'
import { getTaskById$ } from '@lifebuild/shared/queries'
import { generateRoute } from '../constants/routes.js'
import { preserveStoreIdInUrl } from '../utils/navigation.js'

/**
 * Global hook that handles clicks on CHORUS_TAG elements via event delegation
 * Uses document-level event listener to avoid re-render issues
 */
export const useChorusNavigation = () => {
  const { navigateToFile } = useFileNavigation()
  const navigate = useNavigate()
  const { store } = useStore()

  useEffect(() => {
    const handleChorusClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Check if the clicked element is a CHORUS element
      const chorusElement = target.closest('[data-chorus="true"]')
      if (!chorusElement) return

      // Prevent default link behavior and stop propagation to avoid conflicts
      event.preventDefault()
      event.stopPropagation()

      const path = chorusElement.getAttribute('data-file-path')
      if (!path) return

      // Validate that the path looks like a navigation path, not text content
      // Valid paths should be either "type:id" or a file path (containing / or .)
      // If it looks like display text (contains spaces, arrows, etc.), warn and bail
      const looksLikeTextContent =
        /[→←↑↓]/.test(path) || (path.includes(' ') && !path.includes('/') && !path.includes('.'))
      if (looksLikeTextContent) {
        console.error(
          '[CHORUS] Invalid path - looks like display text instead of navigation path:',
          path,
          '\nThe AI likely generated <CHORUS_TAG>text</CHORUS_TAG> instead of <CHORUS_TAG path="type:id">text</CHORUS_TAG>'
        )
        return
      }

      // Parse the path to determine the type and ID
      // Format: "type:id" or just a file path
      if (path.includes(':')) {
        const [type, id] = path.split(':', 2)

        switch (type) {
          case 'task': {
            if (!id) break
            // Look up the task to find its project, then navigate to that project
            try {
              const taskResult = await store.query(getTaskById$(id))
              const task = taskResult?.[0]
              if (task?.projectId) {
                navigate(preserveStoreIdInUrl(generateRoute.project(task.projectId)))
              } else {
                navigate(preserveStoreIdInUrl(generateRoute.lifeMap()))
              }
            } catch (error) {
              console.error('Error looking up task:', error)
              navigate(preserveStoreIdInUrl(generateRoute.lifeMap()))
            }
            break
          }
          case 'project': {
            if (!id) break
            const projectUrl = preserveStoreIdInUrl(generateRoute.project(id))
            navigate(projectUrl)
            break
          }
          case 'document':
          case 'contact':
            navigateToFile(path)
            break
          case 'file':
            if (id) {
              navigateToFile(id)
            }
            break
          default:
            console.warn('Unknown CHORUS_TAG type:', type)
        }
      } else {
        // Assume it's a file path if no type prefix
        navigateToFile(path)
      }
    }

    // Add document-level event listener for safe event delegation
    document.addEventListener('click', handleChorusClick, true) // Use capture phase

    return () => {
      document.removeEventListener('click', handleChorusClick, true)
    }
  }, [navigateToFile, navigate, store])
}
