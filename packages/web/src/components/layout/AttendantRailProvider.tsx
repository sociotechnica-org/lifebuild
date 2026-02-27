import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  JARVIS_ATTENDANT_ROOM,
  MARVIN_ATTENDANT_ROOM,
  type StaticRoomDefinition,
} from '@lifebuild/shared/rooms'
import { matchPath, useLocation } from 'react-router-dom'
import { ROUTES } from '../../constants/routes.js'
import { useRoomChat } from '../../hooks/useRoomChat.js'

export const ATTENDANT_IDS = ['jarvis', 'marvin'] as const
export type AttendantId = (typeof ATTENDANT_IDS)[number]

type AttendantChatState = ReturnType<typeof useRoomChat>

type AttendantRecord = {
  id: AttendantId
  label: string
  shortLabel: string
  room: StaticRoomDefinition
  chat: AttendantChatState
}

type AttendantRailContextValue = {
  activeAttendantId: AttendantId | null
  attendants: Record<AttendantId, AttendantRecord>
  closeAttendant: () => void
  openAttendant: (id: AttendantId) => void
  toggleAttendant: (id: AttendantId) => void
}

const AttendantRailContext = createContext<AttendantRailContextValue | null>(null)

export const getRouteAutoSelectedAttendant = (pathname: string): AttendantId | null => {
  if (Boolean(matchPath(ROUTES.SANCTUARY, pathname))) {
    return 'jarvis'
  }

  if (Boolean(matchPath(ROUTES.PROJECT, pathname))) {
    return 'marvin'
  }

  return null
}

export const AttendantRailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const [activeAttendantId, setActiveAttendantId] = useState<AttendantId | null>(null)

  const jarvisChat = useRoomChat(JARVIS_ATTENDANT_ROOM)
  const marvinChat = useRoomChat(MARVIN_ATTENDANT_ROOM)

  useEffect(() => {
    const autoSelectedAttendant = getRouteAutoSelectedAttendant(location.pathname)
    if (!autoSelectedAttendant) return
    setActiveAttendantId(autoSelectedAttendant)
  }, [location.pathname])

  const openAttendant = useCallback((id: AttendantId) => {
    setActiveAttendantId(id)
  }, [])

  const closeAttendant = useCallback(() => {
    setActiveAttendantId(null)
  }, [])

  const toggleAttendant = useCallback((id: AttendantId) => {
    setActiveAttendantId(current => (current === id ? null : id))
  }, [])

  const attendants = useMemo<Record<AttendantId, AttendantRecord>>(
    () => ({
      jarvis: {
        id: 'jarvis',
        label: 'Jarvis',
        shortLabel: 'J',
        room: JARVIS_ATTENDANT_ROOM,
        chat: jarvisChat,
      },
      marvin: {
        id: 'marvin',
        label: 'Marvin',
        shortLabel: 'M',
        room: MARVIN_ATTENDANT_ROOM,
        chat: marvinChat,
      },
    }),
    [jarvisChat, marvinChat]
  )

  const value = useMemo<AttendantRailContextValue>(
    () => ({
      activeAttendantId,
      attendants,
      closeAttendant,
      openAttendant,
      toggleAttendant,
    }),
    [activeAttendantId, attendants, closeAttendant, openAttendant, toggleAttendant]
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
