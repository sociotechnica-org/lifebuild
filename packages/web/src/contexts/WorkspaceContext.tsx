/**
 * Workspace Context for Work Squared
 * Manages workspace selection and CRUD operations
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { AuthInstance } from '@work-squared/shared/auth'
import { useAuth } from './AuthContext.js'

const WORKSPACE_STORAGE_KEY = 'work-squared-current-workspace'

interface WorkspaceContextType {
  // State
  workspaces: AuthInstance[]
  currentWorkspaceId: string | null
  isLoading: boolean
  error: string | null

  // Actions
  switchWorkspace: (workspaceId: string) => Promise<boolean>
  createWorkspace: (name?: string) => Promise<boolean>
  renameWorkspace: (workspaceId: string, name: string) => Promise<boolean>
  setDefaultWorkspace: (workspaceId: string) => Promise<boolean>
  deleteWorkspace: (workspaceId: string) => Promise<boolean>
  refreshWorkspaces: () => Promise<boolean>
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}

interface WorkspaceProviderProps {
  children: React.ReactNode
}

const AUTH_WORKER_URL = import.meta.env.VITE_AUTH_WORKER_URL || 'http://localhost:8788'

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const { user, isAuthenticated, getCurrentToken, refreshToken } = useAuth()
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<AuthInstance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize workspace state from user instances
  useEffect(() => {
    if (!isAuthenticated || !user?.instances) {
      setWorkspaces([])
      setCurrentWorkspaceId(null)
      localStorage.removeItem(WORKSPACE_STORAGE_KEY)
      return
    }

    // Update workspace list from user
    setWorkspaces(user.instances)

    // Determine current workspace
    const storedWorkspaceId = localStorage.getItem(WORKSPACE_STORAGE_KEY)

    // Verify stored workspace ID is still valid
    const isValidWorkspace =
      storedWorkspaceId && user.instances.some(w => w.id === storedWorkspaceId)

    if (isValidWorkspace) {
      setCurrentWorkspaceId(storedWorkspaceId)
    } else {
      // Fall back to default or first workspace
      const defaultWorkspace = user.instances.find(w => w.isDefault)
      const workspaceId = defaultWorkspace?.id || user.instances[0]?.id || null

      if (workspaceId) {
        setCurrentWorkspaceId(workspaceId)
        localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId)
      }
    }
  }, [user, isAuthenticated])

  const makeAuthenticatedRequest = useCallback(
    async (path: string, options: RequestInit = {}): Promise<Response> => {
      const token = await getCurrentToken()
      if (!token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`${AUTH_WORKER_URL}${path}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      // Handle token expiration
      if (response.status === 401) {
        const refreshed = await refreshToken()
        if (refreshed) {
          // Retry with new token
          const newToken = await getCurrentToken()
          return fetch(`${AUTH_WORKER_URL}${path}`, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          })
        }
      }

      return response
    },
    [getCurrentToken, refreshToken]
  )

  const switchWorkspace = useCallback(
    async (workspaceId: string): Promise<boolean> => {
      // Verify workspace exists
      if (!workspaces.find(w => w.id === workspaceId)) {
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        // Touch the workspace to update lastAccessedAt
        const response = await makeAuthenticatedRequest(`/workspaces/${workspaceId}/access`, {
          method: 'POST',
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error?.message || 'Failed to switch workspace')
        }

        // Update local state
        setCurrentWorkspaceId(workspaceId)
        localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId)

        // Refresh workspaces to get updated lastAccessedAt
        await refreshWorkspaces()

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to switch workspace'
        setError(message)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [workspaces, makeAuthenticatedRequest]
  )

  const createWorkspace = useCallback(
    async (name?: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await makeAuthenticatedRequest('/workspaces', {
          method: 'POST',
          body: JSON.stringify(name ? { name } : {}),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error?.message || 'Failed to create workspace')
        }

        const data = await response.json()

        // Refresh workspaces to get the new one
        await refreshWorkspaces()

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create workspace'
        setError(message)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [makeAuthenticatedRequest]
  )

  const renameWorkspace = useCallback(
    async (workspaceId: string, name: string): Promise<boolean> => {
      if (!name.trim()) {
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await makeAuthenticatedRequest(`/workspaces/${workspaceId}/rename`, {
          method: 'POST',
          body: JSON.stringify({ name }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error?.message || 'Failed to rename workspace')
        }

        // Refresh workspaces to get the updated name
        await refreshWorkspaces()

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to rename workspace'
        setError(message)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [makeAuthenticatedRequest]
  )

  const setDefaultWorkspace = useCallback(
    async (workspaceId: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await makeAuthenticatedRequest(`/workspaces/${workspaceId}/set-default`, {
          method: 'POST',
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error?.message || 'Failed to set default workspace')
        }

        // Refresh workspaces to get updated default status
        await refreshWorkspaces()

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to set default workspace'
        setError(message)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [makeAuthenticatedRequest]
  )

  const deleteWorkspace = useCallback(
    async (workspaceId: string): Promise<boolean> => {
      // Prevent deleting current workspace
      if (workspaceId === currentWorkspaceId) {
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await makeAuthenticatedRequest(`/workspaces/${workspaceId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error?.message || 'Failed to delete workspace')
        }

        // Refresh workspaces to remove the deleted one
        await refreshWorkspaces()

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete workspace'
        setError(message)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [currentWorkspaceId, makeAuthenticatedRequest]
  )

  const refreshWorkspaces = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      return false
    }

    try {
      const response = await makeAuthenticatedRequest('/workspaces', {
        method: 'GET',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to refresh workspaces')
      }

      const data = await response.json()

      // Update workspaces from response
      if (data.instances && Array.isArray(data.instances)) {
        setWorkspaces(data.instances)

        // Verify current workspace is still valid
        if (
          currentWorkspaceId &&
          !data.instances.find((w: AuthInstance) => w.id === currentWorkspaceId)
        ) {
          // Current workspace was deleted, switch to default or first
          const defaultWorkspace = data.instances.find((w: AuthInstance) => w.isDefault)
          const newWorkspaceId = defaultWorkspace?.id || data.instances[0]?.id || null

          if (newWorkspaceId) {
            setCurrentWorkspaceId(newWorkspaceId)
            localStorage.setItem(WORKSPACE_STORAGE_KEY, newWorkspaceId)
          } else {
            setCurrentWorkspaceId(null)
            localStorage.removeItem(WORKSPACE_STORAGE_KEY)
          }
        }
      }

      return true
    } catch (err) {
      console.error('Failed to refresh workspaces:', err)
      return false
    }
  }, [isAuthenticated, currentWorkspaceId, makeAuthenticatedRequest])

  const contextValue: WorkspaceContextType = {
    workspaces,
    currentWorkspaceId,
    isLoading,
    error,
    switchWorkspace,
    createWorkspace,
    renameWorkspace,
    setDefaultWorkspace,
    deleteWorkspace,
    refreshWorkspaces,
  }

  return <WorkspaceContext.Provider value={contextValue}>{children}</WorkspaceContext.Provider>
}
