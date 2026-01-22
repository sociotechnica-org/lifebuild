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
      if (!chorusElement) {
        // Only log if target looks like a chorus link (has the class)
        if (target.classList.contains('chorus-file-link')) {
          console.log('[CHORUS] Found chorus-file-link but no data-chorus attribute:', target)
        }
        return
      }
      console.log('[CHORUS] Element found:', chorusElement)

      // Prevent default link behavior and stop propagation to avoid conflicts
      event.preventDefault()
      event.stopPropagation()

      const path = chorusElement.getAttribute('data-file-path')
      console.log('[CHORUS] Click detected, path:', path)
      if (!path) return

      // Parse the path to determine the type and ID
      // Format: "type:id" or just a file path
      if (path.includes(':')) {
        const [type, id] = path.split(':', 2)
        console.log('[CHORUS] Parsed type:', type, 'id:', id)

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
                // Navigate to orphaned tasks view
                navigate('/old/tasks')
              }
            } catch (error) {
              console.error('Error looking up task:', error)
              navigate('/old/tasks')
            }
            break
          }
          case 'project': {
            if (!id) break
            const projectUrl = preserveStoreIdInUrl(generateRoute.project(id))
            console.log('[CHORUS] Navigating to project:', projectUrl)
            navigate(projectUrl)
            break
          }
          case 'drafting-stage1': {
            if (!id) break
            const stage1Url = preserveStoreIdInUrl(generateRoute.projectStage1(id))
            console.log('[CHORUS] Navigating to stage1:', stage1Url)
            navigate(stage1Url)
            break
          }
          case 'drafting-stage2': {
            if (!id) break
            const stage2Url = preserveStoreIdInUrl(generateRoute.projectStage2(id))
            console.log('[CHORUS] Navigating to stage2:', stage2Url)
            navigate(stage2Url)
            break
          }
          case 'drafting-stage3': {
            if (!id) break
            const stage3Url = preserveStoreIdInUrl(generateRoute.projectStage3(id))
            console.log('[CHORUS] Navigating to stage3:', stage3Url)
            navigate(stage3Url)
            break
          }
          case 'document':
            navigate(`/old/document/${id}`)
            break
          case 'contact':
            navigate(`/old/contacts/${id}`)
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
