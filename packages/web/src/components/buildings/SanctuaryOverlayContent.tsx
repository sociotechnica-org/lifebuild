import React from 'react'

export const SanctuaryOverlayContent: React.FC = () => {
  return (
    <div className='mx-auto w-full max-w-3xl px-1 py-2'>
      <h1 className='text-2xl font-semibold text-[#2f2b27]'>Sanctuary</h1>

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
    </div>
  )
}
