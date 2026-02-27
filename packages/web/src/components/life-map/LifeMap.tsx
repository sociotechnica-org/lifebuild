import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useStore } from '../../livestore-compat.js'
import { useNavigate } from 'react-router-dom'
import {
  getProjects$,
  getAllProjectsIncludingArchived$,
  getHexPositions$,
  getUnplacedProjects$,
} from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import { createHex } from '@lifebuild/shared/hex'
import type { HexCoord } from '@lifebuild/shared/hex'
import { PROJECT_CATEGORIES, resolveLifecycleState } from '@lifebuild/shared'
import { generateRoute } from '../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'
import { useAuth } from '../../contexts/AuthContext.js'
import { usePostHog } from '../../lib/analytics.js'
import { placeProjectOnHex, removeProjectFromHex } from '../hex-map/hexPositionCommands.js'
import type { HexTileVisualState, HexTileWorkstream } from '../hex-map/HexTile.js'

const LazyHexMap = lazy(() =>
  import('../hex-map/HexMap.js').then(module => ({ default: module.HexMap }))
)

const supportsWebGL = (): boolean => {
  if (typeof document === 'undefined') {
    return false
  }

  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

const renderHexMapLoadingState = () => {
  return (
    <div className='h-full w-full flex items-center justify-center bg-[#efe2cd]'>
      <div className='text-sm font-semibold text-[#6f5b44]'>Loading map...</div>
    </div>
  )
}

/**
 * Life Map renders the full-bleed hex map as the primary surface.
 */
export const LifeMap: React.FC = () => {
  const navigate = useNavigate()
  const { store } = useStore()
  const { user } = useAuth()
  const posthog = usePostHog()
  const actorId = user?.id
  const [hasWebGLSupport] = useState(() => supportsWebGL())

  useEffect(() => {
    posthog?.capture('life_map_viewed')
  }, [posthog])

  const allProjects = useQuery(getProjects$) ?? []
  const allProjectsIncludingArchived = useQuery(getAllProjectsIncludingArchived$) ?? []
  const hexPositions = useQuery(getHexPositions$) ?? []
  const unplacedProjectsFromQuery = useQuery(getUnplacedProjects$) ?? []

  const activeProjectIds = useMemo(() => {
    return new Set(
      allProjects
        .filter(
          project => resolveLifecycleState(project.projectLifecycleState, null).status === 'active'
        )
        .map(project => project.id)
    )
  }, [allProjects])

  const completedProjects = useMemo(() => {
    return allProjects
      .filter(project => {
        const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)
        return lifecycle.status === 'completed'
      })
      .sort((projectA, projectB) => {
        const lifecycleA = resolveLifecycleState(projectA.projectLifecycleState, null)
        const lifecycleB = resolveLifecycleState(projectB.projectLifecycleState, null)
        return (lifecycleB.completedAt ?? 0) - (lifecycleA.completedAt ?? 0)
      })
  }, [allProjects])

  const archivedProjects = useMemo(() => {
    return allProjectsIncludingArchived
      .filter(project => project.archivedAt !== null)
      .sort((projectA, projectB) => {
        const projectADate = projectA.archivedAt ? new Date(projectA.archivedAt).getTime() : 0
        const projectBDate = projectB.archivedAt ? new Date(projectB.archivedAt).getTime() : 0
        return projectBDate - projectADate
      })
  }, [allProjectsIncludingArchived])

  const handleUnarchive = (projectId: string) => {
    store.commit(
      events.projectUnarchived({
        id: projectId,
        unarchivedAt: new Date(),
        actorId,
      })
    )
  }

  const handlePlaceProjectOnMap = useCallback(
    async (projectId: string, coord: HexCoord) => {
      const latestHexPositions = await store.query(getHexPositions$)
      await placeProjectOnHex(store, latestHexPositions, {
        projectId,
        hexQ: coord.q,
        hexR: coord.r,
        actorId,
      })
    },
    [actorId, store]
  )

  const handleRemoveProjectFromMap = useCallback(
    async (projectId: string) => {
      const latestHexPositions = await store.query(getHexPositions$)
      await removeProjectFromHex(store, latestHexPositions, {
        projectId,
        actorId,
      })
    },
    [actorId, store]
  )

  const placedHexTiles = useMemo(() => {
    const projectsById = new Map(allProjects.map(project => [project.id, project]))

    return hexPositions.flatMap(position => {
      if (position.entityType !== 'project') {
        return []
      }

      const project = projectsById.get(position.entityId)
      if (!project) {
        return []
      }

      const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)
      const category = PROJECT_CATEGORIES.find(item => item.value === project.category)
      const isCompleted = lifecycle.status === 'completed'
      const isWorkAtHand = !isCompleted && activeProjectIds.has(project.id)

      const visualState: HexTileVisualState = isCompleted
        ? 'completed'
        : lifecycle.status === 'planning' || lifecycle.status === 'backlog'
          ? 'planning'
          : isWorkAtHand
            ? 'work-at-hand'
            : 'active'

      const workstream: HexTileWorkstream =
        visualState === 'work-at-hand' &&
        (lifecycle.stream === 'gold' ||
          lifecycle.stream === 'silver' ||
          lifecycle.stream === 'bronze')
          ? lifecycle.stream
          : null

      return [
        {
          id: position.id,
          projectId: project.id,
          coord: createHex(position.hexQ, position.hexR),
          projectName: project.name,
          category: project.category ?? null,
          categoryColor: category?.colorHex ?? '#8b8680',
          visualState,
          workstream,
          isCompleted,
          onClick: isCompleted
            ? undefined
            : () => navigate(preserveStoreIdInUrl(generateRoute.project(project.id))),
        },
      ]
    })
  }, [activeProjectIds, allProjects, hexPositions, navigate])

  const unplacedProjects = useMemo(() => {
    return unplacedProjectsFromQuery.map(project => ({
      id: project.id,
      name: project.name,
      category: project.category ?? null,
    }))
  }, [unplacedProjectsFromQuery])

  const completedProjectsForPanel = useMemo(() => {
    return completedProjects.map(project => {
      const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)
      return {
        id: project.id,
        name: project.name,
        category: project.category ?? null,
        completedAt: lifecycle.completedAt ?? null,
      }
    })
  }, [completedProjects])

  const archivedProjectsForPanel = useMemo(() => {
    return archivedProjects.map(project => ({
      id: project.id,
      name: project.name,
      category: project.category ?? null,
      archivedAt: project.archivedAt ?? null,
    }))
  }, [archivedProjects])

  if (!hasWebGLSupport) {
    return (
      <div className='h-full w-full flex items-center justify-center bg-[#efe2cd]'>
        <div className='rounded-xl border border-[#d8cab3] bg-[#fff8ec] px-4 py-3 text-center'>
          <p className='text-sm font-semibold text-[#2f2b27]'>Map unavailable on this device</p>
          <p className='mt-1 text-xs text-[#7f6952]'>WebGL is required to render the Life Map.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='relative h-full w-full overflow-hidden bg-[#efe2cd]'>
      <Suspense fallback={renderHexMapLoadingState()}>
        <LazyHexMap
          tiles={placedHexTiles}
          unplacedProjects={unplacedProjects}
          completedProjects={completedProjectsForPanel}
          archivedProjects={archivedProjectsForPanel}
          onPlaceProject={handlePlaceProjectOnMap}
          onRemovePlacedProject={handleRemoveProjectFromMap}
          onSelectUnplacedProject={projectId =>
            navigate(preserveStoreIdInUrl(generateRoute.project(projectId)))
          }
          onOpenProject={projectId =>
            navigate(preserveStoreIdInUrl(generateRoute.project(projectId)))
          }
          onUnarchiveProject={handleUnarchive}
        />
      </Suspense>
    </div>
  )
}
