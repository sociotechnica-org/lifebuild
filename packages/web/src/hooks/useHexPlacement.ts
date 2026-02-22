import type { HexCoord } from '@lifebuild/shared/hex'
import { hexToKey } from '@lifebuild/shared/hex'
import { getHexPlacements$ } from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import { useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext.js'
import { useQuery, useStore } from '../livestore-compat.js'

export function useHexPlacement() {
  const { store } = useStore()
  const { user } = useAuth()
  const placements = useQuery(getHexPlacements$) ?? []

  const occupiedHexKeys = useMemo(
    () => new Set(placements.map(p => hexToKey({ q: p.q, r: p.r, s: p.s }))),
    [placements]
  )

  const isHexOccupied = useCallback(
    (coord: HexCoord) => occupiedHexKeys.has(hexToKey(coord)),
    [occupiedHexKeys]
  )

  const placeProject = useCallback(
    (projectId: string, coord: HexCoord): boolean => {
      if (isHexOccupied(coord)) {
        return false
      }
      store.commit(
        events.projectHexPlaced({
          projectId,
          q: coord.q,
          r: coord.r,
          s: coord.s,
          placedAt: new Date(),
          actorId: user?.id,
        })
      )
      return true
    },
    [store, user, isHexOccupied]
  )

  const removeProject = useCallback(
    (projectId: string) => {
      store.commit(
        events.projectHexRemoved({
          projectId,
          removedAt: new Date(),
          actorId: user?.id,
        })
      )
    },
    [store, user]
  )

  return { placements, isHexOccupied, placeProject, removeProject }
}
