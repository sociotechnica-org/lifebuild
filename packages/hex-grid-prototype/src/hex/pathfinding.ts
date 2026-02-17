import { getNeighbors, hexEquals, hexToKey } from './math.js'
import type { HexCoord } from './types.js'

/** BFS shortest path from start to end. Returns path including both endpoints, or null. */
export function findPath(
  start: HexCoord,
  end: HexCoord,
  validKeys: Set<string>
): HexCoord[] | null {
  if (hexEquals(start, end)) return [start]

  const startKey = hexToKey(start)
  const endKey = hexToKey(end)

  if (!validKeys.has(startKey) || !validKeys.has(endKey)) return null

  const queue: HexCoord[] = [start]
  const cameFrom = new Map<string, HexCoord>()
  const visited = new Set<string>([startKey])

  while (queue.length > 0) {
    const current = queue.shift()!
    const currentKey = hexToKey(current)

    if (currentKey === endKey) {
      // Reconstruct path
      const path: HexCoord[] = [end]
      let traceKey = endKey
      while (traceKey !== startKey) {
        const prev = cameFrom.get(traceKey)!
        path.unshift(prev)
        traceKey = hexToKey(prev)
      }
      return path
    }

    for (const neighbor of getNeighbors(current)) {
      const key = hexToKey(neighbor)
      if (visited.has(key) || !validKeys.has(key)) continue
      visited.add(key)
      cameFrom.set(key, current)
      queue.push(neighbor)
    }
  }

  return null
}
