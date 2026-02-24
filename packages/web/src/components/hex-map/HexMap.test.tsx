import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/test-utils.js'
import type { PanelProjectItem } from './UnplacedPanel.js'
import { HexMap } from './HexMap.js'

const FIRST_PLACEMENT_PROMPT_KEY = 'life-map-placement-first-run-dismissed-v1'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='canvas-mock'>{children}</div>
  ),
}))

vi.mock('./CameraRig.js', () => ({
  CameraRig: () => null,
}))

vi.mock('./HexGrid.js', () => ({
  HexGrid: () => null,
}))

vi.mock('./UnplacedPanel.js', () => ({
  UnplacedPanel: () => null,
}))

vi.mock('./PlacementContext.js', () => ({
  PlacementProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePlacement: () => ({
    placementProjectId: null,
    selectedPlacedProjectId: null,
    isSelectingPlacedProject: false,
    isPlacing: false,
    startPlacement: vi.fn(),
    clearPlacement: vi.fn(),
    startSelectingPlacedProject: vi.fn(),
    selectPlacedProject: vi.fn(),
    clearPlacedProjectSelection: vi.fn(),
  }),
}))

const unplacedProject: PanelProjectItem = {
  id: 'project-1',
  name: 'Project Alpha',
  category: null,
}

describe('HexMap first placement prompt', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    window.localStorage.removeItem(FIRST_PLACEMENT_PROMPT_KEY)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('shows the prompt when unplaced projects appear after initial empty state', () => {
    const { rerender } = render(<HexMap unplacedProjects={[]} />)

    expect(screen.queryByText('Your projects are ready to place')).toBeNull()

    rerender(<HexMap unplacedProjects={[unplacedProject]} />)

    expect(screen.getByText('Your projects are ready to place')).toBeInTheDocument()
  })

  it('does not show the prompt when it has already been dismissed', () => {
    window.localStorage.setItem(FIRST_PLACEMENT_PROMPT_KEY, '1')

    render(<HexMap unplacedProjects={[unplacedProject]} />)

    expect(screen.queryByText('Your projects are ready to place')).toBeNull()
  })

  it('shows the prompt when localStorage reads throw', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Blocked storage access')
    })

    try {
      render(<HexMap unplacedProjects={[unplacedProject]} />)
      expect(screen.getByText('Your projects are ready to place')).toBeInTheDocument()
    } finally {
      getItemSpy.mockRestore()
    }
  })

  it('dismisses the prompt even when localStorage writes throw', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Blocked storage access')
    })

    try {
      render(<HexMap unplacedProjects={[unplacedProject]} />)
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
      expect(screen.queryByText('Your projects are ready to place')).toBeNull()
    } finally {
      setItemSpy.mockRestore()
    }
  })
})
