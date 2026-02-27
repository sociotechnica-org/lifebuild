import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  JARVIS_ATTENDANT_ROOM,
  MARVIN_ATTENDANT_ROOM,
  type StaticRoomDefinition,
} from '@lifebuild/shared/rooms'
import { matchPath, useLocation } from 'react-router-dom'
import { ROUTES } from '../../constants/routes.js'
import { useOnboarding } from '../onboarding/useOnboarding.js'

export const ATTENDANT_IDS = ['jarvis', 'marvin'] as const
export type AttendantId = (typeof ATTENDANT_IDS)[number]

type AttendantRecord = {
  id: AttendantId
  label: string
  shortLabel: string
  room: StaticRoomDefinition
}

type AttendantRailContextValue = {
  activeAttendantId: AttendantId | null
  attendants: Record<AttendantId, AttendantRecord>
  queuedAttendantMessages: Partial<Record<AttendantId, string>>
  clearQueuedAttendantMessage: (id: AttendantId) => void
  closeAttendant: () => void
  openAttendant: (id: AttendantId) => void
  queueAttendantMessage: (id: AttendantId, message: string) => void
  toggleAttendant: (id: AttendantId) => void
}

const AttendantRailContext = createContext<AttendantRailContextValue | null>(null)

const ATTENDANT_RECORDS: Record<AttendantId, AttendantRecord> = {
  jarvis: {
    id: 'jarvis',
    label: 'Jarvis',
    shortLabel: 'J',
    room: JARVIS_ATTENDANT_ROOM,
  },
  marvin: {
    id: 'marvin',
    label: 'Marvin',
    shortLabel: 'M',
    room: MARVIN_ATTENDANT_ROOM,
  },
}

export const getRouteAutoSelectedAttendant = (pathname: string): AttendantId | null => {
  if (Boolean(matchPath(ROUTES.SANCTUARY, pathname))) {
    return 'jarvis'
  }

  if (Boolean(matchPath(ROUTES.WORKSHOP, pathname))) {
    return 'marvin'
  }

  if (Boolean(matchPath(ROUTES.PROJECT, pathname))) {
    return 'marvin'
  }

  return null
}

export const AttendantRailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const onboarding = useOnboarding()
  const [activeAttendantId, setActiveAttendantId] = useState<AttendantId | null>(null)
  const [queuedAttendantMessages, setQueuedAttendantMessages] = useState<
    Partial<Record<AttendantId, string>>
  >({})

  useEffect(() => {
    const autoSelectedAttendant = getRouteAutoSelectedAttendant(location.pathname)
    if (!autoSelectedAttendant) return
    setActiveAttendantId(autoSelectedAttendant)
  }, [location.pathname])

  useEffect(() => {
    if (!onboarding.shouldAutoOpenMarvin) {
      return
    }

    setActiveAttendantId('marvin')
    void onboarding.markMarvinAutoOpened()
  }, [onboarding.markMarvinAutoOpened, onboarding.shouldAutoOpenMarvin])

  const openAttendant = useCallback((id: AttendantId) => {
    setActiveAttendantId(id)
  }, [])

  const closeAttendant = useCallback(() => {
    setActiveAttendantId(null)
  }, [])

  const toggleAttendant = useCallback((id: AttendantId) => {
    setActiveAttendantId(current => (current === id ? null : id))
  }, [])

  const queueAttendantMessage = useCallback((id: AttendantId, message: string) => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    setQueuedAttendantMessages(current => ({
      ...current,
      [id]: trimmedMessage,
    }))
  }, [])

  const clearQueuedAttendantMessage = useCallback((id: AttendantId) => {
    setQueuedAttendantMessages(current => {
      if (!current[id]) return current

      const nextState = { ...current }
      delete nextState[id]
      return nextState
    })
  }, [])

  const attendants = useMemo<Record<AttendantId, AttendantRecord>>(() => ATTENDANT_RECORDS, [])

  const value = useMemo<AttendantRailContextValue>(
    () => ({
      activeAttendantId,
      attendants,
      queuedAttendantMessages,
      clearQueuedAttendantMessage,
      closeAttendant,
      openAttendant,
      queueAttendantMessage,
      toggleAttendant,
    }),
    [
      activeAttendantId,
      attendants,
      queuedAttendantMessages,
      clearQueuedAttendantMessage,
      closeAttendant,
      openAttendant,
      queueAttendantMessage,
      toggleAttendant,
    ]
  )

  return <AttendantRailContext.Provider value={value}>{children}</AttendantRailContext.Provider>
}

export const useAttendantRail = (): AttendantRailContextValue => {
  const context = useContext(AttendantRailContext)
  if (!context) {
    throw new Error('useAttendantRail must be used within an AttendantRailProvider')
  }
  return context
}
