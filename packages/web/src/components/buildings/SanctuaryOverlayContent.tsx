import { getSettingByKey$ } from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import React from 'react'
import { useQuery, useStore } from '../../livestore-compat.js'
import {
  SANCTUARY_FIRST_VISIT_BOOTSTRAP_MESSAGE,
  SANCTUARY_FIRST_VISIT_SETTING_KEY,
} from '../../constants/sanctuary.js'
import { useAttendantRail } from '../layout/AttendantRailProvider.js'

type SanctuaryVisitState = 'loading' | 'first' | 'returning'

export const SanctuaryOverlayContent: React.FC = () => {
  const { store } = useStore()
  const { openAttendant, queueAttendantMessage } = useAttendantRail()
  const settingQuery = React.useMemo(() => getSettingByKey$(SANCTUARY_FIRST_VISIT_SETTING_KEY), [])
  const firstVisitSetting = useQuery(settingQuery)
  const [visitState, setVisitState] = React.useState<SanctuaryVisitState>('loading')
  const visitStateInitializedRef = React.useRef(false)
  const firstVisitHandledRef = React.useRef(false)

  React.useEffect(() => {
    if (visitStateInitializedRef.current || firstVisitSetting === undefined) return
    visitStateInitializedRef.current = true
    setVisitState(firstVisitSetting.length === 0 ? 'first' : 'returning')
  }, [firstVisitSetting])

  React.useEffect(() => {
    if (visitState !== 'first' || firstVisitHandledRef.current) return
    firstVisitHandledRef.current = true

    openAttendant('jarvis')
    queueAttendantMessage('jarvis', SANCTUARY_FIRST_VISIT_BOOTSTRAP_MESSAGE)

    store.commit(
      events.settingUpdated({
        key: SANCTUARY_FIRST_VISIT_SETTING_KEY,
        value: new Date().toISOString(),
        updatedAt: new Date(),
      })
    )
  }, [openAttendant, queueAttendantMessage, store, visitState])

  return (
    <div className='mx-auto w-full max-w-3xl px-1 py-2'>
      <h1 className='text-2xl font-semibold text-[#2f2b27]'>Sanctuary</h1>

      {visitState === 'loading' && (
        <div className='mt-6 rounded-2xl border border-[#d8cab3] bg-[#efe2cd] p-5 shadow-[0_14px_28px_rgba(68,46,26,0.14)]'>
          <div className='rounded-xl border border-[#d8cab3] bg-[#fff8ec] p-6 text-center'>
            <p className='text-sm leading-relaxed text-[#5f4a36]'>Preparing Sanctuary...</p>
          </div>
        </div>
      )}

      {visitState === 'first' && (
        <div className='mt-6 rounded-2xl border border-[#d8cab3] bg-[#efe2cd] p-5 shadow-[0_14px_28px_rgba(68,46,26,0.14)]'>
          <div
            className='rounded-xl border border-[#d8cab3] bg-[#fff8ec] p-6'
            data-testid='sanctuary-first-visit-welcome'
          >
            <p className='text-xs font-semibold tracking-[0.24em] text-[#875a33]'>
              WELCOME TO YOUR SANCTUARY
            </p>
            <p className='mt-3 text-xl font-semibold text-[#3f3024]'>
              Jarvis is here to guide your Visioning.
            </p>
            <p className='mt-3 text-sm leading-relaxed text-[#5f4a36]'>
              The Jarvis panel opens automatically for this first Sanctuary visit so you can name
              what matters most and start shaping your charter.
            </p>
          </div>
        </div>
      )}

      {visitState === 'returning' && (
        <div className='mt-6 rounded-2xl border border-[#d8cab3] bg-[#efe2cd] p-5 shadow-[0_14px_28px_rgba(68,46,26,0.14)]'>
          <div
            className='rounded-xl border-2 border-dashed border-[#7c5a3b] bg-[#fff8ec] p-6 text-center'
            data-testid='sanctuary-charter-placeholder'
          >
            <p className='text-xs font-semibold tracking-[0.24em] text-[#875a33]'>
              CHARTER EXPERIENCE
            </p>
            <p className='mt-3 text-xl font-semibold text-[#3f3024]'>
              Visioning in the Sanctuary is coming soon.
            </p>
            <p className='mt-3 text-sm leading-relaxed text-[#5f4a36]'>
              Jarvis is ready in the Attendant Rail while we build the guided charter space for the
              Builder.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
