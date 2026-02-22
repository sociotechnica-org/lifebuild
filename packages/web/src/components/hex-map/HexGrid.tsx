import { generateHexGrid } from '@lifebuild/shared/hex'
import { hexToKey, hexToWorld } from '@lifebuild/shared/hex'
import type { HexCoord } from '@lifebuild/shared/hex'
import { Html } from '@react-three/drei'
import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { HexCell } from './HexCell.js'
import { HexTile } from './HexTile.js'
import { isReservedProjectCoord } from './placementRules.js'

const GRID_RADIUS = 3
const MAX_PLACEMENT_LABEL_LENGTH = 30

export type PlacedHexTile = {
  id: string
  projectId: string
  coord: HexCoord
  projectName: string
  category?: string | null
  categoryColor: string
  isCompleted?: boolean
  onClick?: () => void
}

type HexGridProps = {
  tiles?: readonly PlacedHexTile[]
  placementProject?: {
    id: string
    name: string
  } | null
  selectedPlacedProjectId?: string | null
  isSelectingPlacedProject?: boolean
  onPlaceProject?: (projectId: string, coord: HexCoord) => Promise<void> | void
  onSelectPlacedProject?: (projectId: string) => void
  onCancelPlacement?: () => void
}

const truncateLabel = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 3)}...`
}

export function HexGrid({
  tiles = [],
  placementProject = null,
  selectedPlacedProjectId = null,
  isSelectingPlacedProject = false,
  onPlaceProject,
  onSelectPlacedProject,
  onCancelPlacement,
}: HexGridProps) {
  const cells = useMemo(() => generateHexGrid(GRID_RADIUS), [])
  const [hoveredPlacementKey, setHoveredPlacementKey] = useState<string | null>(null)
  const isPlacementMode = Boolean(placementProject && onPlaceProject)

  const cellByKey = useMemo(() => {
    return new Map(cells.map(cell => [cell.key, cell]))
  }, [cells])

  const occupiedTilesByKey = useMemo(() => {
    return new Map(tiles.map(tile => [hexToKey(tile.coord), tile]))
  }, [tiles])

  useEffect(() => {
    if (!isPlacementMode) {
      setHoveredPlacementKey(null)
    }
  }, [isPlacementMode])

  const hoveredPlacementCell = hoveredPlacementKey ? cellByKey.get(hoveredPlacementKey) : null
  const hoveredPlacementLabel = placementProject
    ? truncateLabel(placementProject.name, MAX_PLACEMENT_LABEL_LENGTH)
    : ''
  const hoveredPlacementPosition = hoveredPlacementCell
    ? hexToWorld(hoveredPlacementCell.coord, 1)
    : null

  const handlePlacementClick = (cell: { coord: HexCoord; key: string }) => {
    if (!isPlacementMode || !placementProject || !onPlaceProject) {
      return
    }

    const isBlocked = occupiedTilesByKey.has(cell.key) || isReservedProjectCoord(cell.coord)
    if (isBlocked) {
      onCancelPlacement?.()
      return
    }

    void Promise.resolve(onPlaceProject(placementProject.id, cell.coord))
      .then(() => {
        setHoveredPlacementKey(null)
        onCancelPlacement?.()
      })
      .catch(error => {
        console.error('Failed to place project on hex', error)
      })
  }

  const handleTileClick = (tile: PlacedHexTile) => {
    if (isPlacementMode) {
      onCancelPlacement?.()
      return
    }

    if (isSelectingPlacedProject && !tile.isCompleted) {
      onSelectPlacedProject?.(tile.projectId)
      return
    }

    tile.onClick?.()
  }

  return (
    <group>
      {cells.map(cell => {
        const isBlocked = occupiedTilesByKey.has(cell.key) || isReservedProjectCoord(cell.coord)
        const isTargeted = hoveredPlacementKey === cell.key
        const visualState = isPlacementMode
          ? isTargeted
            ? 'targeted'
            : isBlocked
              ? 'blocked'
              : 'placeable'
          : undefined

        return (
          <HexCell
            key={cell.key}
            coord={cell.coord}
            visualStateOverride={visualState}
            onClick={
              isPlacementMode
                ? () => {
                    handlePlacementClick(cell)
                  }
                : undefined
            }
            onHoverChange={
              isPlacementMode && !isBlocked
                ? isHovered => {
                    setHoveredPlacementKey(previous =>
                      isHovered ? cell.key : previous === cell.key ? null : previous
                    )
                  }
                : undefined
            }
          />
        )
      })}
      {tiles.map(tile => (
        <HexTile
          key={tile.id}
          coord={tile.coord}
          projectName={tile.projectName}
          categoryColor={tile.categoryColor}
          isCompleted={tile.isCompleted}
          isSelected={selectedPlacedProjectId === tile.projectId}
          onClick={() => handleTileClick(tile)}
        />
      ))}
      {isPlacementMode && hoveredPlacementCell && hoveredPlacementPosition && placementProject && (
        <Html
          position={[hoveredPlacementPosition[0], 0.44, hoveredPlacementPosition[1]]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className='rounded-md border border-[#c48b5a] bg-[#fff7ec]/95 px-2 py-1 text-[10px] font-semibold text-[#5f462f] shadow-sm'>
            Place: {hoveredPlacementLabel}
          </div>
        </Html>
      )}
    </group>
  )
}
