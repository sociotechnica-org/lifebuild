import React, { useMemo } from 'react'
import { useLiveStoreConnection } from '../../../hooks/useLiveStoreConnection.js'
import { Tooltip } from '../../ui/Tooltip/Tooltip.js'

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

  const { label, detail, dotClass, tooltipText } = useMemo(() => {
    const lastConnectedText = formatLastConnected(lastConnectedAt)

    if (!networkStatus) {
      return {
        label: 'Checking…',
        detail: 'Waiting for connection status',
        dotClass: 'bg-[#d7d2cb]',
        tooltipText: 'Waiting for connection status',
      }
    }

    if (!networkStatus.isConnected) {
      return {
        label: 'Offline',
        detail: lastConnectedText,
        dotClass: 'bg-[#c44b4b]',
        tooltipText: `Offline · ${lastConnectedText}`,
      }
    }

    if (syncStatus && !syncStatus.isSynced) {
      return {
        label: `Syncing (${syncStatus.pendingCount})`,
        detail: lastConnectedText,
        dotClass: 'bg-[#d9a441]',
        tooltipText: `Syncing (${syncStatus.pendingCount}) · ${lastConnectedText}`,
      }
    }

    return {
      label: 'Connected',
      detail: lastConnectedText,
      dotClass: 'bg-[#3a8f5c]',
      tooltipText: lastConnectedText,
    }
  }, [networkStatus, syncStatus, lastConnectedAt])

  return (
    <Tooltip content={tooltipText} position='bottom'>
      <span
        className={`h-2.5 w-2.5 rounded-full ${dotClass} inline-flex`}
        aria-label={`${label}. ${detail}`}
        role='status'
      />
    </Tooltip>
  )
}
