import type { HexCoord } from '@lifebuild/shared/hex'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/test-utils.js'
import { HexGrid } from './HexGrid.js'

type MockHexCellProps = {
  coord: HexCoord
  visualStateOverride?: 'placeable' | 'blocked' | 'targeted'
  onClick?: () => void
}

vi.mock('@react-three/drei', () => ({
  Html: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./HexTile.js', () => ({
  HexTile: () => null,
}))

vi.mock('./HexCell.js', () => ({
  HexCell: (props: MockHexCellProps) => (
    <button
      data-testid={`hex-cell-${props.coord.q}-${props.coord.r}-${props.coord.s}`}
      data-state={props.visualStateOverride ?? 'default'}
      onClick={() => props.onClick?.()}
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
})
