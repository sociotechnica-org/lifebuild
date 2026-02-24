import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/test-utils.js'
import { HexTile } from './HexTile.js'

vi.mock('@react-three/drei', () => ({
  Text: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('HexTile click behavior', () => {
  it('renders initials for tile labels', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      render(
        <HexTile
          coord={{ q: 0, r: 0, s: 0 }}
          projectName='Focus Sprint'
          categoryColor='#9d9d9d'
          onClick={vi.fn()}
        />
      )

      expect(screen.getByText('FS')).toBeInTheDocument()
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('allows completed tiles to invoke onClick when allowCompletedClick is true', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onClick = vi.fn()

    try {
      const { container } = render(
        <HexTile
          coord={{ q: 0, r: 0, s: 0 }}
          projectName='Completed Project'
          categoryColor='#9d9d9d'
          isCompleted
          allowCompletedClick
          onClick={onClick}
        />
      )

      const clickableRoot = container.querySelector('group') ?? container.querySelector('mesh')
      expect(clickableRoot).not.toBeNull()

      fireEvent.click(clickableRoot as Element)
      expect(onClick).toHaveBeenCalledTimes(1)
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('keeps completed tiles non-interactive by default', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onClick = vi.fn()

    try {
      const { container } = render(
        <HexTile
          coord={{ q: 0, r: 0, s: 0 }}
          projectName='Completed Project'
          categoryColor='#9d9d9d'
          isCompleted
          onClick={onClick}
        />
      )

      const clickableRoot = container.querySelector('group') ?? container.querySelector('mesh')
      expect(clickableRoot).not.toBeNull()

      fireEvent.click(clickableRoot as Element)
      expect(onClick).not.toHaveBeenCalled()
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })
})
