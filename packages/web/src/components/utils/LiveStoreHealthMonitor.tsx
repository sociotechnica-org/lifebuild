import React, { useEffect, useRef } from 'react'
import type { SyncPayload } from '@lifebuild/shared/auth'
import { useLiveStoreConnection } from '../../hooks/useLiveStoreConnection.js'

const OFFLINE_RESTART_THRESHOLD_MS = 30_000
const SYNC_STALE_THRESHOLD_MS = 60_000
const RESTART_COOLDOWN_MS = 60_000

interface LiveStoreHealthMonitorProps {
  syncPayload: SyncPayload
  onRestart: (reason: string) => void
}

export const LiveStoreHealthMonitor: React.FC<LiveStoreHealthMonitorProps> = ({
  syncPayload,
  onRestart,
}) => {
  const { networkStatus, syncStatus, lastSyncUpdateAt } = useLiveStoreConnection()
  const lastRestartAtRef = useRef(0)

  const canRestart = () => Date.now() - lastRestartAtRef.current > RESTART_COOLDOWN_MS

  useEffect(() => {
    if (!networkStatus) return
    if (syncPayload.authError) return
    if (networkStatus.devtools?.latchClosed) return
    if (networkStatus.isConnected) return
    if (!canRestart()) return

    const offlineDuration = Date.now() - networkStatus.timestampMs
    if (offlineDuration >= OFFLINE_RESTART_THRESHOLD_MS) {
      lastRestartAtRef.current = Date.now()
      onRestart(`offline for ${Math.round(offlineDuration / 1000)}s`)
    }
  }, [networkStatus, syncPayload.authError, onRestart])

  useEffect(() => {
    if (!syncStatus) return
    if (syncStatus.pendingCount === 0) return
    if (!lastSyncUpdateAt) return
    if (syncPayload.authError) return
    if (networkStatus?.devtools?.latchClosed) return
    if (networkStatus?.isConnected === false) return
    if (!canRestart()) return

    const staleDuration = Date.now() - lastSyncUpdateAt.getTime()
    if (staleDuration >= SYNC_STALE_THRESHOLD_MS) {
      lastRestartAtRef.current = Date.now()
      onRestart(`sync stalled for ${Math.round(staleDuration / 1000)}s`)
    }
  }, [syncStatus, lastSyncUpdateAt, networkStatus, syncPayload.authError, onRestart])

  return null
}
