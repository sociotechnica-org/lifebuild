import { describe, expect, it } from 'vitest'
import {
  createHex,
  getNeighbors,
  hexDistance,
  hexEquals,
  hexToKey,
  hexToWorld,
  roundHex,
} from '../../src/hex/math.js'

describe('createHex', () => {
  it('computes s from q and r', () => {
    const hex = createHex(1, -1)
    expect(hex).toEqual({ q: 1, r: -1, s: 0 })
  })

  it('satisfies q + r + s = 0', () => {
    const hex = createHex(3, -7)
    expect(hex.q + hex.r + hex.s).toBe(0)
  })
})

describe('hexToKey', () => {
  it('produces a deterministic string', () => {
    expect(hexToKey({ q: 1, r: 2, s: -3 })).toBe('1,2,-3')
  })
})

describe('hexEquals', () => {
  it('returns true for equal coords', () => {
    expect(hexEquals(createHex(1, 2), createHex(1, 2))).toBe(true)
  })

  it('returns false for different coords', () => {
    expect(hexEquals(createHex(1, 2), createHex(2, 1))).toBe(false)
  })
})

describe('hexDistance', () => {
  it('returns 0 for same hex', () => {
    const origin = createHex(0, 0)
    expect(hexDistance(origin, origin)).toBe(0)
  })

  it('returns 1 for adjacent hexes', () => {
    expect(hexDistance(createHex(0, 0), createHex(1, 0))).toBe(1)
  })

  it('returns correct distance for far hexes', () => {
    expect(hexDistance(createHex(0, 0), createHex(3, -3))).toBe(3)
  })
})

describe('getNeighbors', () => {
  it('returns 6 neighbors', () => {
    const neighbors = getNeighbors(createHex(0, 0))
    expect(neighbors).toHaveLength(6)
  })

  it('all neighbors are distance 1 away', () => {
    const origin = createHex(0, 0)
    for (const neighbor of getNeighbors(origin)) {
      expect(hexDistance(origin, neighbor)).toBe(1)
    }
  })

  it('all neighbors satisfy cube constraint', () => {
    for (const neighbor of getNeighbors(createHex(2, -1))) {
      expect(neighbor.q + neighbor.r + neighbor.s).toBe(0)
    }
  })
})

describe('roundHex', () => {
  it('rounds to the nearest hex', () => {
    const hex = roundHex(0.3, -0.1, -0.2)
    expect(hex).toEqual({ q: 0, r: 0, s: 0 })
    expect(hex.q + hex.r + hex.s).toBe(0)
  })

  it('rounds correctly near a hex boundary', () => {
    const hex = roundHex(0.9, -0.5, -0.4)
    expect(hex).toEqual({ q: 1, r: -1, s: 0 })
    expect(hex.q + hex.r + hex.s).toBe(0)
  })
})

describe('hexToWorld', () => {
  it('maps the origin to the origin in world coordinates', () => {
    expect(hexToWorld(createHex(0, 0), 1)).toEqual([0, 0])
  })

  it('returns deterministic pointy-top world coordinates', () => {
    const [x, z] = hexToWorld(createHex(2, -1), 1)
    expect(x).toBeCloseTo(2.598_076_211)
    expect(z).toBeCloseTo(-1.5)
  })
})
