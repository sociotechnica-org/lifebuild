import type { HexCoord } from '@lifebuild/shared/hex'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/test-utils.js'
import { HexGrid } from './HexGrid.js'

type MockHexCellProps = {
  coord: HexCoord
  visualStateOverride?: 'placeable' | 'blocked' | 'targeted'
  onClick?: () => void
  onHoverChange?: (isHovered: boolean) => void
}

type MockHexTileProps = {
  id?: string
  projectId?: string
  projectName: string
  isCompleted?: boolean
  allowCompletedClick?: boolean
  onClick?: () => void
}

const parseHexCoordFromTestId = (testId: string): HexCoord => {
  const [, coord] = testId.split('hex-cell-')
  if (!coord) {
    throw new Error(`Invalid hex cell test id: ${testId}`)
  }

  const parts = coord.split(',')
  if (parts.length !== 3) {
    throw new Error(`Invalid hex cell coordinate format: ${testId}`)
  }

  const [q, r, s] = parts.map(Number) as [number, number, number]
  if ([q, r, s].some(value => Number.isNaN(value))) {
    throw new Error(`Invalid hex cell coordinate value: ${testId}`)
  }

  return { q, r, s }
}

vi.mock('@react-three/drei', () => ({
  Html: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./HexTile.js', () => ({
  HexTile: (props: MockHexTileProps) => (
    <button
      data-testid={`hex-tile-${props.projectName}`}
      onClick={() => {
        if (props.isCompleted && !props.allowCompletedClick) {
          return
        }
        props.onClick?.()
      }}
      type='button'
    >
      tile
    </button>
  ),
}))

vi.mock('./HexCell.js', () => ({
  HexCell: (props: MockHexCellProps) => (
    <button
      data-testid={`hex-cell-${props.coord.q},${props.coord.r},${props.coord.s}`}
      data-state={props.visualStateOverride ?? 'default'}
      onClick={() => props.onClick?.()}
      onMouseEnter={() => props.onHoverChange?.(true)}
      onMouseLeave={() => props.onHoverChange?.(false)}
      type='button'
    >
      {props.visualStateOverride ?? 'default'}
    </button>
  ),
}))

vi.mock('./FixedBuilding.js', () => ({
  FixedBuilding: ({ type, onActivate }: { type: string; onActivate?: () => void }) =>
    onActivate ? (
      <button data-testid={`fixed-building-${type}`} onClick={onActivate} type='button'>
        {type}
      </button>
    ) : (
      <div data-testid={`fixed-building-${type}`}>{type}</div>
    ),
}))

describe('HexGrid placement behavior', () => {
  it('renders fixed buildings at reserved coordinates', () => {
    render(<HexGrid />)

    expect(screen.getByTestId('fixed-building-campfire')).toBeInTheDocument()
    expect(screen.getByTestId('fixed-building-sanctuary')).toBeInTheDocument()
    expect(screen.getByTestId('fixed-building-workshop')).toBeInTheDocument()
  })

  it('opens sanctuary and workshop overlays via fixed-building callbacks', () => {
    const onOpenSanctuary = vi.fn()
    const onOpenWorkshop = vi.fn()

    render(<HexGrid onOpenSanctuary={onOpenSanctuary} onOpenWorkshop={onOpenWorkshop} />)

    fireEvent.click(screen.getByTestId('fixed-building-sanctuary'))
    fireEvent.click(screen.getByTestId('fixed-building-workshop'))

    expect(onOpenSanctuary).toHaveBeenCalledTimes(1)
    expect(onOpenWorkshop).toHaveBeenCalledTimes(1)
  })

  it('keeps campfire non-interactive', () => {
    render(<HexGrid onOpenSanctuary={vi.fn()} onOpenWorkshop={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /campfire/i })).toBeNull()
    expect(screen.getByTestId('fixed-building-campfire')).toBeInTheDocument()
  })

  it('marks all reserved landmark cells as blocked in placement mode', () => {
    render(
      <HexGrid
        placementProject={{ id: 'project-1', name: 'Project Alpha' }}
        onPlaceProject={vi.fn()}
      />
    )

    expect(screen.getByTestId('hex-cell-0,0,0')).toHaveAttribute('data-state', 'blocked')
    expect(screen.getByTestId('hex-cell-0,-1,1')).toHaveAttribute('data-state', 'blocked')
    expect(screen.getByTestId('hex-cell-1,-1,0')).toHaveAttribute('data-state', 'blocked')
  })

  it('does not cancel placement mode when a blocked cell is clicked', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onCancelPlacement = vi.fn()
    const onPlaceProject = vi.fn()

    try {
      render(
        <HexGrid
          placementProject={{ id: 'project-1', name: 'Project Alpha' }}
          onPlaceProject={onPlaceProject}
          onCancelPlacement={onCancelPlacement}
        />
      )

      const blockedCell = screen
        .getAllByTestId(/hex-cell-/)
        .find(element => element.getAttribute('data-state') === 'blocked')

      expect(blockedCell).toBeDefined()

      fireEvent.click(blockedCell as HTMLElement)

      expect(onPlaceProject).not.toHaveBeenCalled()
      expect(onCancelPlacement).not.toHaveBeenCalled()
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('shows blocked state instead of targeted when a hovered cell becomes blocked', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      const { rerender } = render(
        <HexGrid
          placementProject={{ id: 'project-1', name: 'Project Alpha' }}
          onPlaceProject={vi.fn()}
        />
      )

      const placeableCell = screen
        .getAllByTestId(/hex-cell-/)
        .find(element => element.getAttribute('data-state') === 'placeable')

      expect(placeableCell).toBeDefined()
      fireEvent.mouseEnter(placeableCell as HTMLElement)
      expect(screen.getByText('Place: Project Alpha')).toBeInTheDocument()

      const hoveredCoord = parseHexCoordFromTestId(
        (placeableCell as HTMLElement).getAttribute('data-testid') ?? ''
      )

      rerender(
        <HexGrid
          placementProject={{ id: 'project-1', name: 'Project Alpha' }}
          onPlaceProject={vi.fn()}
          tiles={[
            {
              id: 'tile-1',
              projectId: 'project-occupied',
              coord: hoveredCoord,
              projectName: 'Occupied',
              categoryColor: '#c48b5a',
            },
          ]}
        />
      )

      const hoveredCellAfterBlock = screen.getByTestId(
        `hex-cell-${hoveredCoord.q},${hoveredCoord.r},${hoveredCoord.s}`
      )
      expect(hoveredCellAfterBlock).toHaveAttribute('data-state', 'blocked')
      expect(screen.queryByText('Place: Project Alpha')).toBeNull()
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('keeps placement mode active when clicking an occupied completed tile', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onCancelPlacement = vi.fn()

    try {
      render(
        <HexGrid
          placementProject={{ id: 'project-1', name: 'Project Alpha' }}
          onPlaceProject={vi.fn()}
          onCancelPlacement={onCancelPlacement}
          tiles={[
            {
              id: 'tile-completed',
              projectId: 'project-completed',
              coord: { q: 0, r: 2, s: -2 },
              projectName: 'Completed',
              categoryColor: '#9d9d9d',
              isCompleted: true,
            },
          ]}
        />
      )

      fireEvent.click(screen.getByTestId('hex-tile-Completed'))
      expect(onCancelPlacement).not.toHaveBeenCalled()
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('allows selecting completed tiles in placed-project removal mode', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onSelectPlacedProject = vi.fn()

    try {
      render(
        <HexGrid
          isSelectingPlacedProject
          onSelectPlacedProject={onSelectPlacedProject}
          tiles={[
            {
              id: 'tile-completed',
              projectId: 'project-completed',
              coord: { q: 0, r: 2, s: -2 },
              projectName: 'Completed',
              categoryColor: '#9d9d9d',
              isCompleted: true,
            },
          ]}
        />
      )

      fireEvent.click(screen.getByTestId('hex-tile-Completed'))
      expect(onSelectPlacedProject).toHaveBeenCalledTimes(1)
      expect(onSelectPlacedProject).toHaveBeenCalledWith('project-completed')
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })
})
