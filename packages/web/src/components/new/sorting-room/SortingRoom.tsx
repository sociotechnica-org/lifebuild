import React, { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useStore } from '../../../livestore-compat.js'
import { getProjects$, getAllTasks$ } from '@lifebuild/shared/queries'
import {
  resolveLifecycleState,
  type ProjectLifecycleState,
  PROJECT_CATEGORIES,
  type ProjectCategory,
} from '@lifebuild/shared'
import type { Project, Task } from '@lifebuild/shared/schema'
import { events } from '@lifebuild/shared/schema'
import { useTableState } from '../../../hooks/useTableState.js'
import { useAuth } from '../../../contexts/AuthContext.js'
import { GoldSilverPanel } from './GoldSilverPanel.js'
import { BronzePanel } from './BronzePanel.js'

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
  const [expandedStream, setExpandedStream] = useState<Stream | null>(null)
  const [draggedGoldProject, setDraggedGoldProject] = useState<Project | null>(null)
  const [draggedSilverProject, setDraggedSilverProject] = useState<Project | null>(null)

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
    activeBronzeStack,
    initializeConfiguration,
    assignGold,
    assignSilver,
    clearGold,
    clearSilver,
    addBronzeTask,
    removeBronzeTask,
    reorderBronzeStack,
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

    return { gold: goldProjects, silver: silverProjects }
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
  const bronzeTasks = useMemo(() => {
    const goldId = configuration?.goldProjectId
    const silverId = configuration?.silverProjectId

    return allTasks.filter(t => {
      if (t.archivedAt !== null || t.status === 'done') return false

      // Orphaned tasks (no project) are always eligible for bronze
      if (!t.projectId) return true

      const project = allProjects.find(p => p.id === t.projectId)
      if (!project) return false

      const lifecycle = getLifecycleState(project)

      // Bronze-stream projects: backlog OR active
      if (lifecycle.stream === 'bronze') {
        return lifecycle.status === 'backlog' || lifecycle.status === 'active'
      }

      // Non-bronze active projects: exclude tabled gold/silver
      if (lifecycle.status === 'active') {
        return t.projectId !== goldId && t.projectId !== silverId
      }

      return false
    })
  }, [allTasks, allProjects, configuration?.goldProjectId, configuration?.silverProjectId])

  // Separate tabled vs available bronze tasks
  const tabledTaskIds = useMemo(
    () => new Set(activeBronzeStack.map(entry => entry.taskId)),
    [activeBronzeStack]
  )

  const availableBronzeTasks = useMemo(
    () => bronzeTasks.filter(t => !tabledTaskIds.has(t.id)),
    [bronzeTasks, tabledTaskIds]
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

  // Get top bronze task for summary
  const topBronzeTask = useMemo(() => {
    if (activeBronzeStack.length === 0) return null
    const topEntry = activeBronzeStack[0]
    return topEntry ? (allTasks.find(t => t.id === topEntry.taskId) ?? null) : null
  }, [activeBronzeStack, allTasks])

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
      tabledName: topBronzeTask?.title ?? null,
      tabledMeta:
        activeBronzeStack.length > 1 ? `+${activeBronzeStack.length - 1} more tabled` : null,
      queueCount: availableBronzeTasks.length,
    },
  ]

  const handleTabClick = (stream: Stream) => {
    setExpandedStream(prev => (prev === stream ? null : stream))
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

  // Bronze handlers - use initializeIfNeeded to avoid race condition
  const handleAddBronzeTask = useCallback(
    async (taskId: string) => {
      await addBronzeTask(taskId, undefined, true)
    },
    [addBronzeTask]
  )

  const handleRemoveBronzeTask = useCallback(
    async (entryId: string) => {
      await removeBronzeTask(entryId)
    },
    [removeBronzeTask]
  )

  const handleReorderBronze = useCallback(
    async (entries: Array<{ id: string; taskId: string }>) => {
      await reorderBronzeStack(entries)
    },
    [reorderBronzeStack]
  )

  // Handler for quick adding an orphaned task directly to the bronze table
  const handleQuickAddBronzeTask = useCallback(
    async (title: string) => {
      const taskId = crypto.randomUUID()

      // Create orphaned task (no projectId)
      store.commit(
        events.taskCreatedV2({
          id: taskId,
          projectId: undefined,
          title,
          description: undefined,
          status: 'todo',
          assigneeIds: undefined,
          attributes: undefined,
          position: 0,
          createdAt: new Date(),
          actorId,
        })
      )

      // Add to bronze table with initializeIfNeeded to avoid race condition
      await addBronzeTask(taskId, undefined, true)
    },
    [store, actorId, addBronzeTask]
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
                    ? `${activeBronzeStack.length} tabled / ${summary.queueCount} available`
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
              onReorder={handleReorderGold}
              draggedProject={draggedGoldProject}
              setDraggedProject={setDraggedGoldProject}
              outgoingProjectHasProgress={goldProjectHasProgress}
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
              onReorder={handleReorderSilver}
              draggedProject={draggedSilverProject}
              setDraggedProject={setDraggedSilverProject}
              outgoingProjectHasProgress={silverProjectHasProgress}
              tabledProjectCompletionPercentage={silverProjectCompletionPercentage}
            />
          )}
          {expandedStream === 'bronze' && (
            <BronzePanel
              tabledStack={activeBronzeStack}
              availableTasks={availableBronzeTasks}
              allTasks={allTasks}
              allProjects={allProjects}
              onAddToTable={handleAddBronzeTask}
              onRemoveFromTable={handleRemoveBronzeTask}
              onReorder={handleReorderBronze}
              onQuickAddTask={handleQuickAddBronzeTask}
            />
          )}
        </div>
      )}
    </div>
  )
}
