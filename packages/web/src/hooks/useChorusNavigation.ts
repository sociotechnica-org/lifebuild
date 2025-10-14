import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFileNavigation } from './useFileNavigation.js'
import { useStore } from '@livestore/react'
import { getTaskById$ } from '@work-squared/shared/queries'

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

      // Parse the path to determine the type and ID
      // Format: "type:id" or just a file path
      if (path.includes(':')) {
        const [type, id] = path.split(':', 2)

        switch (type) {
          case 'task': {
            if (!id) break
            // Look up the task to find its project, then navigate to that project
            try {
              const task = await store.query(getTaskById$(id))
              if (task && 'projectId' in task && task.projectId) {
                navigate(`/project/${task.projectId}`)
              } else {
                // Navigate to orphaned tasks view
                navigate('/tasks')
              }
            } catch (error) {
              console.error('Error looking up task:', error)
              navigate('/tasks')
            }
            break
          }
          case 'project':
            navigate(`/project/${id}`)
            break
          case 'document':
            navigate(`/document/${id}`)
            break
          case 'contact':
            navigate(`/contacts/${id}`)
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
