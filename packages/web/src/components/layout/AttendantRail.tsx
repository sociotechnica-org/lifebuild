import React from 'react'
import { ATTENDANT_IDS, type AttendantId } from './AttendantRailProvider.js'

type NotificationMap = Partial<Record<AttendantId, boolean>>

type AttendantRailProps = {
  activeAttendantId: AttendantId | null
  notifications?: NotificationMap
  onAttendantClick: (id: AttendantId) => void
}

const ATTENDANT_META: Record<AttendantId, { label: string; shortLabel: string }> = {
  jarvis: { label: 'Jarvis', shortLabel: 'J' },
  marvin: { label: 'Marvin', shortLabel: 'M' },
}

export const AttendantRail: React.FC<AttendantRailProps> = ({
  activeAttendantId,
  notifications,
  onAttendantClick,
}) => {
  return (
    <aside
      className='fixed left-2 top-1/2 z-[120] -translate-y-1/2'
      aria-label='Attendant rail'
      data-testid='attendant-rail'
    >
      <div className='flex flex-col items-center gap-3 rounded-2xl border border-[#d8cab3] bg-[#fff8ec]/95 p-2 shadow-[0_14px_30px_rgba(0,0,0,0.14)] backdrop-blur'>
        {ATTENDANT_IDS.map(id => {
          const attendant = ATTENDANT_META[id]
          const isActive = activeAttendantId === id
          const hasNotification = Boolean(notifications?.[id])

          return (
            <button
              key={id}
              type='button'
              onClick={() => onAttendantClick(id)}
              aria-label={`${isActive ? 'Close' : 'Open'} ${attendant.label} chat`}
              aria-pressed={isActive}
              data-testid={`attendant-rail-avatar-${id}`}
              className={`relative flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'border-[#5f4a36] bg-[#5f4a36] text-[#fff8ec]'
                  : 'border-[#c7b49a] bg-[#f5f3f0] text-[#5f4a36] hover:border-[#b39777] hover:bg-[#fffaf3]'
              }`}
              title={attendant.label}
            >
              {attendant.shortLabel}
              {hasNotification && (
                <span
                  className='absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-[#d46a4f] ring-2 ring-[#fff8ec]'
                  data-testid={`attendant-rail-notification-${id}`}
                />
              )}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
