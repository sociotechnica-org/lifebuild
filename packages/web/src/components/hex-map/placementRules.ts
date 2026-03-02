import { createHex, hexToKey } from '@lifebuild/shared/hex'
import type { HexCoord } from '@lifebuild/shared/hex'

export type FixedBuildingType = 'campfire' | 'sanctuary' | 'workshop'

export type FixedBuildingPlacement = {
  readonly type: FixedBuildingType
  readonly coord: HexCoord
}

export const SANCTUARY_PROJECT_HEX_COORDS: readonly HexCoord[] = [
  createHex(0, 0),
  createHex(0, -1),
  createHex(1, -1),
]

export const CAMPFIRE_PROJECT_HEX_COORD = createHex(3, 0)

export const FIXED_BUILDINGS: readonly FixedBuildingPlacement[] = [
  { type: 'campfire', coord: CAMPFIRE_PROJECT_HEX_COORD },
  { type: 'sanctuary', coord: SANCTUARY_PROJECT_HEX_COORDS[1]! },
  { type: 'workshop', coord: SANCTUARY_PROJECT_HEX_COORDS[2]! },
] as const

export const RESERVED_PROJECT_HEX_COORDS = [
  ...SANCTUARY_PROJECT_HEX_COORDS,
  CAMPFIRE_PROJECT_HEX_COORD,
] as const

const RESERVED_PROJECT_HEX_KEYS = new Set(RESERVED_PROJECT_HEX_COORDS.map(coord => hexToKey(coord)))

export const isReservedProjectHex = (hexQ: number, hexR: number): boolean => {
  return RESERVED_PROJECT_HEX_KEYS.has(hexToKey(createHex(hexQ, hexR)))
}

export const isReservedProjectCoord = (coord: HexCoord): boolean => {
  return RESERVED_PROJECT_HEX_KEYS.has(hexToKey(coord))
}
