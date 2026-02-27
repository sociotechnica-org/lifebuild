import { createHex, hexToKey } from '@lifebuild/shared/hex'
import type { HexCoord } from '@lifebuild/shared/hex'

export type FixedBuildingType = 'campfire' | 'sanctuary' | 'workshop'

export type FixedBuildingPlacement = {
  readonly type: FixedBuildingType
  readonly coord: HexCoord
}

export const FIXED_BUILDINGS: readonly FixedBuildingPlacement[] = [
  { type: 'campfire', coord: createHex(0, 0) },
  { type: 'sanctuary', coord: createHex(0, -1) },
  { type: 'workshop', coord: createHex(1, -1) },
] as const

const RESERVED_PROJECT_HEX_COORDS: readonly HexCoord[] = FIXED_BUILDINGS.map(
  building => building.coord
)

const RESERVED_PROJECT_HEX_KEYS = new Set(RESERVED_PROJECT_HEX_COORDS.map(coord => hexToKey(coord)))

export const isReservedProjectHex = (hexQ: number, hexR: number): boolean => {
  return RESERVED_PROJECT_HEX_KEYS.has(hexToKey(createHex(hexQ, hexR)))
}

export const isReservedProjectCoord = (coord: HexCoord): boolean => {
  return RESERVED_PROJECT_HEX_KEYS.has(hexToKey(coord))
}
