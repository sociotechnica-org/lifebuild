import { generateHexGrid } from '@lifebuild/shared/hex'
import { hexToKey, hexToWorld } from '@lifebuild/shared/hex'
import type { HexCoord } from '@lifebuild/shared/hex'
import { Html } from '@react-three/drei'
import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { HexCell } from './HexCell.js'
import { HexTile, type HexTileVisualState, type HexTileWorkstream } from './HexTile.js'
import { SystemHexTile } from './SystemHexTile.js'
import { truncateLabel } from './labelUtils.js'
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
  visualState?: HexTileVisualState
  workstream?: HexTileWorkstream
  isCompleted?: boolean
  onClick?: () => void
}

export type PlacedSystemTile = {
  id: string
  systemId: string
  coord: HexCoord
  systemName: string
  category?: string | null
  categoryColor: string
  lifecycleState: 'planted' | 'hibernating'
  onClick?: () => void
}

type PlacementEntity = {
  id: string
  name: string
  entityType: 'project' | 'system'
}

type HexGridProps = {
  tiles?: readonly PlacedHexTile[]
  systemTiles?: readonly PlacedSystemTile[]
  placementProject?: {
    id: string
    name: string
  } | null
  placementSystem?: {
    id: string
    name: string
  } | null
  selectedPlacedProjectId?: string | null
  isSelectingPlacedProject?: boolean
  onPlaceProject?: (projectId: string, coord: HexCoord) => Promise<void> | void
  onPlaceSystem?: (systemId: string, coord: HexCoord) => Promise<void> | void
  onSelectPlacedProject?: (projectId: string) => void
  onCancelPlacement?: () => void
}

export function HexGrid({
  tiles = [],
  systemTiles = [],
  placementProject = null,
  placementSystem = null,
  selectedPlacedProjectId = null,
  isSelectingPlacedProject = false,
  onPlaceProject,
  onPlaceSystem,
  onSelectPlacedProject,
  onCancelPlacement,
}: HexGridProps) {
  const cells = useMemo(() => generateHexGrid(GRID_RADIUS), [])
  const [hoveredPlacementKey, setHoveredPlacementKey] = useState<string | null>(null)

  // Resolve the active placement entity (project or system)
  const placementEntity: PlacementEntity | null = useMemo(() => {
    if (placementProject && onPlaceProject) {
      return { id: placementProject.id, name: placementProject.name, entityType: 'project' }
    }
    if (placementSystem && onPlaceSystem) {
      return { id: placementSystem.id, name: placementSystem.name, entityType: 'system' }
    }
    return null
  }, [placementProject, placementSystem, onPlaceProject, onPlaceSystem])

  const isPlacementMode = placementEntity !== null

  const cellByKey = useMemo(() => {
    return new Map(cells.map(cell => [cell.key, cell]))
  }, [cells])

  // Include both project and system tiles in occupied cells
  const occupiedTilesByKey = useMemo(() => {
    const map = new Map<string, PlacedHexTile | PlacedSystemTile>()
    for (const tile of tiles) {
      map.set(hexToKey(tile.coord), tile)
    }
    for (const tile of systemTiles) {
      map.set(hexToKey(tile.coord), tile)
    }
    return map
  }, [tiles, systemTiles])

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
  const hoveredPlacementLabel = placementEntity
    ? truncateLabel(placementEntity.name, MAX_PLACEMENT_LABEL_LENGTH)
    : ''
  const hoveredPlacementPosition =
    hoveredPlacementCell && !isHoveredPlacementBlocked
      ? hexToWorld(hoveredPlacementCell.coord, 1)
      : null

  const handlePlacementClick = (cell: { coord: HexCoord; key: string }) => {
    if (!isPlacementMode || !placementEntity) {
      return
    }

    const isBlocked = isBlockedCell(cell.key, cell.coord)
    if (isBlocked) {
      return
    }

    const placeHandler = placementEntity.entityType === 'project' ? onPlaceProject : onPlaceSystem

    if (!placeHandler) {
      return
    }

    void Promise.resolve(placeHandler(placementEntity.id, cell.coord))
      .then(() => {
        setHoveredPlacementKey(null)
        onCancelPlacement?.()
      })
      .catch(error => {
        console.error(`Failed to place ${placementEntity.entityType} on hex`, error)
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

  const handleSystemTileClick = (tile: PlacedSystemTile) => {
    if (isPlacementMode) {
      onCancelPlacement?.()
      return
    }

    tile.onClick?.()
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
      {systemTiles.map(tile => (
        <SystemHexTile
          key={tile.id}
          coord={tile.coord}
          systemName={tile.systemName}
          categoryColor={tile.categoryColor}
          lifecycleState={tile.lifecycleState}
          onClick={() => handleSystemTileClick(tile)}
        />
      ))}
      {isPlacementMode &&
        hoveredPlacementCell &&
        hoveredPlacementPosition &&
        placementEntity &&
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
