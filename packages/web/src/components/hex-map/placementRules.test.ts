import { createHex } from '@lifebuild/shared/hex'
import { describe, expect, it } from 'vitest'
import { FIXED_BUILDINGS, isReservedProjectCoord, isReservedProjectHex } from './placementRules.js'

describe('placementRules', () => {
  it('defines the expected fixed buildings and coordinates', () => {
    expect(FIXED_BUILDINGS).toEqual([
      { type: 'campfire', coord: createHex(0, 0) },
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
})
