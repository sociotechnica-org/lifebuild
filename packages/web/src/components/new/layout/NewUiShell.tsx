import React from 'react'
import '../new-ui.css'

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
    <div className='new-ui-container'>
      <main className='new-ui-main'>{children}</main>
    </div>
  )
}
