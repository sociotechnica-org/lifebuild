import { generateHexGrid } from '@lifebuild/shared/hex'
import React from 'react'
import { useMemo } from 'react'
import { HexCell } from './HexCell.js'

const GRID_RADIUS = 3

export function HexGrid() {
  const cells = useMemo(() => generateHexGrid(GRID_RADIUS), [])

  return (
    <group>
      {cells.map(cell => (
        <HexCell key={cell.key} coord={cell.coord} />
      ))}
    </group>
  )
}
