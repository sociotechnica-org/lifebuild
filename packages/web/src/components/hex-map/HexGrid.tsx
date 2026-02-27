import { generateHexGrid } from '@lifebuild/shared/hex'
import { hexToKey, hexToWorld } from '@lifebuild/shared/hex'
import type { HexCoord } from '@lifebuild/shared/hex'
import { Html } from '@react-three/drei'
import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { FixedBuilding } from './FixedBuilding.js'
import { HexCell } from './HexCell.js'
import { HexTile, type HexTileVisualState, type HexTileWorkstream } from './HexTile.js'
import { truncateLabel } from './labelUtils.js'
import {
  FIXED_BUILDINGS,
  isReservedProjectCoord,
  type FixedBuildingType,
} from './placementRules.js'

const GRID_RADIUS = 3
const MAX_PLACEMENT_LABEL_LENGTH = 30

export type PlacedHexTile = {
  id: string
  projectId: string
  coord: HexCoord
  projectName: string
  category?: string | null
  categoryColor: string
  visualState?: HexTileVisualState
  workstream?: HexTileWorkstream
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
  onOpenWorkshop?: () => void
  onOpenSanctuary?: () => void
}

export function HexGrid({
  tiles = [],
  placementProject = null,
  selectedPlacedProjectId = null,
  isSelectingPlacedProject = false,
  onPlaceProject,
  onSelectPlacedProject,
  onCancelPlacement,
  onOpenWorkshop,
  onOpenSanctuary,
}: HexGridProps) {
  const cells = useMemo(() => generateHexGrid(GRID_RADIUS), [])
  const [hoveredPlacementKey, setHoveredPlacementKey] = useState<string | null>(null)
  const isPlacementMode = Boolean(placementProject && onPlaceProject)
  const allowBuildingOverlayOpen = !isPlacementMode && !isSelectingPlacedProject

  const cellByKey = useMemo(() => {
    return new Map(cells.map(cell => [cell.key, cell]))
  }, [cells])

  const occupiedTilesByKey = useMemo(() => {
    return new Map(tiles.map(tile => [hexToKey(tile.coord), tile]))
  }, [tiles])

  const isBlockedCell = (cellKey: string, coord: HexCoord): boolean => {
    return occupiedTilesByKey.has(cellKey) || isReservedProjectCoord(coord)
  }

  useEffect(() => {
    if (!isPlacementMode) {
      setHoveredPlacementKey(null)
    }
  }, [isPlacementMode])

  const hoveredPlacementCell = hoveredPlacementKey ? cellByKey.get(hoveredPlacementKey) : null
  const isHoveredPlacementBlocked =
    hoveredPlacementCell && hoveredPlacementKey
      ? isBlockedCell(hoveredPlacementKey, hoveredPlacementCell.coord)
      : false
  const hoveredPlacementLabel = placementProject
    ? truncateLabel(placementProject.name, MAX_PLACEMENT_LABEL_LENGTH)
    : ''
  const hoveredPlacementPosition =
    hoveredPlacementCell && !isHoveredPlacementBlocked
      ? hexToWorld(hoveredPlacementCell.coord, 1)
      : null

  const handlePlacementClick = (cell: { coord: HexCoord; key: string }) => {
    if (!isPlacementMode || !placementProject || !onPlaceProject) {
      return
    }

    const isBlocked = isBlockedCell(cell.key, cell.coord)
    if (isBlocked) {
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

    if (isSelectingPlacedProject) {
      onSelectPlacedProject?.(tile.projectId)
      return
    }

    tile.onClick?.()
  }

  const handleFixedBuildingActivate = (buildingType: FixedBuildingType) => {
    if (buildingType === 'sanctuary') {
      onOpenSanctuary?.()
      return
    }

    if (buildingType === 'workshop') {
      onOpenWorkshop?.()
    }
  }

  return (
    <group>
      {cells.map(cell => {
        const isBlocked = isBlockedCell(cell.key, cell.coord)
        const isTargeted = hoveredPlacementKey === cell.key
        const visualState = isPlacementMode
          ? isBlocked
            ? 'blocked'
            : isTargeted
              ? 'targeted'
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
          projectId={tile.projectId}
          coord={tile.coord}
          projectName={tile.projectName}
          categoryColor={tile.categoryColor}
          visualState={tile.visualState}
          workstream={tile.workstream}
          isCompleted={tile.isCompleted}
          isSelected={selectedPlacedProjectId === tile.projectId}
          allowCompletedClick={isPlacementMode || isSelectingPlacedProject}
          onClick={() => handleTileClick(tile)}
        />
      ))}
      {FIXED_BUILDINGS.map(building => (
        <FixedBuilding
          key={building.type}
          type={building.type}
          coord={building.coord}
          onActivate={
            building.type === 'campfire' || !allowBuildingOverlayOpen
              ? undefined
              : () => {
                  handleFixedBuildingActivate(building.type)
                }
          }
        />
      ))}
      {isPlacementMode &&
        hoveredPlacementCell &&
        hoveredPlacementPosition &&
        placementProject &&
        !isHoveredPlacementBlocked && (
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
