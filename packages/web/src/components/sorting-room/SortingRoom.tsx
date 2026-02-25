import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useStore } from '../../livestore-compat.js'
import { getProjects$, getAllTasks$ } from '@lifebuild/shared/queries'
import { SystemBoardSection } from '../system-board/SystemBoard.js'
import { generateRoute } from '../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'
import {
  resolveLifecycleState,
  type ProjectLifecycleState,
  PROJECT_CATEGORIES,
  type ProjectCategory,
} from '@lifebuild/shared'
import type { Project, Task } from '@lifebuild/shared/schema'
import { events } from '@lifebuild/shared/schema'
import { useTableState } from '../../hooks/useTableState.js'
import { useAuth } from '../../contexts/AuthContext.js'
import { GoldSilverPanel } from './GoldSilverPanel.js'
import { BronzePanel } from './BronzePanel.js'
import { usePostHog } from '../../lib/analytics.js'

export type Stream = 'gold' | 'silver' | 'bronze'

interface StreamSummary {
  stream: Stream
  label: string
  tabledName: string | null
  tabledMeta: string | null
  queueCount: number
}

function getLifecycleState(project: Project): ProjectLifecycleState {
  return resolveLifecycleState(project.projectLifecycleState, null)
}

/**
 * Check if a project has any tasks with progress (status !== 'todo')
 */
function projectHasProgress(projectId: string, tasks: readonly Task[]): boolean {
  return tasks.some(
    task => task.projectId === projectId && task.archivedAt === null && task.status !== 'todo'
  )
}

/**
 * Check if all tasks for a project are done (vacuously true for projects with no tasks)
 */
function projectAllTasksDone(projectId: string, tasks: readonly Task[]): boolean {
  const projectTasks = tasks.filter(
    task => task.projectId === projectId && task.archivedAt === null
  )
  return projectTasks.every(task => task.status === 'done')
}

/**
 * Get the most recent activity timestamp for a project (from tasks)
 */
function getLastActivityTime(projectId: string, tasks: readonly Task[]): number {
  const projectTasks = tasks.filter(t => t.projectId === projectId && t.archivedAt === null)
  if (projectTasks.length === 0) return 0

  return Math.max(
    ...projectTasks.map(t => {
      const updated = t.updatedAt ? new Date(t.updatedAt).getTime() : 0
      const created = t.createdAt ? new Date(t.createdAt).getTime() : 0
      return Math.max(updated, created)
    })
  )
}

/**
 * SortingRoom - The main Sorting Room component
 *
 * Displays three stream tabs (Gold, Silver, Bronze) that can be expanded
 * to show and manage queued projects/tasks with drag-and-drop reordering.
 */
// Category filter options
const CATEGORY_FILTERS: { value: ProjectCategory | 'all'; label: string; colorHex?: string }[] = [
  { value: 'all', label: 'All' },
  ...PROJECT_CATEGORIES.map(c => ({ value: c.value, label: c.name, colorHex: c.colorHex })),
]

const getStreamDotClass = (stream: Stream): string => {
  const colors: Record<Stream, string> = {
    gold: 'bg-[#d8a650]',
    silver: 'bg-[#c5ced8]',
    bronze: 'bg-[#c48b5a]',
  }
  return `w-3 h-3 rounded-full ${colors[stream]}`
}

export const SortingRoom: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { stream: streamParam } = useParams<{ stream?: string }>()
  const navigate = useNavigate()
  const posthog = usePostHog()
  const [draggedGoldProject, setDraggedGoldProject] = useState<Project | null>(null)
  const [draggedSilverProject, setDraggedSilverProject] = useState<Project | null>(null)

  useEffect(() => {
    posthog?.capture('sorting_room_viewed')
  }, [])

  // Derive expanded stream from URL param (single source of truth)
  const expandedStream: Stream | null =
    streamParam === 'gold' || streamParam === 'silver' || streamParam === 'bronze'
      ? streamParam
      : null

  // Derive category filter directly from URL (single source of truth)
  const categoryFromUrl = searchParams.get('category') as ProjectCategory | null
  const categoryFilter: ProjectCategory | 'all' =
    categoryFromUrl && PROJECT_CATEGORIES.some(c => c.value === categoryFromUrl)
      ? categoryFromUrl
      : 'all'

  // Update URL when category filter changes (called by UI handlers)
  const setCategoryFilter = (value: ProjectCategory | 'all') => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'all') {
      newParams.delete('category')
    } else {
      newParams.set('category', value)
    }
    setSearchParams(newParams, { replace: true })
  }

  const allProjects = (useQuery(getProjects$) ?? []) as Project[]
  const allTasks = (useQuery(getAllTasks$) ?? []) as Task[]
  const {
    configuration,
    tabledBronzeProjects,
    initializeConfiguration,
    assignGold,
    assignSilver,
    clearGold,
    clearSilver,
    tableBronzeProject,
    removeBronzeProject,
    reorderBronzeProjects,
  } = useTableState()
  const { store } = useStore()
  const { user } = useAuth()
  const actorId = user?.id

  // Filter and sort backlog projects (Stage 4, backlog status, sorted by queuePosition)
  // Exclude projects that are currently on the table
  // Apply category filter if set
  const backlogProjectsByStream = useMemo(() => {
    const stage4Projects = allProjects.filter(project => {
      const lifecycle = getLifecycleState(project)
      if (lifecycle.status !== 'backlog' || lifecycle.stage !== 4) return false
      // Apply category filter
      if (categoryFilter !== 'all' && project.category !== categoryFilter) return false
      return true
    })

    const goldProjects = stage4Projects
      .filter(p => getLifecycleState(p).stream === 'gold' && p.id !== configuration?.goldProjectId)
      .sort((a, b) => {
        const aPos = getLifecycleState(a).queuePosition ?? 999
        const bPos = getLifecycleState(b).queuePosition ?? 999
        return aPos - bPos
      })

    const silverProjects = stage4Projects
      .filter(
        p => getLifecycleState(p).stream === 'silver' && p.id !== configuration?.silverProjectId
      )
      .sort((a, b) => {
        const aPos = getLifecycleState(a).queuePosition ?? 999
        const bPos = getLifecycleState(b).queuePosition ?? 999
        return aPos - bPos
      })

    // Bronze projects: backlog bronze-stream projects
    const bronzeProjects = stage4Projects
      .filter(p => getLifecycleState(p).stream === 'bronze')
      .sort((a, b) => {
        const aPos = getLifecycleState(a).queuePosition ?? 999
        const bPos = getLifecycleState(b).queuePosition ?? 999
        return aPos - bPos
      })

    return { gold: goldProjects, silver: silverProjects, bronze: bronzeProjects }
  }, [allProjects, configuration?.goldProjectId, configuration?.silverProjectId, categoryFilter])

  // Filter and sort active projects by stream (sorted by last activity time)
  // Exclude projects that are currently on the table
  // Apply category filter if set
  const activeProjectsByStream = useMemo(() => {
    const activeProjects = allProjects.filter(project => {
      const lifecycle = getLifecycleState(project)
      if (lifecycle.status !== 'active') return false
      // Apply category filter
      if (categoryFilter !== 'all' && project.category !== categoryFilter) return false
      return true
    })

    const goldProjects = activeProjects
      .filter(p => getLifecycleState(p).stream === 'gold' && p.id !== configuration?.goldProjectId)
      .sort((a, b) => getLastActivityTime(b.id, allTasks) - getLastActivityTime(a.id, allTasks))

    const silverProjects = activeProjects
      .filter(
        p => getLifecycleState(p).stream === 'silver' && p.id !== configuration?.silverProjectId
      )
      .sort((a, b) => getLastActivityTime(b.id, allTasks) - getLastActivityTime(a.id, allTasks))

    return { gold: goldProjects, silver: silverProjects }
  }, [
    allProjects,
    allTasks,
    configuration?.goldProjectId,
    configuration?.silverProjectId,
    categoryFilter,
  ])

  // Get eligible bronze tasks:
  // - Orphaned tasks (no projectId)
  // - Tasks from bronze-stream projects (backlog OR active)
  // - Tasks from active projects (any stream) that are NOT the tabled gold/silver projects
  // PR1 Task Queue Redesign: Compute available bronze projects (not yet tabled)
  const tabledBronzeProjectIds = useMemo(
    () => new Set(tabledBronzeProjects.map(entry => entry.projectId)),
    [tabledBronzeProjects]
  )

  const availableBronzeProjects = useMemo(
    () => backlogProjectsByStream.bronze.filter(p => !tabledBronzeProjectIds.has(p.id)),
    [backlogProjectsByStream.bronze, tabledBronzeProjectIds]
  )

  // Get top tabled bronze project for summary
  // Find the first tabled project that still exists in allProjects (skip orphan entries)
  const topTabledBronzeProject = useMemo(() => {
    for (const entry of tabledBronzeProjects) {
      const project = allProjects.find(p => p.id === entry.projectId)
      if (project) return project
    }
    return null
  }, [tabledBronzeProjects, allProjects])

  // Get count of valid (non-orphan) tabled bronze projects for consistent display
  const validTabledBronzeCount = useMemo(
    () => tabledBronzeProjects.filter(e => allProjects.some(p => p.id === e.projectId)).length,
    [tabledBronzeProjects, allProjects]
  )

  // Get tabled projects for Gold/Silver
  const goldProject = useMemo(
    () => allProjects.find(p => p.id === configuration?.goldProjectId) ?? null,
    [allProjects, configuration?.goldProjectId]
  )

  const silverProject = useMemo(
    () => allProjects.find(p => p.id === configuration?.silverProjectId) ?? null,
    [allProjects, configuration?.silverProjectId]
  )

  // Check if tabled projects have progress
  const goldProjectHasProgress = useMemo(
    () => (goldProject ? projectHasProgress(goldProject.id, allTasks) : false),
    [goldProject, allTasks]
  )

  const silverProjectHasProgress = useMemo(
    () => (silverProject ? projectHasProgress(silverProject.id, allTasks) : false),
    [silverProject, allTasks]
  )

  // Check if all tasks are done for tabled projects
  const goldProjectAllTasksDone = useMemo(
    () => (goldProject ? projectAllTasksDone(goldProject.id, allTasks) : false),
    [goldProject, allTasks]
  )

  const silverProjectAllTasksDone = useMemo(
    () => (silverProject ? projectAllTasksDone(silverProject.id, allTasks) : false),
    [silverProject, allTasks]
  )

  // Calculate completion percentage for tabled projects
  const getProjectCompletionPercentage = useCallback(
    (projectId: string): number => {
      const projectTasks = allTasks.filter(t => t.projectId === projectId && t.archivedAt === null)
      if (projectTasks.length === 0) return 0
      const completedTasks = projectTasks.filter(t => t.status === 'done').length
      return Math.round((completedTasks / projectTasks.length) * 100)
    },
    [allTasks]
  )

  const goldProjectCompletionPercentage = useMemo(
    () => (goldProject ? getProjectCompletionPercentage(goldProject.id) : 0),
    [goldProject, getProjectCompletionPercentage]
  )

  const silverProjectCompletionPercentage = useMemo(
    () => (silverProject ? getProjectCompletionPercentage(silverProject.id) : 0),
    [silverProject, getProjectCompletionPercentage]
  )

  // Build stream summaries for collapsed view
  const streamSummaries: StreamSummary[] = [
    {
      stream: 'gold',
      label: 'Initiative',
      tabledName: goldProject?.name ?? null,
      tabledMeta: goldProject?.category ?? null,
      queueCount: backlogProjectsByStream.gold.length,
    },
    {
      stream: 'silver',
      label: 'Optimization',
      tabledName: silverProject?.name ?? null,
      tabledMeta: silverProject?.category ?? null,
      queueCount: backlogProjectsByStream.silver.length,
    },
    {
      stream: 'bronze',
      label: 'To-Do',
      tabledName: topTabledBronzeProject?.name ?? null,
      tabledMeta: validTabledBronzeCount > 1 ? `+${validTabledBronzeCount - 1} more` : null,
      queueCount: availableBronzeProjects.length,
    },
  ]

  const handleTabClick = (stream: Stream) => {
    // Toggle: if clicking the already-expanded stream, collapse it
    // Otherwise, expand the clicked stream
    const newStream = expandedStream === stream ? undefined : stream
    if (newStream) {
      posthog?.capture('sorting_room_stream_switched', { stream: newStream })
    }
    // Preserve category filter when toggling streams
    const baseUrl = preserveStoreIdInUrl(generateRoute.sortingRoom(newStream))
    const categoryParam = searchParams.get('category')
    const urlWithCategory = categoryParam
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}category=${categoryParam}`
      : baseUrl
    navigate(urlWithCategory)
  }

  /**
   * Handle the outgoing project when a new project is activated
   * - If project has progress (tasks not in 'todo'), keep it active
   * - If project has no progress, move it back to backlog
   */
  const handleOutgoingProject = useCallback(
    (outgoingProject: Project, hasProgress: boolean, _stream: 'gold' | 'silver') => {
      const currentLifecycle = getLifecycleState(outgoingProject)

      if (hasProgress) {
        // Keep active, just clear the slot
        store.commit(
          events.projectLifecycleUpdated({
            projectId: outgoingProject.id,
            lifecycleState: {
              ...currentLifecycle,
              slot: undefined,
            },
            updatedAt: new Date(),
            actorId,
          })
        )
      } else {
        // Move back to backlog at top of queue
        store.commit(
          events.projectLifecycleUpdated({
            projectId: outgoingProject.id,
            lifecycleState: {
              ...currentLifecycle,
              status: 'backlog',
              slot: undefined,
              queuePosition: 0,
            },
            updatedAt: new Date(),
            actorId,
          })
        )
      }
    },
    [store, actorId]
  )

  // Handler for activating a project to the table
  const handleActivateGold = useCallback(
    async (project: Project) => {
      // Handle outgoing project first
      if (goldProject) {
        handleOutgoingProject(goldProject, goldProjectHasProgress, 'gold')
      }

      // Update incoming project lifecycle to active with gold slot
      const currentLifecycle = getLifecycleState(project)
      store.commit(
        events.projectLifecycleUpdated({
          projectId: project.id,
          lifecycleState: {
            ...currentLifecycle,
            status: 'active',
            slot: 'gold',
          },
          updatedAt: new Date(),
          actorId,
        })
      )

      // If configuration doesn't exist, initialize with this project
      // Otherwise, assign to existing configuration
      if (!configuration) {
        await initializeConfiguration({ goldProjectId: project.id })
      } else {
        await assignGold(project.id)
      }
    },
    [
      store,
      actorId,
      assignGold,
      configuration,
      initializeConfiguration,
      goldProject,
      goldProjectHasProgress,
      handleOutgoingProject,
    ]
  )

  const handleActivateSilver = useCallback(
    async (project: Project) => {
      // Handle outgoing project first
      if (silverProject) {
        handleOutgoingProject(silverProject, silverProjectHasProgress, 'silver')
      }

      // Update incoming project lifecycle to active with silver slot
      const currentLifecycle = getLifecycleState(project)
      store.commit(
        events.projectLifecycleUpdated({
          projectId: project.id,
          lifecycleState: {
            ...currentLifecycle,
            status: 'active',
            slot: 'silver',
          },
          updatedAt: new Date(),
          actorId,
        })
      )

      // If configuration doesn't exist, initialize with this project
      // Otherwise, assign to existing configuration
      if (!configuration) {
        await initializeConfiguration({ silverProjectId: project.id })
      } else {
        await assignSilver(project.id)
      }
    },
    [
      store,
      actorId,
      assignSilver,
      configuration,
      initializeConfiguration,
      silverProject,
      silverProjectHasProgress,
      handleOutgoingProject,
    ]
  )

  // Handler for releasing a project from the table (without replacement)
  const handleReleaseGold = useCallback(async () => {
    if (!configuration) return
    if (goldProject) {
      handleOutgoingProject(goldProject, goldProjectHasProgress, 'gold')
    }
    await clearGold()
  }, [goldProject, goldProjectHasProgress, clearGold, configuration, handleOutgoingProject])

  const handleReleaseSilver = useCallback(async () => {
    if (!configuration) return
    if (silverProject) {
      handleOutgoingProject(silverProject, silverProjectHasProgress, 'silver')
    }
    await clearSilver()
  }, [silverProject, silverProjectHasProgress, clearSilver, configuration, handleOutgoingProject])

  // Handler for completing a project (marking as done)
  const handleCompleteGold = useCallback(async () => {
    if (!configuration || !goldProject) return
    const currentLifecycle = getLifecycleState(goldProject)
    store.commit(
      events.projectLifecycleUpdated({
        projectId: goldProject.id,
        lifecycleState: {
          ...currentLifecycle,
          status: 'completed',
          completedAt: Date.now(),
          slot: undefined,
        },
        updatedAt: new Date(),
        actorId,
      })
    )
    await clearGold()
  }, [goldProject, clearGold, configuration, store, actorId])

  const handleCompleteSilver = useCallback(async () => {
    if (!configuration || !silverProject) return
    const currentLifecycle = getLifecycleState(silverProject)
    store.commit(
      events.projectLifecycleUpdated({
        projectId: silverProject.id,
        lifecycleState: {
          ...currentLifecycle,
          status: 'completed',
          completedAt: Date.now(),
          slot: undefined,
        },
        updatedAt: new Date(),
        actorId,
      })
    )
    await clearSilver()
  }, [silverProject, clearSilver, configuration, store, actorId])

  // Handler for archiving a project
  const handleArchiveGold = useCallback(async () => {
    if (!configuration || !goldProject) return
    // Clear the slot from lifecycle state first
    const currentLifecycle = getLifecycleState(goldProject)
    store.commit(
      events.projectLifecycleUpdated({
        projectId: goldProject.id,
        lifecycleState: {
          ...currentLifecycle,
          slot: undefined,
        },
        updatedAt: new Date(),
        actorId,
      })
    )
    store.commit(
      events.projectArchived({
        id: goldProject.id,
        archivedAt: new Date(),
        actorId,
      })
    )
    await clearGold()
  }, [goldProject, clearGold, configuration, store, actorId])

  const handleArchiveSilver = useCallback(async () => {
    if (!configuration || !silverProject) return
    // Clear the slot from lifecycle state first
    const currentLifecycle = getLifecycleState(silverProject)
    store.commit(
      events.projectLifecycleUpdated({
        projectId: silverProject.id,
        lifecycleState: {
          ...currentLifecycle,
          slot: undefined,
        },
        updatedAt: new Date(),
        actorId,
      })
    )
    store.commit(
      events.projectArchived({
        id: silverProject.id,
        archivedAt: new Date(),
        actorId,
      })
    )
    await clearSilver()
  }, [silverProject, clearSilver, configuration, store, actorId])

  // Handler for reordering queue
  const handleReorderGold = useCallback(
    (reorderedProjects: Project[]) => {
      // Emit lifecycle updates with new queue positions
      reorderedProjects.forEach((project, index) => {
        const currentLifecycle = getLifecycleState(project)
        if (currentLifecycle.queuePosition !== index + 1) {
          store.commit(
            events.projectLifecycleUpdated({
              projectId: project.id,
              lifecycleState: {
                ...currentLifecycle,
                queuePosition: index + 1,
              },
              updatedAt: new Date(),
              actorId,
            })
          )
        }
      })
    },
    [store, actorId]
  )

  const handleReorderSilver = useCallback(
    (reorderedProjects: Project[]) => {
      reorderedProjects.forEach((project, index) => {
        const currentLifecycle = getLifecycleState(project)
        if (currentLifecycle.queuePosition !== index + 1) {
          store.commit(
            events.projectLifecycleUpdated({
              projectId: project.id,
              lifecycleState: {
                ...currentLifecycle,
                queuePosition: index + 1,
              },
              updatedAt: new Date(),
              actorId,
            })
          )
        }
      })
    },
    [store, actorId]
  )

  // PR1 Task Queue Redesign: Bronze project handlers
  const handleAddBronzeProject = useCallback(
    async (projectId: string) => {
      await tableBronzeProject(projectId, undefined, true)
    },
    [tableBronzeProject]
  )

  const handleRemoveBronzeProject = useCallback(
    async (entryId: string) => {
      await removeBronzeProject(entryId)
    },
    [removeBronzeProject]
  )

  const handleReorderBronzeProjects = useCallback(
    async (entries: Array<{ id: string; projectId: string }>) => {
      await reorderBronzeProjects(entries)
    },
    [reorderBronzeProjects]
  )

  // Handler for quick adding a new bronze project directly to the table
  const handleQuickAddBronzeProject = useCallback(
    async (name: string) => {
      const projectId = crypto.randomUUID()

      // Create a minimal bronze project with quicktask archetype
      store.commit(
        events.projectCreatedV2({
          id: projectId,
          name,
          description: undefined,
          category: undefined,
          lifecycleState: {
            status: 'backlog',
            stage: 4,
            stream: 'bronze',
            archetype: 'quicktask',
            scale: 'micro',
          },
          attributes: undefined,
          createdAt: new Date(),
          actorId,
        })
      )

      // Add to bronze table with initializeIfNeeded
      await tableBronzeProject(projectId, undefined, true)
    },
    [store, actorId, tableBronzeProject]
  )

  const hasActiveFilters = categoryFilter !== 'all'

  const clearFilters = () => {
    setCategoryFilter('all')
  }

  return (
    <div className='py-4'>
      {/* Category Filter Bar */}
      <div className='mb-4 flex flex-wrap items-center gap-2'>
        <span className='text-xs font-semibold text-[#8b8680]'>Category:</span>
        {CATEGORY_FILTERS.map(cat => (
          <button
            key={cat.value}
            type='button'
            className={`py-1 px-2.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
              categoryFilter === cat.value
                ? 'text-white'
                : 'bg-transparent border-[#e8e4de] text-[#8b8680] hover:border-[#d0ccc5] hover:text-[#2f2b27]'
            }`}
            style={
              categoryFilter === cat.value && cat.colorHex
                ? { backgroundColor: cat.colorHex, borderColor: cat.colorHex, color: '#fff' }
                : categoryFilter === cat.value
                  ? { backgroundColor: '#2f2b27', borderColor: '#2f2b27', color: '#fff' }
                  : undefined
            }
            onClick={() => setCategoryFilter(cat.value)}
          >
            {cat.label}
          </button>
        ))}
        {hasActiveFilters && (
          <button
            type='button'
            className='text-xs text-[#8b8680] bg-transparent border-none cursor-pointer underline hover:text-[#2f2b27]'
            onClick={clearFilters}
          >
            Clear
          </button>
        )}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
        {streamSummaries.map(summary => {
          const streamColors: Record<Stream, { border: string; bg: string }> = {
            gold: {
              border: '#d8a650',
              bg: 'linear-gradient(145deg, rgba(216, 166, 80, 0.08), #fff)',
            },
            silver: {
              border: '#c5ced8',
              bg: 'linear-gradient(145deg, rgba(197, 206, 216, 0.1), #fff)',
            },
            bronze: {
              border: '#c48b5a',
              bg: 'linear-gradient(145deg, rgba(196, 139, 90, 0.08), #fff)',
            },
          }
          const colors = streamColors[summary.stream]
          const isExpanded = expandedStream === summary.stream

          return (
            <div
              key={summary.stream}
              className={`border rounded-xl bg-white overflow-hidden ${
                isExpanded ? 'border-2' : 'border'
              }`}
              style={{
                borderColor: isExpanded ? colors.border : '#e8e4de',
                borderLeftWidth: '4px',
                borderLeftColor: colors.border,
                background: isExpanded ? colors.bg : undefined,
              }}
            >
              <div
                className='flex items-center gap-3 p-3 cursor-pointer hover:bg-[#faf9f7]'
                onClick={() => handleTabClick(summary.stream)}
              >
                <span className={getStreamDotClass(summary.stream)} />
                <span className="font-['Source_Serif_4',Georgia,serif] font-semibold text-base text-[#2f2b27]">
                  {summary.label}
                </span>
                <span className='text-xs text-[#8b8680]'>
                  {summary.stream === 'bronze'
                    ? `${validTabledBronzeCount} on table / ${summary.queueCount} in backlog`
                    : `${summary.queueCount} in backlog`}
                </span>
                <button
                  type='button'
                  className='ml-auto text-xs py-1 px-2 rounded bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer hover:border-[#d0ccc5] hover:text-[#2f2b27]'
                  onClick={e => {
                    e.stopPropagation()
                    handleTabClick(summary.stream)
                  }}
                >
                  {expandedStream === summary.stream ? 'Hide' : 'Expand'}
                </button>
              </div>
              <div className='px-3 pb-3 border-t' style={{ borderTopColor: colors.border }}>
                <div className='flex items-center gap-2 pt-2'>
                  <span className='text-[10px] font-semibold text-[#8b8680] uppercase tracking-wide'>
                    ON TABLE
                  </span>
                  {summary.tabledName ? (
                    <>
                      <span className='text-sm font-semibold text-[#2f2b27]'>
                        {summary.tabledName}
                      </span>
                      {summary.tabledMeta && (
                        <span className='text-xs text-[#8b8680]'>{summary.tabledMeta}</span>
                      )}
                    </>
                  ) : (
                    <span className='text-sm text-[#8b8680]'>Empty</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {expandedStream && (
        <div className='mt-4 bg-white rounded-xl border border-[#e8e4de] p-4'>
          {expandedStream === 'gold' && (
            <GoldSilverPanel
              stream='gold'
              tabledProject={goldProject}
              backlogProjects={backlogProjectsByStream.gold}
              activeProjects={activeProjectsByStream.gold}
              onActivateToTable={handleActivateGold}
              onReleaseFromTable={handleReleaseGold}
              onCompleteProject={handleCompleteGold}
              onArchiveProject={handleArchiveGold}
              onReorder={handleReorderGold}
              draggedProject={draggedGoldProject}
              setDraggedProject={setDraggedGoldProject}
              outgoingProjectHasProgress={goldProjectHasProgress}
              allTasksDone={goldProjectAllTasksDone}
              tabledProjectCompletionPercentage={goldProjectCompletionPercentage}
            />
          )}
          {expandedStream === 'silver' && (
            <GoldSilverPanel
              stream='silver'
              tabledProject={silverProject}
              backlogProjects={backlogProjectsByStream.silver}
              activeProjects={activeProjectsByStream.silver}
              onActivateToTable={handleActivateSilver}
              onReleaseFromTable={handleReleaseSilver}
              onCompleteProject={handleCompleteSilver}
              onArchiveProject={handleArchiveSilver}
              onReorder={handleReorderSilver}
              draggedProject={draggedSilverProject}
              setDraggedProject={setDraggedSilverProject}
              outgoingProjectHasProgress={silverProjectHasProgress}
              allTasksDone={silverProjectAllTasksDone}
              tabledProjectCompletionPercentage={silverProjectCompletionPercentage}
            />
          )}
          {expandedStream === 'bronze' && (
            <BronzePanel
              tabledProjects={tabledBronzeProjects}
              availableProjects={availableBronzeProjects}
              allTasks={allTasks}
              allProjects={allProjects}
              onAddToTable={handleAddBronzeProject}
              onRemoveFromTable={handleRemoveBronzeProject}
              onReorder={handleReorderBronzeProjects}
              onQuickAddProject={handleQuickAddBronzeProject}
            />
          )}
        </div>
      )}

      {/* Systems Section */}
      <div className='mt-6'>
        <div className='flex items-center gap-2 mb-3'>
          <h2 className="font-['Source_Serif_4',Georgia,serif] text-lg font-semibold text-[#2f2b27]">
            Systems
          </h2>
          <span className='text-xs text-[#8b8680]'>Infrastructure that runs indefinitely</span>
        </div>
        <div className='bg-white rounded-xl border border-[#e8e4de] p-4'>
          <SystemBoardSection />
        </div>
      </div>
    </div>
  )
}
