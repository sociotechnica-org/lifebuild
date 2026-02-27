import React from 'react'

export const WorkshopOverlayContent: React.FC = () => {
  return (
    <div className='mx-auto w-full max-w-3xl px-1 py-2'>
      <h1 className='text-2xl font-semibold text-[#2f2b27]'>Workshop</h1>

      <div className='mt-6 rounded-2xl border border-[#d8cab3] bg-[#f0e2c9] p-5 shadow-[0_14px_28px_rgba(68,46,26,0.14)]'>
        <div
          className='rounded-xl border-2 border-dashed border-[#9d6b3f] bg-[#fff7eb] p-6 text-center'
          data-testid='workshop-coming-soon-sign'
        >
          <p className='text-xs font-semibold tracking-[0.24em] text-[#875a33]'>COMING SOON</p>
          <p className='mt-3 text-xl font-semibold text-[#3f3024]'>
            Drafting in the Workshop is under construction.
          </p>
          <p className='mt-3 text-sm leading-relaxed text-[#5f4a36]'>
            Marvin is ready in the Attendant Rail while we finish the full Workshop flow.
          </p>
        </div>
      </div>
    </div>
  )
}
