import React, { useEffect, useMemo, useState } from 'react'
import { useOnboarding } from './useOnboarding.js'
import { FogOfWarOverlay } from './FogOfWarOverlay.js'

const REVEAL_DURATION_MS = 1400

export const OnboardingSequence: React.FC = () => {
  const onboarding = useOnboarding()

  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (onboarding.phase !== 'campfire') {
      setSubmitError(null)
      setIsSubmitting(false)
    }
  }, [onboarding.phase])

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

  const trimmedName = useMemo(() => projectName.trim(), [projectName])
  const trimmedDescription = useMemo(() => projectDescription.trim(), [projectDescription])

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!trimmedName || !trimmedDescription) {
      setSubmitError('Give your first project both a name and a short description.')
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const projectId = await onboarding.createFirstProject({
        name: trimmedName,
        description: trimmedDescription,
      })

      if (!projectId) {
        setSubmitError('Unable to start onboarding right now. Please try again.')
      }
    } catch {
      setSubmitError('Unable to start onboarding right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
        <section
          className='pointer-events-none absolute inset-x-0 bottom-6 z-[22] flex justify-center px-4'
          data-testid='onboarding-campfire-panel'
        >
          <form
            onSubmit={handleCreateProject}
            className='pointer-events-auto w-full max-w-xl rounded-2xl border border-[#d6c3ab] bg-[#fff8ec]/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm'
          >
            <p className='text-xs font-semibold uppercase tracking-wide text-[#7f6952]'>Campfire</p>
            <h2 className='mt-1 text-lg font-semibold text-[#2f2b27]'>
              Jarvis: What should we build first?
            </h2>
            <p className='mt-1 text-sm text-[#6a5744]'>
              Placeholder prompt: name one project and a short description. We can refine it with
              Marvin next.
            </p>

            <label className='mt-4 block text-xs font-semibold uppercase tracking-wide text-[#7f6952]'>
              Project name
            </label>
            <input
              data-testid='onboarding-project-name'
              value={projectName}
              onChange={event => setProjectName(event.target.value)}
              className='mt-1 w-full rounded-lg border border-[#d8cab3] bg-white px-3 py-2 text-sm text-[#2f2b27] outline-none transition-colors focus:border-[#9b7959]'
              placeholder='e.g. Rebuild my morning routine'
            />

            <label className='mt-3 block text-xs font-semibold uppercase tracking-wide text-[#7f6952]'>
              Description
            </label>
            <textarea
              data-testid='onboarding-project-description'
              value={projectDescription}
              onChange={event => setProjectDescription(event.target.value)}
              className='mt-1 h-24 w-full resize-none rounded-lg border border-[#d8cab3] bg-white px-3 py-2 text-sm text-[#2f2b27] outline-none transition-colors focus:border-[#9b7959]'
              placeholder='What outcome would make this week feel better?'
            />

            {submitError && (
              <p
                className='mt-2 text-xs font-medium text-[#a3482f]'
                data-testid='onboarding-submit-error'
              >
                {submitError}
              </p>
            )}

            <div className='mt-4 flex items-center justify-between gap-3'>
              <button
                type='button'
                className='rounded-md border border-[#d8cab3] bg-[#fff8ec] px-3 py-2 text-xs font-semibold text-[#5f4a36] transition-colors hover:bg-white'
                onClick={onboarding.dismissFogOverlay}
              >
                Keep exploring for now
              </button>
              <button
                type='submit'
                disabled={isSubmitting}
                data-testid='onboarding-create-project'
                className='rounded-md border border-[#7d5f44] bg-[#7d5f44] px-4 py-2 text-sm font-semibold text-[#fff8ec] transition-colors hover:bg-[#6b513a] disabled:cursor-not-allowed disabled:opacity-70'
              >
                {isSubmitting ? 'Starting...' : 'Start first project'}
              </button>
            </div>
          </form>
        </section>
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
