import React from 'react'

type NewUiShellProps = {
  children: React.ReactNode
}

/**
 * Minimal shell for the next-generation UI surfaces.
 * Keeps legacy navigation/chat chrome out of new routes while providing
 * a consistent canvas and spacing baseline.
 */
export const NewUiShell: React.FC<NewUiShellProps> = ({ children }) => {
  return (
    <div className='min-h-screen bg-white text-gray-900'>
      <main className='mx-auto w-full max-w-5xl px-6 py-8 space-y-8'>{children}</main>
    </div>
  )
}
