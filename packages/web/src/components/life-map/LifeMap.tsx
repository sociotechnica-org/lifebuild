import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useStore } from '../../livestore-compat.js'
import { Link, useNavigate } from 'react-router-dom'
import {
  getProjectsByCategory$,
  getAllWorkerProjects$,
  getActiveBronzeStack$,
  getTabledBronzeProjects$,
  getAllTasks$,
  getTableConfiguration$,
  getProjects$,
  getAllProjectsIncludingArchived$,
  getHexPositions$,
  getUnplacedProjects$,
  getPlantedSystems$,
  getSystemHexPositions$,
  getUnplacedSystems$,
  getAllHexPositions$,
  getAllSystemTaskTemplates$,
} from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import { createHex } from '@lifebuild/shared/hex'
import type { HexCoord } from '@lifebuild/shared/hex'
import { PROJECT_CATEGORIES, resolveLifecycleState } from '@lifebuild/shared'
import { CategoryCard } from './CategoryCard.js'
import { generateRoute } from '../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'
import { useAuth } from '../../contexts/AuthContext.js'
import { usePostHog } from '../../lib/analytics.js'
import {
  placeProjectOnHex,
  placeSystemOnHex,
  removeProjectFromHex,
} from '../hex-map/hexPositionCommands.js'
import type { HexTileVisualState, HexTileWorkstream } from '../hex-map/HexTile.js'

/** 14 days in milliseconds for staleness detection. */
const STALENESS_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000

type LifeMapViewMode = 'map' | 'list'

const DESKTOP_BREAKPOINT_QUERY = '(min-width: 768px)'

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

const getDesktopMediaQueryList = (): MediaQueryList | null => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null
  }

  return window.matchMedia(DESKTOP_BREAKPOINT_QUERY)
}

const getInitialDesktopValue = () => {
  return getDesktopMediaQueryList()?.matches ?? false
}

const useIsDesktopViewport = () => {
  const [isDesktopViewport, setIsDesktopViewport] = useState(getInitialDesktopValue)

  useEffect(() => {
    const mediaQueryList = getDesktopMediaQueryList()
    if (!mediaQueryList) {
      return
    }
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktopViewport(event.matches)
    }

    setIsDesktopViewport(mediaQueryList.matches)
    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleChange)
    } else {
      mediaQueryList.addListener(handleChange)
    }

    return () => {
      if (typeof mediaQueryList.removeEventListener === 'function') {
        mediaQueryList.removeEventListener('change', handleChange)
      } else {
        mediaQueryList.removeListener(handleChange)
      }
    }
  }, [])

  return isDesktopViewport
}

const renderHexMapLoadingState = () => {
  return (
    <div className='h-full min-h-[520px] flex items-center justify-center bg-[#efe2cd]'>
      <div className='text-center'>
        <div className='text-sm font-semibold text-[#6f5b44]'>Loading map...</div>
      </div>
    </div>
  )
}

/**
 * Life Map - The overview of all eight life categories
 * Displays categories in a responsive grid with project/worker stats.
 *
 * Grid layout (2x4 on desktop):
 * Row 1: Health, Relationships, Finances, Growth
 * Row 2: Leisure, Spirituality, Home, Contribution
 */
export const LifeMap: React.FC = () => {
  const navigate = useNavigate()
  const { store } = useStore()
  const { user } = useAuth()
  const posthog = usePostHog()
  const actorId = user?.id
  const isDesktopViewport = useIsDesktopViewport()
  const [hasWebGLSupport] = useState(() => supportsWebGL())
  const [viewMode, setViewMode] = useState<LifeMapViewMode>('map')
  const [completedExpanded, setCompletedExpanded] = useState(false)
  const [archivedExpanded, setArchivedExpanded] = useState(false)

  useEffect(() => {
    posthog?.capture('life_map_viewed')
  }, [])

  useEffect(() => {
    if (!isDesktopViewport || !hasWebGLSupport) {
      setViewMode('list')
      return
    }

    setViewMode('map')
  }, [hasWebGLSupport, isDesktopViewport])

  const allWorkerProjects = useQuery(getAllWorkerProjects$) ?? []
  const activeBronzeStack = useQuery(getActiveBronzeStack$) ?? []
  const tabledBronzeProjects = useQuery(getTabledBronzeProjects$) ?? []
  const allTasks = useQuery(getAllTasks$) ?? []
  const tableConfiguration = useQuery(getTableConfiguration$) ?? []
  const tableConfig = tableConfiguration[0]
  const allProjects = useQuery(getProjects$) ?? []
  const allProjectsIncludingArchived = useQuery(getAllProjectsIncludingArchived$) ?? []
  const hexPositions = useQuery(getHexPositions$) ?? []
  const allHexPositions = useQuery(getAllHexPositions$) ?? []
  const unplacedProjectsFromQuery = useQuery(getUnplacedProjects$) ?? []
  const plantedSystems = useQuery(getPlantedSystems$) ?? []
  const systemHexPositions = useQuery(getSystemHexPositions$) ?? []
  const unplacedSystemsFromQuery = useQuery(getUnplacedSystems$) ?? []
  const allSystemTaskTemplates = useQuery(getAllSystemTaskTemplates$) ?? []

  // Query projects for each category.
  const healthProjects = useQuery(getProjectsByCategory$('health')) ?? []
  const relationshipsProjects = useQuery(getProjectsByCategory$('relationships')) ?? []
  const financesProjects = useQuery(getProjectsByCategory$('finances')) ?? []
  const growthProjects = useQuery(getProjectsByCategory$('growth')) ?? []
  const leisureProjects = useQuery(getProjectsByCategory$('leisure')) ?? []
  const spiritualityProjects = useQuery(getProjectsByCategory$('spirituality')) ?? []
  const homeProjects = useQuery(getProjectsByCategory$('home')) ?? []
  const contributionProjects = useQuery(getProjectsByCategory$('contribution')) ?? []

  // Create a map of category to projects.
  const categoryProjectsMap = useMemo(() => {
    return {
      health: healthProjects,
      relationships: relationshipsProjects,
      finances: financesProjects,
      growth: growthProjects,
      leisure: leisureProjects,
      spirituality: spiritualityProjects,
      home: homeProjects,
      contribution: contributionProjects,
    }
  }, [
    healthProjects,
    relationshipsProjects,
    financesProjects,
    growthProjects,
    leisureProjects,
    spiritualityProjects,
    homeProjects,
    contributionProjects,
  ])

  // Build a set of project IDs that are "active" (on the table).
  const activeProjectIds = useMemo(() => {
    const projectIds = new Set<string>()

    // Gold and Silver projects are active (they're "on the table").
    if (tableConfig?.goldProjectId) {
      projectIds.add(tableConfig.goldProjectId)
    }
    if (tableConfig?.silverProjectId) {
      projectIds.add(tableConfig.silverProjectId)
    }

    // PR1 Task Queue Redesign: Bronze projects that are tabled are active.
    tabledBronzeProjects.forEach(entry => {
      projectIds.add(entry.projectId)
    })

    // Legacy: Projects with tasks in the bronze stack are also active
    // (will be removed in PR2 when Task Queue is implemented).
    const taskIdToProjectId = new Map<string, string | null>()
    allTasks.forEach(task => {
      taskIdToProjectId.set(task.id, task.projectId)
    })

    activeBronzeStack.forEach(entry => {
      const projectId = taskIdToProjectId.get(entry.taskId)
      if (projectId) {
        projectIds.add(projectId)
      }
    })

    return projectIds
  }, [activeBronzeStack, tabledBronzeProjects, allTasks, tableConfig])

  // Calculate workers for each category.
  const categoryWorkersMap = useMemo(() => {
    const workersMap: Record<string, number> = {}
    PROJECT_CATEGORIES.forEach(category => {
      const projects = categoryProjectsMap[category.value as keyof typeof categoryProjectsMap] || []
      const projectIds = projects.map(project => project.id)
      const workerIds = new Set<string>()
      projectIds.forEach(projectId => {
        const projectWorkers = allWorkerProjects.filter(
          workerProject => workerProject.projectId === projectId
        )
        projectWorkers.forEach(workerProject => workerIds.add(workerProject.workerId))
      })
      workersMap[category.value] = workerIds.size
    })
    return workersMap
  }, [categoryProjectsMap, allWorkerProjects])

  // Build a map of projectId -> task completion percentage.
  const projectCompletionMap = useMemo(() => {
    const completionMap = new Map<string, number>()

    // Group tasks by project (excluding archived tasks for consistency with SortingRoom).
    const tasksByProject = new Map<string, (typeof allTasks)[number][]>()
    allTasks.forEach(task => {
      if (task.projectId && task.archivedAt === null) {
        const existing = tasksByProject.get(task.projectId) ?? []
        tasksByProject.set(task.projectId, [...existing, task])
      }
    })

    // Calculate completion for each project.
    tasksByProject.forEach((tasks, projectId) => {
      const totalTasks = tasks.length
      if (totalTasks === 0) {
        completionMap.set(projectId, 0)
        return
      }
      const completedTasks = tasks.filter(task => task.status === 'done').length
      const percentage = Math.round((completedTasks / totalTasks) * 100)
      completionMap.set(projectId, percentage)
    })

    return completionMap
  }, [allTasks])

  // Get completed projects.
  const completedProjects = useMemo(() => {
    return allProjects
      .filter(project => {
        const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)
        return lifecycle.status === 'completed'
      })
      .sort((projectA, projectB) => {
        // Sort by completion date, most recent first.
        const lifecycleA = resolveLifecycleState(projectA.projectLifecycleState, null)
        const lifecycleB = resolveLifecycleState(projectB.projectLifecycleState, null)
        return (lifecycleB.completedAt ?? 0) - (lifecycleA.completedAt ?? 0)
      })
  }, [allProjects])

  // Get archived projects (filter from all projects including archived).
  const archivedProjects = useMemo(() => {
    return allProjectsIncludingArchived
      .filter(project => project.archivedAt !== null)
      .sort((projectA, projectB) => {
        // Sort by archive date, most recent first.
        const projectADate = projectA.archivedAt ? new Date(projectA.archivedAt).getTime() : 0
        const projectBDate = projectB.archivedAt ? new Date(projectB.archivedAt).getTime() : 0
        return projectBDate - projectADate
      })
  }, [allProjectsIncludingArchived])

  // Handler for unarchiving a project.
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
      await placeProjectOnHex(store, hexPositions, {
        projectId,
        hexQ: coord.q,
        hexR: coord.r,
        actorId,
      })
    },
    [actorId, hexPositions, store]
  )

  const handleRemoveProjectFromMap = useCallback(
    async (projectId: string) => {
      await removeProjectFromHex(store, hexPositions, {
        projectId,
        actorId,
      })
    },
    [actorId, hexPositions, store]
  )

  const handlePlaceSystemOnMap = useCallback(
    async (systemId: string, coord: HexCoord) => {
      await placeSystemOnHex(store, allHexPositions, {
        systemId,
        hexQ: coord.q,
        hexR: coord.r,
        actorId,
      })
    },
    [actorId, allHexPositions, store]
  )

  /** Set of project IDs that have at least one non-done, non-archived task with a past deadline. */
  const overdueProjectIds = useMemo(() => {
    const now = Date.now()
    const ids = new Set<string>()
    allTasks.forEach(task => {
      if (!task.projectId || task.status === 'done' || task.archivedAt !== null) {
        return
      }
      const attributes = task.attributes as { deadline?: number } | null
      if (attributes?.deadline && attributes.deadline < now) {
        ids.add(task.projectId)
      }
    })
    return ids
  }, [allTasks])

  /** Set of system IDs that have at least one template with nextGenerateAt in the past. */
  const overdueSystemIds = useMemo(() => {
    const now = Date.now()
    const ids = new Set<string>()
    allSystemTaskTemplates.forEach(template => {
      if (template.nextGenerateAt) {
        const nextAt =
          template.nextGenerateAt instanceof Date
            ? template.nextGenerateAt.getTime()
            : Number(template.nextGenerateAt)
        if (nextAt < now) {
          ids.add(template.systemId)
        }
      }
    })
    return ids
  }, [allSystemTaskTemplates])

  const placedHexTiles = useMemo(() => {
    const projectsById = new Map(allProjects.map(project => [project.id, project]))
    const now = Date.now()

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

      const updatedAtMs =
        project.updatedAt instanceof Date ? project.updatedAt.getTime() : Number(project.updatedAt)
      const isStale = !isCompleted && now - updatedAtMs >= STALENESS_THRESHOLD_MS
      const isOverdue = !isCompleted && overdueProjectIds.has(project.id)

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
          isStale,
          isOverdue,
          onClick: isCompleted
            ? undefined
            : () => navigate(preserveStoreIdInUrl(generateRoute.project(project.id))),
        },
      ]
    })
  }, [activeProjectIds, allProjects, hexPositions, navigate, overdueProjectIds])

  const unplacedProjects = useMemo(() => {
    return unplacedProjectsFromQuery.map(project => ({
      id: project.id,
      name: project.name,
      category: project.category ?? null,
    }))
  }, [unplacedProjectsFromQuery])

  const placedSystemTiles = useMemo(() => {
    const systemsById = new Map(plantedSystems.map(system => [system.id, system]))
    const now = Date.now()

    return systemHexPositions.flatMap(position => {
      const system = systemsById.get(position.entityId)
      if (!system) {
        return []
      }

      const category = PROJECT_CATEGORIES.find(item => item.value === system.category)
      const updatedAtMs =
        system.updatedAt instanceof Date ? system.updatedAt.getTime() : Number(system.updatedAt)
      const isStale = now - updatedAtMs >= STALENESS_THRESHOLD_MS
      const isOverdue = overdueSystemIds.has(system.id)

      return [
        {
          id: position.id,
          systemId: system.id,
          coord: createHex(position.hexQ, position.hexR),
          systemName: system.name,
          category: system.category ?? null,
          categoryColor: category?.colorHex ?? '#8b8680',
          lifecycleState: system.lifecycleState as 'planted' | 'hibernating',
          isStale,
          isOverdue,
          onClick: () => navigate(preserveStoreIdInUrl(generateRoute.system(system.id))),
        },
      ]
    })
  }, [navigate, overdueSystemIds, plantedSystems, systemHexPositions])

  const unplacedSystems = useMemo(() => {
    return unplacedSystemsFromQuery.map(system => ({
      id: system.id,
      name: system.name,
      category: system.category ?? null,
    }))
  }, [unplacedSystemsFromQuery])

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

  // Group planted systems by category for the list view.
  const categorySystemsMap = useMemo(() => {
    const map: Record<string, (typeof plantedSystems)[number][]> = {}
    plantedSystems.forEach(system => {
      const cat = system.category ?? 'uncategorized'
      if (!map[cat]) {
        map[cat] = []
      }
      map[cat].push(system)
    })
    return map
  }, [plantedSystems])

  // Check if there are any categories with projects or systems.
  const categoriesWithContent = PROJECT_CATEGORIES.filter(category => {
    const projects = categoryProjectsMap[category.value as keyof typeof categoryProjectsMap] || []
    const systems = categorySystemsMap[category.value] || []
    return projects.length > 0 || systems.length > 0
  })

  const hasNoProjects = categoriesWithContent.length === 0
  const hasSystems = plantedSystems.length > 0 || unplacedSystemsFromQuery.length > 0
  const hasContent = !hasNoProjects || hasSystems
  const canRenderHexMap = isDesktopViewport && hasWebGLSupport
  const canShowViewModeToggle = canRenderHexMap && hasContent
  const shouldRenderHexMap = canShowViewModeToggle && viewMode === 'map'

  const renderCategoryCardLayout = () => {
    if (!hasContent) {
      return (
        <div className='flex min-h-[calc(100vh-300px)] items-center justify-center'>
          <div className='text-center'>
            <p className='mb-4 text-lg text-gray-500'>No projects yet</p>
            <Link
              to={generateRoute.draftingRoom()}
              className='py-2.5 px-4 rounded-lg text-sm font-semibold bg-[#2f2b27] text-[#faf9f7] no-underline inline-block'
            >
              Go to Drafting Room to create projects
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className='bg-white rounded-2xl p-4 border border-[#e8e4de]'>
        <div className='grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4'>
          {categoriesWithContent.map(category => {
            const projects =
              categoryProjectsMap[category.value as keyof typeof categoryProjectsMap] || []
            const categorySystems = (categorySystemsMap[category.value] || []).map(s => ({
              id: s.id,
              name: s.name,
              lifecycleState: s.lifecycleState as 'planted' | 'hibernating',
            }))
            const workers = categoryWorkersMap[category.value] || 0

            // Split projects based on lifecycle status:
            // - Active: projects that are on the table OR have bronze tasks (already filtered by activeProjectIds)
            // - Ongoing: projects with status='active' but NOT currently on the table
            // - Backlog: projects with status='backlog'
            const activeProjects = projects.filter(project => activeProjectIds.has(project.id))

            // For ongoing, show active-status projects that aren't currently on the table.
            const ongoingProjects = projects.filter(project => {
              if (activeProjectIds.has(project.id)) return false
              const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)
              return lifecycle.status === 'active'
            })

            // Count backlog projects (status='backlog', stage 4, gold/silver stream only - matches SortingRoom).
            // Bronze-stream projects don't appear as projects in SortingRoom (only their tasks show).
            const backlogProjects = projects.filter(project => {
              const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)
              return (
                lifecycle.status === 'backlog' &&
                lifecycle.stage === 4 &&
                (lifecycle.stream === 'gold' || lifecycle.stream === 'silver')
              )
            })

            // Count planning projects (status='planning' OR 'backlog' in stages 1-3 - matches DraftingRoom filter).
            const planningProjects = projects.filter(project => {
              const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)
              return (
                (lifecycle.status === 'planning' || lifecycle.status === 'backlog') &&
                lifecycle.stage >= 1 &&
                lifecycle.stage <= 3
              )
            })

            return (
              <CategoryCard
                key={category.value}
                categoryValue={category.value}
                categoryName={category.name}
                categoryIcon={category.icon}
                categoryColor={category.colorHex}
                projectCount={projects.length}
                workerCount={workers}
                activeProjects={activeProjects}
                ongoingProjects={ongoingProjects}
                backlogCount={backlogProjects.length}
                planningCount={planningProjects.length}
                projectCompletionMap={projectCompletionMap}
                systems={categorySystems}
              />
            )
          })}
        </div>

        {/* Completed Projects Section */}
        {completedProjects.length > 0 && (
          <div className='mt-4 border border-[#e8e4de] rounded-xl overflow-hidden'>
            <button
              type='button'
              className='w-full flex items-center justify-between p-4 bg-[#faf9f7] hover:bg-[#f5f3f0] transition-colors cursor-pointer border-none text-left'
              onClick={() => setCompletedExpanded(!completedExpanded)}
            >
              <div className='flex items-center gap-2'>
                <span className='text-sm font-semibold text-[#2f2b27]'>
                  Completed ({completedProjects.length})
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-[#8b8680] transition-transform ${completedExpanded ? 'rotate-180' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>

            {completedExpanded && (
              <div className='bg-white divide-y divide-[#e8e4de]'>
                {completedProjects.map(project => {
                  const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)
                  const completedDate = lifecycle.completedAt
                    ? new Date(lifecycle.completedAt).toLocaleDateString()
                    : null
                  const category = PROJECT_CATEGORIES.find(item => item.value === project.category)

                  return (
                    <div
                      key={project.id}
                      className='flex items-center justify-between p-4 hover:bg-[#faf9f7] cursor-pointer transition-colors'
                      onClick={() =>
                        navigate(preserveStoreIdInUrl(generateRoute.project(project.id)))
                      }
                    >
                      <div className='flex items-center gap-3'>
                        {category && (
                          <span
                            className='w-2 h-2 rounded-full flex-shrink-0'
                            style={{ backgroundColor: category.colorHex }}
                          />
                        )}
                        <div>
                          <div className='text-sm font-medium text-[#2f2b27]'>{project.name}</div>
                          <div className='text-xs text-[#8b8680]'>
                            {category?.name}
                            {completedDate && ` · Completed ${completedDate}`}
                          </div>
                        </div>
                      </div>
                      <svg
                        className='w-5 h-5 text-green-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Archived Projects Section */}
        {archivedProjects.length > 0 && (
          <div className='mt-4 border border-[#e8e4de] rounded-xl overflow-hidden'>
            <button
              type='button'
              className='w-full flex items-center justify-between p-4 bg-[#faf9f7] hover:bg-[#f5f3f0] transition-colors cursor-pointer border-none text-left'
              onClick={() => setArchivedExpanded(!archivedExpanded)}
            >
              <div className='flex items-center gap-2'>
                <span className='text-sm font-semibold text-[#2f2b27]'>
                  Archived ({archivedProjects.length})
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-[#8b8680] transition-transform ${archivedExpanded ? 'rotate-180' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>

            {archivedExpanded && (
              <div className='bg-white divide-y divide-[#e8e4de]'>
                {archivedProjects.map(project => {
                  const archivedDate = project.archivedAt
                    ? new Date(project.archivedAt).toLocaleDateString()
                    : null
                  const category = PROJECT_CATEGORIES.find(item => item.value === project.category)

                  return (
                    <div
                      key={project.id}
                      className='flex items-center justify-between p-4 hover:bg-[#faf9f7] cursor-pointer transition-colors'
                      onClick={() =>
                        navigate(preserveStoreIdInUrl(generateRoute.project(project.id)))
                      }
                    >
                      <div className='flex items-center gap-3'>
                        {category && (
                          <span
                            className='w-2 h-2 rounded-full flex-shrink-0'
                            style={{ backgroundColor: category.colorHex }}
                          />
                        )}
                        <div>
                          <div className='text-sm font-medium text-[#2f2b27]'>{project.name}</div>
                          <div className='text-xs text-[#8b8680]'>
                            {category?.name}
                            {archivedDate && ` · Archived ${archivedDate}`}
                          </div>
                        </div>
                      </div>
                      <button
                        type='button'
                        className='text-xs py-1.5 px-3 rounded-lg bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27]'
                        onClick={event => {
                          event.stopPropagation()
                          handleUnarchive(project.id)
                        }}
                      >
                        Unarchive
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='relative h-full'>
      {canShowViewModeToggle && (
        <div className='pointer-events-none absolute top-2 left-1/2 z-[3] -translate-x-1/2'>
          <div className='pointer-events-auto inline-flex items-center gap-1 rounded-full border border-[#d8cab3] bg-[#faf4e9]/90 p-1 shadow-sm backdrop-blur-sm'>
            <button
              type='button'
              className={`rounded-full border-none px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === 'map'
                  ? 'bg-[#2f2b27] text-[#faf9f7]'
                  : 'bg-transparent text-[#7f6952] hover:bg-[#f0e3cf]'
              }`}
              onClick={() => setViewMode('map')}
            >
              Map
            </button>
            <button
              type='button'
              className={`rounded-full border-none px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#2f2b27] text-[#faf9f7]'
                  : 'bg-transparent text-[#7f6952] hover:bg-[#f0e3cf]'
              }`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
      )}

      {shouldRenderHexMap ? (
        <div className='absolute -inset-3.5 min-h-[520px] overflow-hidden bg-[#efe2cd]'>
          <Suspense fallback={renderHexMapLoadingState()}>
            <LazyHexMap
              tiles={placedHexTiles}
              systemTiles={placedSystemTiles}
              unplacedProjects={unplacedProjects}
              unplacedSystems={unplacedSystems}
              completedProjects={completedProjectsForPanel}
              archivedProjects={archivedProjectsForPanel}
              onPlaceProject={handlePlaceProjectOnMap}
              onPlaceSystem={handlePlaceSystemOnMap}
              onRemovePlacedProject={handleRemoveProjectFromMap}
              onSelectUnplacedProject={projectId =>
                navigate(preserveStoreIdInUrl(generateRoute.project(projectId)))
              }
              onOpenProject={projectId =>
                navigate(preserveStoreIdInUrl(generateRoute.project(projectId)))
              }
              onOpenSystem={sysId => navigate(preserveStoreIdInUrl(generateRoute.system(sysId)))}
              onUnarchiveProject={handleUnarchive}
            />
          </Suspense>
        </div>
      ) : (
        <div className={canShowViewModeToggle ? 'pt-12' : ''}>{renderCategoryCardLayout()}</div>
      )}
    </div>
  )
}
