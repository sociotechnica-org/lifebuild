import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/test-utils.js'
import { HexTile } from './HexTile.js'

vi.mock('@react-three/drei', () => ({
  Text: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Html: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./ProjectSprite.js', () => ({
  ProjectSprite: () => <span data-testid='project-sprite'>sprite</span>,
}))

describe('HexTile click behavior', () => {
  it('renders a project sprite for the placed tile', () => {
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

      expect(screen.getByTestId('project-sprite')).toBeInTheDocument()
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('shows the project name on hover', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const projectName = 'Focus Sprint'

    try {
      const { container } = render(
        <HexTile
          coord={{ q: 0, r: 0, s: 0 }}
          projectName={projectName}
          categoryColor='#9d9d9d'
          onClick={vi.fn()}
        />
      )

      expect(screen.getAllByText(projectName)).toHaveLength(1)

      const clickableRoot = container.querySelector('group') ?? container.querySelector('mesh')
      expect(clickableRoot).not.toBeNull()
      fireEvent.pointerOver(clickableRoot as Element)

      expect(screen.getAllByText(projectName)).toHaveLength(2)
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('allows completed tiles to invoke onClick', () => {
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
      expect(onClick).toHaveBeenCalledTimes(1)
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })
})
