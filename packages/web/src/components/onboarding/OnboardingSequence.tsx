import React, { useEffect } from 'react'
import { useOnboarding } from './useOnboarding.js'
import { FogOfWarOverlay } from './FogOfWarOverlay.js'
import { CampfireConversation } from './CampfireConversation.js'

const REVEAL_DURATION_MS = 1400

export const OnboardingSequence: React.FC = () => {
  const onboarding = useOnboarding()

  useEffect(() => {
    if (!onboarding.isReady || onboarding.phase !== 'reveal') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void onboarding.completeReveal()
    }, REVEAL_DURATION_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [onboarding.completeReveal, onboarding.isReady, onboarding.phase])

  if (!onboarding.isActive) {
    return null
  }

  const showFog = onboarding.uiPolicy.showFogOverlay && !onboarding.isFogDismissed

  return (
    <>
      <FogOfWarOverlay
        isVisible={showFog}
        isRevealing={onboarding.phase === 'reveal'}
        dismissible={onboarding.phase === 'campfire'}
        onDismiss={onboarding.dismissFogOverlay}
      />

      {onboarding.phase === 'campfire' && (
        <CampfireConversation onKeepExploring={onboarding.dismissFogOverlay} />
      )}

      {onboarding.phase === 'reveal' && (
        <div
          className='pointer-events-none absolute inset-x-0 top-6 z-[22] flex justify-center px-4'
          data-testid='onboarding-reveal-panel'
        >
          <div className='rounded-full border border-[#d8cab3] bg-[#fff8ec]/92 px-5 py-2 text-sm font-semibold text-[#5f4a36] shadow-[0_12px_30px_rgba(0,0,0,0.2)]'>
            The fog lifts. Sanctuary, workshop, and your first project come into view.
          </div>
        </div>
      )}

      {onboarding.phase === 'first_project' && (
        <div
          className='pointer-events-none absolute inset-x-0 top-6 z-[22] flex justify-center px-4'
          data-testid='onboarding-first-project-banner'
        >
          <div className='pointer-events-auto rounded-xl border border-[#d8cab3] bg-[#fff8ec]/94 px-4 py-3 text-sm text-[#5f4a36] shadow-[0_14px_26px_rgba(0,0,0,0.2)]'>
            <p className='font-semibold'>First Project</p>
            <p className='mt-1'>
              Click your project building to open tasks. Marvin is ready to help.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
