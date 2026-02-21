import type { HexCoord } from './types.js'

const SQRT3 = Math.sqrt(3)

// Six neighbor direction vectors in cube coordinates (pointy-top).
const DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0, s: -1 },
  { q: 1, r: -1, s: 0 },
  { q: 0, r: -1, s: 1 },
  { q: -1, r: 0, s: 1 },
  { q: -1, r: 1, s: 0 },
  { q: 0, r: 1, s: -1 },
]

const normalizeNegativeZero = (value: number): number => {
  return Object.is(value, -0) ? 0 : value
}

export function createHex(q: number, r: number): HexCoord {
  if (!Number.isFinite(q) || !Number.isFinite(r)) {
    throw new Error(`Invalid cube coordinates: q=${q}, r=${r}`)
  }

  const normalizedQ = normalizeNegativeZero(q)
  const normalizedR = normalizeNegativeZero(r)

  return {
    q: normalizedQ,
    r: normalizedR,
    s: normalizeNegativeZero(-normalizedQ - normalizedR),
  }
}

export function hexToKey(coord: HexCoord): string {
  return `${coord.q},${coord.r},${coord.s}`
}

export function hexEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r && a.s === b.s
}

export function hexAdd(a: HexCoord, b: HexCoord): HexCoord {
  return {
    q: a.q + b.q,
    r: a.r + b.r,
    s: a.s + b.s,
  }
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2
}

export function getNeighbors(coord: HexCoord): HexCoord[] {
  return DIRECTIONS.map(direction => hexAdd(coord, direction))
}

/** Convert cube coord to world position (pointy-top). Returns [x, z] for Three.js. */
export function hexToWorld(coord: HexCoord, size: number): [x: number, z: number] {
  const x = size * (SQRT3 * coord.q + (SQRT3 / 2) * coord.r)
  const z = size * ((3 / 2) * coord.r)
  return [x, z]
}

/** Round fractional cube coordinates to nearest hex. */
export function roundHex(q: number, r: number, s: number): HexCoord {
  let roundedQ = Math.round(q)
  let roundedR = Math.round(r)
  let roundedS = Math.round(s)

  const qDelta = Math.abs(roundedQ - q)
  const rDelta = Math.abs(roundedR - r)
  const sDelta = Math.abs(roundedS - s)

  // Fix the component with the largest rounding error.
  if (qDelta > rDelta && qDelta > sDelta) {
    roundedQ = -roundedR - roundedS
  } else if (rDelta > sDelta) {
    roundedR = -roundedQ - roundedS
  } else {
    roundedS = -roundedQ - roundedR
  }

  // Normalize -0 to 0.
  return {
    q: roundedQ || 0,
    r: roundedR || 0,
    s: roundedS || 0,
  }
}
