import { createHex } from '@lifebuild/shared/hex'
import { describe, expect, it } from 'vitest'
import {
  CAMPFIRE_PROJECT_HEX_COORD,
  SANCTUARY_PROJECT_HEX_COORDS,
  isReservedProjectCoord,
  isReservedProjectHex,
} from './placementRules.js'

describe('placementRules', () => {
  it('marks all sanctuary coordinates as reserved', () => {
    SANCTUARY_PROJECT_HEX_COORDS.forEach(coord => {
      expect(isReservedProjectCoord(coord)).toBe(true)
      expect(isReservedProjectHex(coord.q, coord.r)).toBe(true)
    })
  })

  it('marks the campfire coordinate as reserved', () => {
    expect(isReservedProjectCoord(CAMPFIRE_PROJECT_HEX_COORD)).toBe(true)
    expect(isReservedProjectHex(CAMPFIRE_PROJECT_HEX_COORD.q, CAMPFIRE_PROJECT_HEX_COORD.r)).toBe(
      true
    )
  })

  it('does not reserve unrelated coordinates', () => {
    const coord = createHex(2, -1)
    expect(isReservedProjectCoord(coord)).toBe(false)
    expect(isReservedProjectHex(coord.q, coord.r)).toBe(false)
  })
})
