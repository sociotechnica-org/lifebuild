import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useStore } from '../../livestore-compat.js'
import { useNavigate } from 'react-router-dom'
import {
  getProjects$,
  getAllProjectsIncludingArchived$,
  getHexPositions$,
  getProjectById$,
  getUnplacedProjects$,
} from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import { createHex } from '@lifebuild/shared/hex'
import type { HexCoord } from '@lifebuild/shared/hex'
import { type ProjectCategory, PROJECT_CATEGORIES, resolveLifecycleState } from '@lifebuild/shared'
import { generateRoute, ROUTES } from '../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'
import { useAuth } from '../../contexts/AuthContext.js'
import { usePostHog } from '../../lib/analytics.js'
import { placeProjectOnHex, removeProjectFromHex } from '../hex-map/hexPositionCommands.js'
import type { HexTileVisualState, HexTileWorkstream } from '../hex-map/HexTile.js'
import { OnboardingSequence } from '../onboarding/OnboardingSequence.js'
import { useOnboarding } from '../onboarding/useOnboarding.js'

type SeedLifecycleStatus = 'planning' | 'backlog' | 'active' | 'completed'

type SeedProjectOnMapInput = {
  projectId: string
  name: string
  description?: string
  category?: ProjectCategory | null
  lifecycleStatus?: SeedLifecycleStatus
}

type SeedOnboardingProjectInput = {
  projectId?: string
  name: string
  description?: string
  category?: ProjectCategory | null
  taskCount?: number
}

type SeedProjectPlacementInput = SeedProjectOnMapInput & {
  coord: {
    q: number
    r: number
  }
}

type E2ELifeMapHooks = {
  seedProjectOnMap: (input: SeedProjectPlacementInput) => Promise<void>
  seedUnplacedProject: (input: SeedProjectOnMapInput) => Promise<void>
  seedOnboardingProjectWithTasks: (input: SeedOnboardingProjectInput) => Promise<string>
}

declare global {
  interface Window {
    __LIFEBUILD_E2E__?: E2ELifeMapHooks
  }
}

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

const createSeedLifecycleState = (status: SeedLifecycleStatus) => {
  const now = Date.now()

  switch (status) {
    case 'completed':
      return { status: 'completed' as const, stage: 4 as const, completedAt: now }
    case 'active':
      return { status: 'active' as const, stage: 4 as const, stream: 'bronze' as const }
    case 'backlog':
      return { status: 'backlog' as const, stage: 3 as const, stream: 'bronze' as const }
    case 'planning':
    default:
      return { status: 'planning' as const, stage: 1 as const }
  }
}

/**
 * Life Map renders the full-bleed hex map as the primary surface.
 */
type LifeMapProps = {
  isOverlayOpen?: boolean
}

export const LifeMap: React.FC<LifeMapProps> = ({ isOverlayOpen = false }) => {
  const navigate = useNavigate()
  const { store } = useStore()
  const { user } = useAuth()
  const posthog = usePostHog()
  const actorId = user?.id
  const [hasWebGLSupport] = useState(() => supportsWebGL())
  const onboarding = useOnboarding()

  useEffect(() => {
    posthog?.capture('life_map_viewed')
  }, [posthog])

  useEffect(() => {
    if (import.meta.env.VITE_E2E_TEST_HOOKS !== 'true' || typeof window === 'undefined') {
      return
    }

    const seedUnplacedProject: E2ELifeMapHooks['seedUnplacedProject'] = async ({
      projectId,
      name,
      description,
      category,
      lifecycleStatus,
    }) => {
      const existingProject = await store.query(getProjectById$(projectId))
      if (!existingProject || existingProject.length === 0) {
        await store.commit(
          events.projectCreatedV2({
            id: projectId,
            name,
            description,
            category: category ?? undefined,
            createdAt: new Date(),
            actorId,
          })
        )
      }

      if (lifecycleStatus) {
        await store.commit(
          events.projectLifecycleUpdated({
            projectId,
            lifecycleState: createSeedLifecycleState(lifecycleStatus),
            updatedAt: new Date(),
            actorId,
          })
        )
      }

      const latestHexPositions = await store.query(getHexPositions$)
      const existingPlacement = latestHexPositions.find(
        position => position.entityType === 'project' && position.entityId === projectId
      )

      if (existingPlacement) {
        await removeProjectFromHex(store, latestHexPositions, { projectId, actorId })
      }
    }

    const seedProjectOnMap: E2ELifeMapHooks['seedProjectOnMap'] = async ({ coord, ...project }) => {
      await seedUnplacedProject(project)

      const latestHexPositions = await store.query(getHexPositions$)

      await placeProjectOnHex(store, latestHexPositions, {
        projectId: project.projectId,
        hexQ: coord.q,
        hexR: coord.r,
        actorId,
      })
    }

    const seedOnboardingProjectWithTasks: E2ELifeMapHooks['seedOnboardingProjectWithTasks'] =
      async ({ projectId, name, description, category, taskCount = 3 }) => {
        const resolvedProjectId = projectId ?? `onboarding-${crypto.randomUUID()}`

        await seedUnplacedProject({
          projectId: resolvedProjectId,
          name,
          description,
          category,
          lifecycleStatus: 'planning',
        })

        const normalizedTaskCount = Math.max(1, taskCount)
        for (let index = 0; index < normalizedTaskCount; index += 1) {
          await store.commit(
            events.taskCreatedV2({
              id: crypto.randomUUID(),
              projectId: resolvedProjectId,
              title: `Starter task ${index + 1}`,
              description: `Seeded onboarding task ${index + 1}`,
              assigneeIds: undefined,
              status: 'todo',
              position: (index + 1) * 1000,
              createdAt: new Date(),
              actorId,
            })
          )
        }

        return resolvedProjectId
      }

    window.__LIFEBUILD_E2E__ = {
      ...window.__LIFEBUILD_E2E__,
      seedProjectOnMap,
      seedUnplacedProject,
      seedOnboardingProjectWithTasks,
    }
  }, [actorId, store])

  const allProjects = useQuery(getProjects$) ?? []
  const allProjectsIncludingArchived = useQuery(getAllProjectsIncludingArchived$) ?? []
  const hexPositions = useQuery(getHexPositions$) ?? []
  const unplacedProjectsFromQuery = useQuery(getUnplacedProjects$) ?? []

  const navigateToOverlayRoute = useCallback(
    (path: string) => {
      navigate(preserveStoreIdInUrl(path), { state: { openedFromMap: true } })
    },
    [navigate]
  )

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
    const projectsById = new Map(allProjectsIncludingArchived.map(project => [project.id, project]))

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
      const isArchived = project.archivedAt !== null
      const isCompleted = lifecycle.status === 'completed' || isArchived
      const isWorkAtHand = !isCompleted && activeProjectIds.has(project.id)

      const visualState: HexTileVisualState = isCompleted
        ? 'completed'
        : lifecycle.status === 'planning' || lifecycle.status === 'backlog'
          ? 'planning'
          : isWorkAtHand
            ? 'work-at-hand'
            : 'active'

      const workstream: HexTileWorkstream =
        lifecycle.stream === 'gold' ||
        lifecycle.stream === 'silver' ||
        lifecycle.stream === 'bronze'
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
          isArchived,
          onClick: () => navigateToOverlayRoute(generateRoute.project(project.id)),
        },
      ]
    })
  }, [activeProjectIds, allProjectsIncludingArchived, hexPositions, navigateToOverlayRoute])

  const isCampfireBeat = onboarding.isReady && onboarding.phase === 'campfire'
  const isRevealBeat = onboarding.isReady && onboarding.phase === 'reveal'
  const isFirstProjectBeat = onboarding.isReady && onboarding.phase === 'first_project'
  const shouldScaleMap = isCampfireBeat
  const shouldHideMapPanels = onboarding.isActive && (isCampfireBeat || isRevealBeat)
  const disableLandmarkInteractions = onboarding.isActive && (isCampfireBeat || isRevealBeat)

  // R3F Canvas uses getBoundingClientRect() on mount but ResizeObserver doesn't
  // fire for CSS transform changes. When the scale transition ends, dispatch a
  // resize event so the Three.js canvas recalculates its dimensions.
  useEffect(() => {
    if (shouldScaleMap) return
    // Wait for the 700ms CSS transition to finish, then nudge R3F.
    const id = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 750)
    return () => window.clearTimeout(id)
  }, [shouldScaleMap])

  const placedHexTilesWithOnboarding = useMemo(() => {
    const allowProjectClicks =
      !onboarding.isActive ||
      onboarding.phase === 'completed' ||
      onboarding.phase === 'first_project'

    return placedHexTiles.map(tile => {
      if (!tile.onClick) {
        return tile
      }

      if (!allowProjectClicks) {
        return { ...tile, onClick: undefined }
      }

      if (
        isFirstProjectBeat &&
        onboarding.firstProjectId &&
        tile.projectId !== onboarding.firstProjectId
      ) {
        return { ...tile, onClick: undefined }
      }

      return tile
    })
  }, [
    isFirstProjectBeat,
    onboarding.firstProjectId,
    onboarding.isActive,
    onboarding.phase,
    placedHexTiles,
  ])

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
      <div
        className={`h-full w-full transition-transform duration-700 ${
          shouldScaleMap ? 'scale-[0.82]' : 'scale-100'
        }`}
      >
        <Suspense fallback={renderHexMapLoadingState()}>
          <LazyHexMap
            tiles={placedHexTilesWithOnboarding}
            unplacedProjects={unplacedProjects}
            completedProjects={completedProjectsForPanel}
            archivedProjects={archivedProjectsForPanel}
            onPlaceProject={handlePlaceProjectOnMap}
            onRemovePlacedProject={handleRemoveProjectFromMap}
            onSelectUnplacedProject={projectId =>
              navigateToOverlayRoute(generateRoute.project(projectId))
            }
            onOpenProject={projectId => navigateToOverlayRoute(generateRoute.project(projectId))}
            onOpenWorkshop={() => navigateToOverlayRoute(ROUTES.WORKSHOP)}
            onOpenSanctuary={() => navigateToOverlayRoute(ROUTES.SANCTUARY)}
            onUnarchiveProject={handleUnarchive}
            isOverlayOpen={isOverlayOpen}
            showUnplacedPanel={!shouldHideMapPanels}
            disableLandmarkInteractions={disableLandmarkInteractions}
          />
        </Suspense>
      </div>
      <OnboardingSequence />
    </div>
  )
}
