import React, { useMemo } from 'react'
import { useLiveStoreConnection } from '../../../hooks/useLiveStoreConnection.js'

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const formatLastConnected = (lastConnectedAt: Date | null) => {
  if (!lastConnectedAt) {
    return 'Last connected: never'
  }

  const now = new Date()
  if (isSameDay(now, lastConnectedAt)) {
    return `Last connected ${formatTime(lastConnectedAt)}`
  }

  return `Last connected ${lastConnectedAt.toLocaleDateString()} ${formatTime(lastConnectedAt)}`
}

export const LiveStoreStatus: React.FC = () => {
  const { networkStatus, syncStatus, lastConnectedAt } = useLiveStoreConnection()

  const { label, detail, dotClass } = useMemo(() => {
    if (!networkStatus) {
      return {
        label: 'Checking…',
        detail: 'Waiting for connection status',
        dotClass: 'bg-[#d7d2cb]',
      }
    }

    if (!networkStatus.isConnected) {
      return {
        label: 'Offline',
        detail: formatLastConnected(lastConnectedAt),
        dotClass: 'bg-[#c44b4b]',
      }
    }

    if (syncStatus && !syncStatus.isSynced) {
      return {
        label: `Syncing (${syncStatus.pendingCount})`,
        detail: formatLastConnected(lastConnectedAt),
        dotClass: 'bg-[#d9a441]',
      }
    }

    return {
      label: 'Connected',
      detail: formatLastConnected(lastConnectedAt),
      dotClass: 'bg-[#3a8f5c]',
    }
  }, [networkStatus, syncStatus, lastConnectedAt])

  return (
    <div className='flex items-center gap-2 text-xs text-[#8b8680]'>
      <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden='true' />
      <span className='font-medium text-[#2f2b27]'>{label}</span>
      <span className='text-[#8b8680]'>{detail}</span>
    </div>
  )
}
