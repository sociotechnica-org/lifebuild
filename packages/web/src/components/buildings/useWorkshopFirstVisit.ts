import React from 'react'
import { SETTINGS_KEYS } from '@lifebuild/shared'
import { getSettingByKey$ } from '@lifebuild/shared/queries'
import { MARVIN_ATTENDANT_ROOM } from '@lifebuild/shared/rooms'
import { events } from '@lifebuild/shared/schema'
import { useQuery, useStore } from '../../livestore-compat.js'
import { useRoomChat } from '../../hooks/useRoomChat.js'
import { useAttendantRail } from '../layout/AttendantRailProvider.js'
import { WORKSHOP_FIRST_VISIT_BOOTSTRAP_MESSAGE } from '../room-chat/internalMessages.js'

export const useWorkshopFirstVisit = () => {
  const { store } = useStore()
  const { openAttendant } = useAttendantRail()
  const { sendDirectMessage } = useRoomChat(MARVIN_ATTENDANT_ROOM)
  const workshopCompletionSetting = useQuery(
    getSettingByKey$(SETTINGS_KEYS.JOURNEY_WORKSHOP_UNBURDENING_COMPLETED_AT)
  )

  const [showFirstVisitGreeting, setShowFirstVisitGreeting] = React.useState(false)
  const resolvedFirstVisitRef = React.useRef(false)
  const bootstrapSentRef = React.useRef(false)

  React.useEffect(() => {
    if (resolvedFirstVisitRef.current) return
    if (workshopCompletionSetting === undefined) return

    resolvedFirstVisitRef.current = true
    const completionValue = workshopCompletionSetting[0]?.value?.trim()
    if (!completionValue) {
      setShowFirstVisitGreeting(true)
    }
  }, [workshopCompletionSetting])

  React.useEffect(() => {
    if (!showFirstVisitGreeting) return
    openAttendant('marvin')
  }, [openAttendant, showFirstVisitGreeting])

  React.useEffect(() => {
    if (!showFirstVisitGreeting) return
    if (bootstrapSentRef.current) return

    const wasBootstrapSent = sendDirectMessage(WORKSHOP_FIRST_VISIT_BOOTSTRAP_MESSAGE)
    if (!wasBootstrapSent) return

    bootstrapSentRef.current = true
    const now = new Date()

    store.commit(
      events.settingUpdated({
        key: SETTINGS_KEYS.JOURNEY_WORKSHOP_UNBURDENING_COMPLETED_AT,
        value: now.toISOString(),
        updatedAt: now,
      })
    )
  }, [sendDirectMessage, showFirstVisitGreeting, store])

  return {
    showFirstVisitGreeting,
  }
}
