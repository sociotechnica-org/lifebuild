import { createHex, hexToKey } from './math.js'
import type { HexCell } from './types.js'

/** Generate a hex grid of a given radius centered on (0, 0, 0). */
export function generateHexGrid(radius: number): HexCell[] {
  if (!Number.isInteger(radius) || radius < 0) {
    throw new Error(`Hex grid radius must be a non-negative integer, received: ${radius}`)
  }

  const cells: HexCell[] = []

  for (let q = -radius; q <= radius; q += 1) {
    const minR = Math.max(-radius, -q - radius)
    const maxR = Math.min(radius, -q + radius)

    for (let r = minR; r <= maxR; r += 1) {
      const coord = createHex(q, r)
      cells.push({ coord, key: hexToKey(coord) })
    }
  }

  return cells
}
