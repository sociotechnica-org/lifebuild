import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoute } from '../constants/routes.js'
import { preserveStoreIdInUrl } from '../utils/navigation.js'

export type FileNavigationType = 'project' | 'document' | 'external' | 'unknown'

interface FileNavigationResult {
  type: FileNavigationType
  path: string
  navigable: boolean
}

/**
 * Hook for handling navigation from file paths in tool outputs
 * Analyzes file paths and provides appropriate navigation actions
 */
export const useFileNavigation = () => {
  const navigate = useNavigate()

  /**
   * Analyzes a file path to determine navigation type and target
   */
  const analyzeFilePath = useCallback((filePath: string): FileNavigationResult => {
    // Remove any leading/trailing whitespace
    const cleanPath = filePath.trim()

    // Check for Work Squared entity references
    if (cleanPath.startsWith('document:')) {
      return {
        type: 'document',
        path: cleanPath,
        navigable: true,
      }
    }

    if (cleanPath.startsWith('project:')) {
      return {
        type: 'project',
        path: cleanPath,
        navigable: true,
      }
    }

    if (cleanPath.startsWith('task:')) {
      return {
        type: 'project', // Tasks are viewed within projects
        path: cleanPath,
        navigable: true,
      }
    }

    // Check for common project file patterns
    if (cleanPath.match(/\.(tsx?|jsx?|py|java|cpp?|h|rs|go|php)$/)) {
      return {
        type: 'project',
        path: cleanPath,
        navigable: false, // For now, we can't navigate to arbitrary code files
      }
    }

    // Check for documentation files
    if (cleanPath.match(/\.(md|txt|rst|doc|docx)$/i)) {
      return {
        type: 'document',
        path: cleanPath,
        navigable: false, // Would need document ID to navigate
      }
    }

    // Check for external URLs
    if (cleanPath.match(/^https?:\/\//)) {
      return {
        type: 'external',
        path: cleanPath,
        navigable: true,
      }
    }

    return {
      type: 'unknown',
      path: cleanPath,
      navigable: false,
    }
  }, [])

  /**
   * Handles navigation for a given file path
   */
  const navigateToFile = useCallback(
    (filePath: string, options?: { documentId?: string; projectId?: string }) => {
      const analysis = analyzeFilePath(filePath)

      switch (analysis.type) {
        case 'external':
          // Open external URLs in new tab
          window.open(analysis.path, '_blank', 'noopener,noreferrer')
          break

        case 'document':
          // Handle document references
          if (analysis.path.startsWith('document:')) {
            const documentId = analysis.path.split(':')[1]
            if (documentId) {
              navigate(preserveStoreIdInUrl(generateRoute.document(documentId)))
            }
          } else if (options?.documentId) {
            navigate(preserveStoreIdInUrl(generateRoute.document(options.documentId)))
          } else {
            // Copy to clipboard as fallback
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
              navigator.clipboard.writeText(analysis.path).catch(err => {
                console.error('Failed to copy file path', err)
              })
            }
          }
          break

        case 'project':
          // Handle project and task references
          if (analysis.path.startsWith('project:')) {
            const projectId = analysis.path.split(':')[1]
            if (projectId) {
              navigate(preserveStoreIdInUrl(generateRoute.project(projectId)))
            }
          } else if (analysis.path.startsWith('task:')) {
            // For tasks, we need to find the project they belong to
            // For now, copy task ID to clipboard
            const taskId = analysis.path.split(':')[1]
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
              navigator.clipboard.writeText(`Task ID: ${taskId}`).catch(err => {
                console.error('Failed to copy task ID', err)
              })
            }
          } else if (options?.projectId) {
            navigate(preserveStoreIdInUrl(generateRoute.project(options.projectId)))
          } else {
            // Copy to clipboard as fallback
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
              navigator.clipboard.writeText(analysis.path).catch(err => {
                console.error('Failed to copy file path', err)
              })
            }
          }
          break

        default:
          // For now, just copy the path to clipboard as fallback
          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(analysis.path).catch(err => {
              console.error('Failed to copy file path', err)
            })
          }
          break
      }
    },
    [navigate, analyzeFilePath]
  )

  /**
   * Gets display information for a file path (icon, tooltip, etc.)
   */
  const getFilePathDisplay = useCallback(
    (filePath: string) => {
      const analysis = analyzeFilePath(filePath)
      const cleanPath = analysis.path

      switch (analysis.type) {
        case 'project':
          if (cleanPath.startsWith('project:')) {
            return {
              icon: '📂',
              tooltip: 'Navigate to project',
              className: 'cursor-pointer text-blue-600 hover:text-blue-800 hover:underline',
            }
          } else if (cleanPath.startsWith('task:')) {
            return {
              icon: '✅',
              tooltip: 'Copy task ID',
              className: 'cursor-pointer text-indigo-600 hover:text-indigo-800 hover:underline',
            }
          } else {
            return {
              icon: '📄',
              tooltip: 'Copy file path',
              className: 'cursor-pointer text-blue-600 hover:text-blue-800 hover:underline',
            }
          }
        case 'document':
          if (cleanPath.startsWith('document:')) {
            return {
              icon: '📝',
              tooltip: 'Navigate to document',
              className: 'cursor-pointer text-green-600 hover:text-green-800 hover:underline',
            }
          } else {
            return {
              icon: '📝',
              tooltip: 'Copy document path',
              className: 'cursor-pointer text-green-600 hover:text-green-800 hover:underline',
            }
          }
        case 'external':
          return {
            icon: '🔗',
            tooltip: 'Open external link',
            className: 'cursor-pointer text-purple-600 hover:text-purple-800 hover:underline',
          }
        default:
          return {
            icon: '📁',
            tooltip: 'Copy file path',
            className: 'cursor-pointer text-gray-600 hover:text-gray-800 hover:underline',
          }
      }
    },
    [analyzeFilePath]
  )

  return {
    analyzeFilePath,
    navigateToFile,
    getFilePathDisplay,
  }
}
