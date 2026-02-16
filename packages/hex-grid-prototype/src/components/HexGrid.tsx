import { useMemo } from 'react'
import { generateHexGrid } from '../hex/grid.js'
import { hexEquals, hexToKey } from '../hex/math.js'
import { findPath } from '../hex/pathfinding.js'
import type { HexCoord } from '../hex/types.js'
import { useGameState } from '../store/gameState.js'
import { useSpriteState } from '../store/spriteState.js'
import { HexCell } from './HexCell.js'

const GRID_RADIUS = 10

export function HexGrid() {
  const cells = useMemo(() => generateHexGrid(GRID_RADIUS), [])
  const validKeys = useMemo(() => new Set(cells.map(c => hexToKey(c.coord))), [cells])

  const selectedHex = useGameState(s => s.selectedHex)
  const unitPosition = useGameState(s => s.unitPosition)
  const isMoving = useGameState(s => s.isMoving)
  const selectHex = useGameState(s => s.selectHex)
  const startMove = useGameState(s => s.startMove)

  const heldSpriteId = useSpriteState(s => s.heldSpriteId)
  const pickUp = useSpriteState(s => s.pickUp)
  const drop = useSpriteState(s => s.drop)
  const spriteAt = useSpriteState(s => s.spriteAt)

  const handleClick = (coord: HexCoord) => {
    // If holding a sprite, drop it on this hex
    if (heldSpriteId) {
      drop(coord)
      return
    }

    // If a sprite is on this hex, pick it up
    const sprite = spriteAt(coord)
    if (sprite) {
      pickUp(sprite.id)
      return
    }

    // Otherwise, normal hex selection + unit movement
    selectHex(coord)

    if (!isMoving && !hexEquals(unitPosition, coord)) {
      const path = findPath(unitPosition, coord, validKeys)
      if (path && path.length > 1) {
        startMove(path)
      }
    }
  }

  return (
    <group>
      {cells.map(cell => (
        <HexCell
          key={cell.key}
          coord={cell.coord}
          isSelected={selectedHex ? hexEquals(selectedHex, cell.coord) : false}
          hasUnit={hexEquals(unitPosition, cell.coord) && !isMoving}
          onClick={handleClick}
        />
      ))}
    </group>
  )
}
