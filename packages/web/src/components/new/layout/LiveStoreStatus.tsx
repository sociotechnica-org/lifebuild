import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveStoreConnection } from '../../../hooks/useLiveStoreConnection.js'
import { ConfirmModal } from '../../ui/ConfirmModal/index.js'
import { useLiveStoreRepairContext } from '../../../contexts/LiveStoreRepairContext.js'

const STATUS_STALE_THRESHOLD_MS = 60_000
const TOOLTIP_HIDE_DELAY_MS = 120

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
  const { networkStatus, syncStatus, lastConnectedAt, lastSyncUpdateAt } = useLiveStoreConnection()
  const { requestRepair, repairSuggestion, clearRepairSuggestion, repairState } =
    useLiveStoreRepairContext()
  const [now, setNow] = useState(() => Date.now())
  const [isOpen, setIsOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  const showTooltip = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setIsOpen(true)
  }

  const hideTooltip = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
    hideTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, TOOLTIP_HIDE_DELAY_MS)
  }

  const { label, detail, dotClass, tooltipText } = useMemo(() => {
    const lastConnectedText = formatLastConnected(lastConnectedAt)
    const lastNetworkAt = networkStatus?.timestampMs ?? null
    const lastSyncAt = lastSyncUpdateAt?.getTime() ?? null
    const lastActivityAt = Math.max(lastNetworkAt ?? 0, lastSyncAt ?? 0)
    const isStale = lastActivityAt > 0 && now - lastActivityAt >= STATUS_STALE_THRESHOLD_MS

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

    if (isStale) {
      return {
        label: 'Reconnecting',
        detail: lastConnectedText,
        dotClass: 'bg-[#d9a441]',
        tooltipText: `Reconnecting · ${lastConnectedText}`,
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
  }, [networkStatus, syncStatus, lastConnectedAt, lastSyncUpdateAt, now])

  const extraInfo = tooltipText === detail ? null : tooltipText

  return (
    <div className='relative inline-flex' onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      <button
        type='button'
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={`h-2.5 w-2.5 rounded-full ${dotClass} inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400`}
        aria-label={`${label}. ${detail}`}
      />
      {isOpen ? (
        <div
          className='absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-72 rounded-lg border border-[#3b3530] bg-[#2f2b27] text-[#f7f1e7] p-3 text-xs shadow-lg'
          role='tooltip'
        >
          <div className='flex items-center justify-between gap-3'>
            <div className='font-semibold'>{label}</div>
            <div className='text-[11px] opacity-75'>{detail}</div>
          </div>
          {extraInfo ? <div className='mt-1 text-[11px] opacity-70'>{extraInfo}</div> : null}
          {repairSuggestion ? (
            <div className='mt-3 rounded-md border border-amber-400/40 bg-amber-400/10 p-2 text-[11px] text-amber-100'>
              <div className='font-semibold'>Repair suggested</div>
              <div className='opacity-90'>{repairSuggestion.reason}</div>
            </div>
          ) : null}
          {repairState?.status === 'attempted' && repairState.attemptedAt ? (
            <div className='mt-3 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-2 text-[11px] text-emerald-100'>
              <div className='font-semibold'>Recent repair</div>
              <div className='opacity-90'>
                Ran at {new Date(repairState.attemptedAt).toLocaleTimeString()}
              </div>
            </div>
          ) : null}
          <div className='mt-3 flex flex-col gap-2'>
            <button
              type='button'
              onClick={() => setIsConfirmOpen(true)}
              className='w-full rounded-md border border-amber-400/50 bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-500/30'
            >
              Repair local data
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title='Repair local data'
        message='This will clear the local LiveStore data on this device and re-sync from the server. Server data will not be affected.'
        confirmText='Repair'
        destructive
        onConfirm={() => {
          clearRepairSuggestion()
          requestRepair('Manual repair requested', 'status-dot')
          setIsConfirmOpen(false)
        }}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  )
}
