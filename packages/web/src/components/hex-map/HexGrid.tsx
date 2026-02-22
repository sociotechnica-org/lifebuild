import { generateHexGrid } from '@lifebuild/shared/hex'
import type { HexCoord } from '@lifebuild/shared/hex'
import React from 'react'
import { useMemo } from 'react'
import { HexCell } from './HexCell.js'
import { HexTile } from './HexTile.js'

const GRID_RADIUS = 3

export type PlacedHexTile = {
  id: string
  coord: HexCoord
  projectName: string
  categoryColor: string
  isCompleted?: boolean
  onClick?: () => void
}

type HexGridProps = {
  tiles?: readonly PlacedHexTile[]
}

export function HexGrid({ tiles = [] }: HexGridProps) {
  const cells = useMemo(() => generateHexGrid(GRID_RADIUS), [])

  return (
    <group>
      {cells.map(cell => (
        <HexCell key={cell.key} coord={cell.coord} />
      ))}
      {tiles.map(tile => (
        <HexTile
          key={tile.id}
          coord={tile.coord}
          projectName={tile.projectName}
          categoryColor={tile.categoryColor}
          isCompleted={tile.isCompleted}
          onClick={tile.onClick}
        />
      ))}
    </group>
  )
}
