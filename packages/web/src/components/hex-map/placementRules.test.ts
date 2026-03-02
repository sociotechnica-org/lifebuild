import { createHex, generateHexGrid } from '@lifebuild/shared/hex'
import { describe, expect, it } from 'vitest'
import {
  CAMPFIRE_PROJECT_HEX_COORD,
  FIXED_BUILDINGS,
  SANCTUARY_PROJECT_HEX_COORDS,
  findLegacyCampfireRelocationCoord,
  isReservedProjectCoord,
  isReservedProjectHex,
} from './placementRules.js'

describe('placementRules', () => {
  it('defines the expected fixed buildings and coordinates', () => {
    expect(FIXED_BUILDINGS).toEqual([
      { type: 'campfire', coord: createHex(3, 0) },
      { type: 'sanctuary', coord: createHex(0, -1) },
      { type: 'workshop', coord: createHex(1, -1) },
    ])
  })

  it('keeps reserve checks aligned with fixed building coordinates', () => {
    for (const building of FIXED_BUILDINGS) {
      expect(isReservedProjectCoord(building.coord)).toBe(true)
      expect(isReservedProjectHex(building.coord.q, building.coord.r)).toBe(true)
    }

    expect(isReservedProjectHex(-1, 0)).toBe(false)
    expect(isReservedProjectCoord(createHex(2, -2))).toBe(false)
  })

  it('keeps sanctuary and campfire reserve exports aligned', () => {
    SANCTUARY_PROJECT_HEX_COORDS.forEach(coord => {
      expect(isReservedProjectCoord(coord)).toBe(true)
      expect(isReservedProjectHex(coord.q, coord.r)).toBe(true)
    })

    expect(isReservedProjectCoord(CAMPFIRE_PROJECT_HEX_COORD)).toBe(true)
  })

  it('finds a deterministic fallback for legacy projects on the campfire hex', () => {
    const relocation = findLegacyCampfireRelocationCoord([createHex(3, 0)])
    expect(relocation).toEqual(createHex(2, 0))
    expect(isReservedProjectCoord(relocation!)).toBe(false)
  })

  it('returns null when no free non-reserved relocation hex exists', () => {
    const occupied = generateHexGrid(3)
      .map(cell => cell.coord)
      .filter(coord => !isReservedProjectCoord(coord))

    expect(findLegacyCampfireRelocationCoord(occupied)).toBeNull()
  })
})
