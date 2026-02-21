import { describe, expect, it } from 'vitest'
import { generateHexGrid } from '../../src/hex/grid.js'

describe('generateHexGrid', () => {
  it('returns one cell for radius 0', () => {
    const cells = generateHexGrid(0)
    expect(cells).toHaveLength(1)
    expect(cells[0]?.coord).toEqual({ q: 0, r: 0, s: 0 })
  })

  it('returns 37 cells for radius 3', () => {
    const cells = generateHexGrid(3)
    expect(cells).toHaveLength(37)
  })

  it('produces unique keys for each generated cell', () => {
    const cells = generateHexGrid(3)
    const keys = new Set(cells.map(cell => cell.key))
    expect(keys.size).toBe(cells.length)
  })
})
