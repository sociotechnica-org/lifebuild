import { describe, expect, it } from 'vitest'
import { generateHexGrid } from '../../src/hex/grid.js'
import { createHex, hexDistance, hexToKey } from '../../src/hex/math.js'
import { findPath } from '../../src/hex/pathfinding.js'

const grid = generateHexGrid(5)
const validKeys = new Set(grid.map(c => hexToKey(c.coord)))

describe('findPath', () => {
  it('returns single-element path for same start and end', () => {
    const origin = createHex(0, 0)
    const path = findPath(origin, origin, validKeys)
    expect(path).toEqual([origin])
  })

  it('finds path between adjacent hexes', () => {
    const start = createHex(0, 0)
    const end = createHex(1, 0)
    const path = findPath(start, end, validKeys)
    expect(path).toHaveLength(2)
    expect(path![0]).toEqual(start)
    expect(path![1]).toEqual(end)
  })

  it('finds shortest path', () => {
    const start = createHex(0, 0)
    const end = createHex(3, -2)
    const path = findPath(start, end, validKeys)
    expect(path).not.toBeNull()
    // Path length should equal distance + 1 (includes both endpoints)
    expect(path!.length).toBe(hexDistance(start, end) + 1)
  })

  it('returns null for unreachable hex', () => {
    const start = createHex(0, 0)
    const end = createHex(100, 0) // way outside the grid
    const path = findPath(start, end, validKeys)
    expect(path).toBeNull()
  })

  it('path starts at start and ends at end', () => {
    const start = createHex(-2, 1)
    const end = createHex(2, -1)
    const path = findPath(start, end, validKeys)!
    expect(path[0]).toEqual(start)
    expect(path[path.length - 1]).toEqual(end)
  })
})
