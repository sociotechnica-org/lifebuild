import type { HexCoord } from './types.js'

const SQRT3 = Math.sqrt(3)

// Six neighbor direction vectors in cube coordinates (pointy-top)
const DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0, s: -1 }, // E
  { q: 1, r: -1, s: 0 }, // NE
  { q: 0, r: -1, s: 1 }, // NW
  { q: -1, r: 0, s: 1 }, // W
  { q: -1, r: 1, s: 0 }, // SW
  { q: 0, r: 1, s: -1 }, // SE
]

export function createHex(q: number, r: number): HexCoord {
  return { q, r, s: -q - r }
}

export function hexToKey(c: HexCoord): string {
  return `${c.q},${c.r},${c.s}`
}

export function hexEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r && a.s === b.s
}

export function hexAdd(a: HexCoord, b: HexCoord): HexCoord {
  return { q: a.q + b.q, r: a.r + b.r, s: a.s + b.s }
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2
}

export function getNeighbors(coord: HexCoord): HexCoord[] {
  return DIRECTIONS.map(d => hexAdd(coord, d))
}

/** Convert cube coord to world position (pointy-top). Returns [x, z] for Three.js. */
export function hexToWorld(coord: HexCoord, size: number): [x: number, z: number] {
  const x = size * (SQRT3 * coord.q + (SQRT3 / 2) * coord.r)
  const z = size * ((3 / 2) * coord.r)
  return [x, z]
}

/** Round fractional cube coordinates to nearest hex */
export function roundHex(q: number, r: number, s: number): HexCoord {
  let rq = Math.round(q)
  let rr = Math.round(r)
  let rs = Math.round(s)

  const dq = Math.abs(rq - q)
  const dr = Math.abs(rr - r)
  const ds = Math.abs(rs - s)

  // Fix the component with the largest rounding error
  if (dq > dr && dq > ds) {
    rq = -rr - rs
  } else if (dr > ds) {
    rr = -rq - rs
  } else {
    rs = -rq - rr
  }

  // Normalize -0 to 0
  return { q: rq || 0, r: rr || 0, s: rs || 0 }
}
