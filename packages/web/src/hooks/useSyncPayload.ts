/**
 * Hook for managing sync payload with authentication
 */

import { useCallback, useEffect, useState } from 'react'
import { SyncPayload, DEV_AUTH } from '@work-squared/shared/auth'
import { useAuth } from '../contexts/AuthContext.js'

interface UseSyncPayloadOptions {
  instanceId: string
}

export function useSyncPayload({ instanceId }: UseSyncPayloadOptions) {
  const { getCurrentToken, isAuthenticated, refreshToken, handleConnectionError } = useAuth()
  const [syncPayload, setSyncPayload] = useState<SyncPayload>({
    instanceId,
    authToken: DEV_AUTH.INSECURE_TOKEN, // Fallback for development
  })
  
  // Debug logs - remove after testing
  // console.log('useSyncPayload - instanceId:', instanceId)
  // console.log('useSyncPayload - current syncPayload:', syncPayload)

  const updateSyncPayload = useCallback(async () => {
    try {
      if (isAuthenticated) {
        const token = await getCurrentToken()
        if (token) {
          setSyncPayload({
            instanceId,
            authToken: token,
          })
          return
        }

        // Try to refresh token
        const refreshed = await refreshToken()
        if (refreshed) {
          const newToken = await getCurrentToken()
          if (newToken) {
            setSyncPayload({
              instanceId,
              authToken: newToken,
            })
            return
          }
        }
      }

      // Fallback to insecure token for development
      setSyncPayload({
        instanceId,
        authToken: DEV_AUTH.INSECURE_TOKEN,
      })
    } catch (error) {
      console.error('Error updating sync payload:', error)
      // Try to handle connection error
      await handleConnectionError(error)

      // Fallback to insecure token
      setSyncPayload({
        instanceId,
        authToken: DEV_AUTH.INSECURE_TOKEN,
      })
    }
  }, [instanceId, isAuthenticated, getCurrentToken, refreshToken, handleConnectionError])

  // Update payload when auth state changes
  useEffect(() => {
    updateSyncPayload()
  }, [updateSyncPayload])

  return { syncPayload, updateSyncPayload }
}
