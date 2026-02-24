import { createHex, hexToKey } from '@lifebuild/shared/hex'
import type { HexCoord } from '@lifebuild/shared/hex'

const RESERVED_PROJECT_HEX_COORDS: readonly HexCoord[] = [
  createHex(0, 0),
  createHex(0, -1),
  createHex(1, -1),
]

const RESERVED_PROJECT_HEX_KEYS = new Set(RESERVED_PROJECT_HEX_COORDS.map(coord => hexToKey(coord)))

export const isReservedProjectHex = (hexQ: number, hexR: number): boolean => {
  return RESERVED_PROJECT_HEX_KEYS.has(hexToKey(createHex(hexQ, hexR)))
}

export const isReservedProjectCoord = (coord: HexCoord): boolean => {
  return RESERVED_PROJECT_HEX_KEYS.has(hexToKey(coord))
}
