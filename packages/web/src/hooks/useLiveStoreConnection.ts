import { useEffect, useState } from 'react'
import { Effect, Fiber, Stream } from '@livestore/utils/effect'
import { useStore } from '../livestore-compat.js'

type SyncStatus = {
  pendingCount: number
  isSynced: boolean
  [key: string]: unknown
}

type NetworkStatus = {
  isConnected: boolean
  timestampMs: number
  devtools?: {
    latchClosed: boolean
  }
}

export type LiveStoreConnectionStatus = {
  networkStatus: NetworkStatus | null
  syncStatus: SyncStatus | null
  lastConnectedAt: Date | null
  lastSyncUpdateAt: Date | null
}

export const useLiveStoreConnection = (): LiveStoreConnectionStatus => {
  const { store } = useStore()
  const storeAny = store as unknown as {
    syncStatus?: () => SyncStatus
    subscribeSyncStatus?: (onUpdate: (status: SyncStatus) => void) => () => void
  }
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null)
  const [lastSyncUpdateAt, setLastSyncUpdateAt] = useState<Date | null>(null)

  useEffect(() => {
    let isActive = true

    const setSyncUpdateTime = (timestamp: number) => {
      setLastSyncUpdateAt(new Date(timestamp))
    }

    if (storeAny.syncStatus) {
      try {
        const initialStatus = storeAny.syncStatus()
        setSyncStatus(initialStatus)
        setSyncUpdateTime(Date.now())
      } catch (error) {
        console.warn('LiveStore sync status unavailable:', error)
      }
    }

    const unsubscribe = storeAny.subscribeSyncStatus
      ? storeAny.subscribeSyncStatus((status: SyncStatus) => {
          if (!isActive) return
          setSyncStatus(status)
          setSyncUpdateTime(Date.now())
        })
      : () => undefined

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [store])

  useEffect(() => {
    let isActive = true
    const networkStatusSource = (store as { networkStatus?: unknown }).networkStatus as
      | {
          changes?: Stream.Stream<unknown>
        }
      | undefined

    const updateNetworkStatus = (status: NetworkStatus) => {
      if (!isActive) return
      setNetworkStatus(status)
      if (status.isConnected) {
        setLastConnectedAt(new Date(status.timestampMs))
      }
    }

    if (!networkStatusSource || !networkStatusSource.changes) {
      return () => {
        isActive = false
      }
    }

    Effect.runPromise(store.networkStatus)
      .then(status => updateNetworkStatus(status as NetworkStatus))
      .catch(error => console.warn('LiveStore network status unavailable:', error))

    const fiber = Effect.runFork(
      networkStatusSource.changes.pipe(
        Stream.tap(status => Effect.sync(() => updateNetworkStatus(status as NetworkStatus))),
        Stream.runDrain,
        Effect.scoped
      )
    )

    return () => {
      isActive = false
      Effect.runFork(Fiber.interrupt(fiber))
    }
  }, [store])

  return {
    networkStatus,
    syncStatus,
    lastConnectedAt,
    lastSyncUpdateAt,
  }
}
