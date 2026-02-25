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

vi.mock('./SystemHexTile.js', () => ({
  SystemHexTile: (props: { systemName: string; onClick?: () => void }) => (
    <button
      data-testid={`system-hex-tile-${props.systemName}`}
      onClick={() => props.onClick?.()}
      type='button'
    >
      system-tile
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

describe('HexGrid placement behavior', () => {
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

  it('cancels placement mode when clicking a completed tile', () => {
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
      expect(onCancelPlacement).toHaveBeenCalledTimes(1)
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('marks cells occupied by system tiles as blocked during placement', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onPlaceProject = vi.fn()

    try {
      render(
        <HexGrid
          placementProject={{ id: 'project-1', name: 'Project Alpha' }}
          onPlaceProject={onPlaceProject}
          systemTiles={[
            {
              id: 'sys-tile-1',
              systemId: 'system-1',
              coord: { q: 0, r: 2, s: -2 },
              systemName: 'Weekly Review',
              categoryColor: '#10B981',
              lifecycleState: 'planted',
            },
          ]}
        />
      )

      const blockedCell = screen.getByTestId('hex-cell-0,2,-2')
      expect(blockedCell).toHaveAttribute('data-state', 'blocked')
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
