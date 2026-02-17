import { createHex, hexToKey } from './math.js'
import type { HexCell } from './types.js'

/** Generate a hex grid of given radius centered on (0, 0, 0). */
export function generateHexGrid(radius: number): HexCell[] {
  const cells: HexCell[] = []

  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius)
    const r2 = Math.min(radius, -q + radius)

    for (let r = r1; r <= r2; r++) {
      const coord = createHex(q, r)
      cells.push({ coord, key: hexToKey(coord) })
    }
  }

  return cells
}
