/**
 * Hook for managing sync payload with authentication
 */

import { useCallback, useEffect, useState } from 'react'
import { SyncPayload } from '@work-squared/shared/auth'
import { useAuth } from '../contexts/AuthContext.js'

interface UseSyncPayloadOptions {
  instanceId: string
}

export function useSyncPayload({ instanceId }: UseSyncPayloadOptions) {
  const { getCurrentToken, isAuthenticated, handleConnectionError } = useAuth()
  const [syncPayload, setSyncPayload] = useState<SyncPayload>({
    instanceId,
    authToken: undefined,
  })

  const updateSyncPayload = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        setSyncPayload({
          instanceId,
          authToken: undefined,
        })
        return
      }

      let token = await getCurrentToken()
      if (token) {
        setSyncPayload({
          instanceId,
          authToken: token,
        })
        return
      }

      const handled = await handleConnectionError(
        new Error('TOKEN_MISSING: Unable to retrieve access token for sync')
      )

      if (handled) {
        token = await getCurrentToken()
        if (token) {
          setSyncPayload({
            instanceId,
            authToken: token,
          })
          return
        }
      }

      setSyncPayload({
        instanceId,
        authToken: undefined,
        authError: 'TOKEN_MISSING',
      })
    } catch (error) {
      console.error('Error updating sync payload:', error)
      await handleConnectionError(error)

      setSyncPayload({
        instanceId,
        authToken: undefined,
        authError: (error as Error).message,
      })
    }
  }, [instanceId, isAuthenticated, getCurrentToken, handleConnectionError])

  // Update payload when auth state changes
  useEffect(() => {
    updateSyncPayload()
  }, [updateSyncPayload])

  return { syncPayload, updateSyncPayload }
}
