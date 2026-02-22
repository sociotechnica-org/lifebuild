import type { HexCoord } from '@lifebuild/shared/hex'
import { generateHexGrid } from '@lifebuild/shared/hex'
import React, { useCallback } from 'react'
import { useMemo } from 'react'
import type { HexCellProjectData } from './HexCell.js'
import { HexCell } from './HexCell.js'

const GRID_RADIUS = 3

export type HexGridProps = {
  hexProjectMap: Map<string, HexCellProjectData>
  onHexClick?: (projectId: string) => void
  placementMode?: {
    projectId: string
    onPlace: (coord: HexCoord) => void
  }
}

export function HexGrid({ hexProjectMap, onHexClick, placementMode }: HexGridProps) {
  const cells = useMemo(() => generateHexGrid(GRID_RADIUS), [])

  const handleCellClick = useCallback(
    (cellKey: string, coord: HexCoord) => {
      const projectData = hexProjectMap.get(cellKey)

      if (placementMode) {
        // In placement mode, clicking an empty hex places the project
        if (!projectData) {
          placementMode.onPlace(coord)
        }
        return
      }

      // Normal mode: clicking an occupied hex navigates to the project
      if (projectData && onHexClick) {
        onHexClick(projectData.id)
      }
    },
    [hexProjectMap, onHexClick, placementMode]
  )

  return (
    <group>
      {cells.map(cell => {
        const projectData = hexProjectMap.get(cell.key)
        const isEmpty = !projectData
        const isPlacementTarget = placementMode != null && isEmpty

        return (
          <HexCell
            key={cell.key}
            coord={cell.coord}
            projectData={projectData}
            visualStateOverride={isPlacementTarget ? 'placement-target' : undefined}
            onClick={
              projectData || isPlacementTarget
                ? () => handleCellClick(cell.key, cell.coord)
                : undefined
            }
          />
        )
      })}
    </group>
  )
}
