import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/test-utils.js'
import type { PanelProjectItem } from './UnplacedPanel.js'
import { HexMap } from './HexMap.js'

const FIRST_PLACEMENT_PROMPT_KEY = 'life-map-placement-first-run-dismissed-v1'
const clearPlacementMock = vi.fn()
const clearPlacedProjectSelectionMock = vi.fn()
const startPlacementMock = vi.fn()
let mockPlacementSource: 'panel' | 'workshop' | null = null
let mockIsPlacing = false

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
  usePlacement: () => ({
    placementProjectId: null,
    placementSource: mockPlacementSource,
    selectedPlacedProjectId: null,
    isSelectingPlacedProject: false,
    isPlacing: mockIsPlacing,
    startPlacement: startPlacementMock,
    clearPlacement: clearPlacementMock,
    startSelectingPlacedProject: vi.fn(),
    selectPlacedProject: vi.fn(),
    clearPlacedProjectSelection: clearPlacedProjectSelectionMock,
    clearAll: vi.fn(),
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
    clearPlacementMock.mockClear()
    clearPlacedProjectSelectionMock.mockClear()
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

describe('HexMap escape handling', () => {
  beforeEach(() => {
    clearPlacementMock.mockClear()
    clearPlacedProjectSelectionMock.mockClear()
    startPlacementMock.mockClear()
    mockPlacementSource = null
    mockIsPlacing = false
  })

  it('clears placement state on Escape when no overlay is open', () => {
    render(<HexMap />)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(clearPlacementMock).toHaveBeenCalledTimes(1)
    expect(clearPlacedProjectSelectionMock).toHaveBeenCalledTimes(1)
  })

  it('does not clear placement state on Escape while overlay is open', () => {
    render(<HexMap isOverlayOpen />)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(clearPlacementMock).not.toHaveBeenCalled()
    expect(clearPlacedProjectSelectionMock).not.toHaveBeenCalled()
  })

  it('does not clear placement state on arrow keys', () => {
    render(<HexMap />)

    fireEvent.keyDown(window, { key: 'ArrowUp' })

    expect(clearPlacementMock).not.toHaveBeenCalled()
    expect(clearPlacedProjectSelectionMock).not.toHaveBeenCalled()
  })

  it('returns to workshop on Escape for workshop-initiated placement sessions', () => {
    const onOpenWorkshop = vi.fn()
    mockPlacementSource = 'workshop'
    mockIsPlacing = true

    render(<HexMap onOpenWorkshop={onOpenWorkshop} />)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(clearPlacementMock).toHaveBeenCalledTimes(1)
    expect(clearPlacedProjectSelectionMock).toHaveBeenCalledTimes(1)
    expect(onOpenWorkshop).toHaveBeenCalledTimes(1)
  })

  it('does not open workshop on Escape for panel placement sessions', () => {
    const onOpenWorkshop = vi.fn()
    mockPlacementSource = 'panel'
    mockIsPlacing = true

    render(<HexMap onOpenWorkshop={onOpenWorkshop} />)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(clearPlacementMock).toHaveBeenCalledTimes(1)
    expect(clearPlacedProjectSelectionMock).toHaveBeenCalledTimes(1)
    expect(onOpenWorkshop).not.toHaveBeenCalled()
  })
})
