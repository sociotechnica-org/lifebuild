import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFileNavigation } from './useFileNavigation.js'
import { useStore } from '../livestore-compat.js'
import { getProjectById$, getTaskById$ } from '@lifebuild/shared/queries'
import { resolveLifecycleState, type PlanningAttributes } from '@lifebuild/shared'
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
            try {
              const projectResult = await store.query(getProjectById$(id))
              const project = projectResult?.[0]

              if (project) {
                let attributes: PlanningAttributes | null = null
                try {
                  attributes =
                    typeof project.attributes === 'string'
                      ? (JSON.parse(project.attributes) as PlanningAttributes)
                      : (project.attributes as PlanningAttributes | null)
                } catch {
                  attributes = null
                }

                const lifecycleState = resolveLifecycleState(
                  project.projectLifecycleState,
                  attributes
                )

                // For planning projects, "View project" should take the Builder to the
                // appropriate Drafting Room stage (where edits happen), not the read-only view.
                if (lifecycleState.status === 'planning') {
                  if (lifecycleState.stage === 1) {
                    navigate(preserveStoreIdInUrl(generateRoute.projectStage1(id)))
                    break
                  }
                  if (lifecycleState.stage === 2) {
                    navigate(preserveStoreIdInUrl(generateRoute.projectStage2(id)))
                    break
                  }
                  if (lifecycleState.stage === 3) {
                    navigate(preserveStoreIdInUrl(generateRoute.projectStage3(id)))
                    break
                  }
                }
              }
            } catch (error) {
              console.error('Error looking up project:', error)
            }

            const projectUrl = preserveStoreIdInUrl(generateRoute.project(id))
            navigate(projectUrl)
            break
          }
          case 'drafting-stage1': {
            if (!id) break
            const stage1Url = preserveStoreIdInUrl(generateRoute.projectStage1(id))
            navigate(stage1Url)
            break
          }
          case 'drafting-stage2': {
            if (!id) break
            const stage2Url = preserveStoreIdInUrl(generateRoute.projectStage2(id))
            navigate(stage2Url)
            break
          }
          case 'drafting-stage3': {
            if (!id) break
            const stage3Url = preserveStoreIdInUrl(generateRoute.projectStage3(id))
            navigate(stage3Url)
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
