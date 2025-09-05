import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoute } from '../constants/routes.js'
import { preserveStoreIdInUrl } from '../util/navigation.js'

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
          // Navigate to document if we have an ID
          if (options?.documentId) {
            navigate(preserveStoreIdInUrl(generateRoute.document(options.documentId)))
          }
          break

        case 'project':
          // Navigate to project if we have an ID
          if (options?.projectId) {
            navigate(preserveStoreIdInUrl(generateRoute.project(options.projectId)))
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

      switch (analysis.type) {
        case 'project':
          return {
            icon: '📄',
            tooltip: 'Project file',
            className: 'cursor-pointer text-blue-600 hover:text-blue-800 hover:underline',
          }
        case 'document':
          return {
            icon: '📝',
            tooltip: 'Document file',
            className: 'cursor-pointer text-green-600 hover:text-green-800 hover:underline',
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
