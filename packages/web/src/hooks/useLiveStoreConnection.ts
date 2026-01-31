import { useEffect, useState } from 'react'
import type { SyncStatus } from '@livestore/livestore'
import { Effect, Fiber, Stream } from '@livestore/utils/effect'
import { useStore } from '../livestore-compat.js'

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
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null)
  const [lastSyncUpdateAt, setLastSyncUpdateAt] = useState<Date | null>(null)

  useEffect(() => {
    let isActive = true

    const setSyncUpdateTime = (timestamp: number) => {
      setLastSyncUpdateAt(new Date(timestamp))
    }

    try {
      const initialStatus = store.syncStatus()
      setSyncStatus(initialStatus)
      setSyncUpdateTime(Date.now())
    } catch (error) {
      console.warn('LiveStore sync status unavailable:', error)
    }

    const unsubscribe = store.subscribeSyncStatus((status) => {
      if (!isActive) return
      setSyncStatus(status)
      setSyncUpdateTime(Date.now())
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [store])

  useEffect(() => {
    let isActive = true

    const updateNetworkStatus = (status: NetworkStatus) => {
      if (!isActive) return
      setNetworkStatus(status)
      if (status.isConnected) {
        setLastConnectedAt(new Date(status.timestampMs))
      }
    }

    Effect.runPromise(store.networkStatus)
      .then((status) => updateNetworkStatus(status as NetworkStatus))
      .catch((error) => console.warn('LiveStore network status unavailable:', error))

    const fiber = Effect.runFork(
      store.networkStatus.changes.pipe(
        Stream.tap((status) => Effect.sync(() => updateNetworkStatus(status as NetworkStatus))),
        Stream.runDrain,
        Effect.scoped,
      ),
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
