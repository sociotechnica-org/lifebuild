import React, { useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useStore } from '../../livestore-compat.js'
import { getProjects$, getAllTasks$ } from '@lifebuild/shared/queries'
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
import { useAuth } from '../../contexts/AuthContext.js'
import { GoldSilverPanel } from './GoldSilverPanel.js'
import { BronzePanel } from './BronzePanel.js'
import { usePostHog } from '../../lib/analytics.js'

export type Stream = 'gold' | 'silver' | 'bronze'

interface StreamSummary {
  stream: Stream
  label: string
  activeName: string | null
  activeMeta: string | null
  activeCount: number
  backlogCount: number
}

function getLifecycleState(project: Project): ProjectLifecycleState {
  return resolveLifecycleState(project.projectLifecycleState, null)
}

function projectAllTasksDone(projectId: string, tasks: readonly Task[]): boolean {
  const projectTasks = tasks.filter(
    task => task.projectId === projectId && task.archivedAt === null
  )
  return projectTasks.every(task => task.status === 'done')
}

function getLastActivityTime(projectId: string, tasks: readonly Task[]): number {
  const projectTasks = tasks.filter(
    task => task.projectId === projectId && task.archivedAt === null
  )
  if (projectTasks.length === 0) return 0

  return Math.max(
    ...projectTasks.map(task => {
      const updated = task.updatedAt ? new Date(task.updatedAt).getTime() : 0
      const created = task.createdAt ? new Date(task.createdAt).getTime() : 0
      return Math.max(updated, created)
    })
  )
}

const CATEGORY_FILTERS: { value: ProjectCategory | 'all'; label: string; colorHex?: string }[] = [
  { value: 'all', label: 'All' },
  ...PROJECT_CATEGORIES.map(category => ({
    value: category.value,
    label: category.name,
    colorHex: category.colorHex,
  })),
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
  const { store } = useStore()
  const { user } = useAuth()
  const actorId = user?.id

  useEffect(() => {
    posthog?.capture('sorting_room_viewed')
  }, [])

  const expandedStream: Stream | null =
    streamParam === 'gold' || streamParam === 'silver' || streamParam === 'bronze'
      ? streamParam
      : null

  const categoryFromUrl = searchParams.get('category') as ProjectCategory | null
  const categoryFilter: ProjectCategory | 'all' =
    categoryFromUrl && PROJECT_CATEGORIES.some(category => category.value === categoryFromUrl)
      ? categoryFromUrl
      : 'all'

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

  const backlogProjectsByStream = useMemo(() => {
    const stage4BacklogProjects = allProjects.filter(project => {
      const lifecycle = getLifecycleState(project)
      if (lifecycle.status !== 'backlog' || lifecycle.stage !== 4) return false
      if (categoryFilter !== 'all' && project.category !== categoryFilter) return false
      return true
    })

    const byQueuePosition = (projectA: Project, projectB: Project) => {
      const aPosition = getLifecycleState(projectA).queuePosition ?? 999
      const bPosition = getLifecycleState(projectB).queuePosition ?? 999
      return aPosition - bPosition
    }

    return {
      gold: stage4BacklogProjects
        .filter(project => getLifecycleState(project).stream === 'gold')
        .sort(byQueuePosition),
      silver: stage4BacklogProjects
        .filter(project => getLifecycleState(project).stream === 'silver')
        .sort(byQueuePosition),
      bronze: stage4BacklogProjects
        .filter(project => getLifecycleState(project).stream === 'bronze')
        .sort(byQueuePosition),
    }
  }, [allProjects, categoryFilter])

  const activeProjectsByStream = useMemo(() => {
    const activeProjects = allProjects.filter(project => {
      const lifecycle = getLifecycleState(project)
      if (lifecycle.status !== 'active') return false
      if (categoryFilter !== 'all' && project.category !== categoryFilter) return false
      return true
    })

    const byLastActivity = (projectA: Project, projectB: Project) =>
      getLastActivityTime(projectB.id, allTasks) - getLastActivityTime(projectA.id, allTasks)

    return {
      gold: activeProjects
        .filter(project => getLifecycleState(project).stream === 'gold')
        .sort(byLastActivity),
      silver: activeProjects
        .filter(project => getLifecycleState(project).stream === 'silver')
        .sort(byLastActivity),
      bronze: activeProjects
        .filter(project => getLifecycleState(project).stream === 'bronze')
        .sort(byLastActivity),
    }
  }, [allProjects, allTasks, categoryFilter])

  const streamSummaries: StreamSummary[] = [
    {
      stream: 'gold',
      label: 'Initiative',
      activeName: activeProjectsByStream.gold[0]?.name ?? null,
      activeMeta: activeProjectsByStream.gold[0]?.category ?? null,
      activeCount: activeProjectsByStream.gold.length,
      backlogCount: backlogProjectsByStream.gold.length,
    },
    {
      stream: 'silver',
      label: 'Optimization',
      activeName: activeProjectsByStream.silver[0]?.name ?? null,
      activeMeta: activeProjectsByStream.silver[0]?.category ?? null,
      activeCount: activeProjectsByStream.silver.length,
      backlogCount: backlogProjectsByStream.silver.length,
    },
    {
      stream: 'bronze',
      label: 'To-Do',
      activeName: activeProjectsByStream.bronze[0]?.name ?? null,
      activeMeta:
        activeProjectsByStream.bronze.length > 1
          ? `+${activeProjectsByStream.bronze.length - 1} more`
          : null,
      activeCount: activeProjectsByStream.bronze.length,
      backlogCount: backlogProjectsByStream.bronze.length,
    },
  ]

  const handleTabClick = (stream: Stream) => {
    const newStream = expandedStream === stream ? undefined : stream
    if (newStream) {
      posthog?.capture('sorting_room_stream_switched', { stream: newStream })
    }

    const baseUrl = preserveStoreIdInUrl(generateRoute.sortingRoom(newStream))
    const categoryParam = searchParams.get('category')
    const urlWithCategory = categoryParam
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}category=${categoryParam}`
      : baseUrl

    navigate(urlWithCategory)
  }

  const updateLifecycle = useCallback(
    (project: Project, lifecycleState: ProjectLifecycleState) => {
      store.commit(
        events.projectLifecycleUpdated({
          projectId: project.id,
          lifecycleState,
          updatedAt: new Date(),
          actorId,
        })
      )
    },
    [store, actorId]
  )

  const activateProject = useCallback(
    (project: Project) => {
      const currentLifecycle = getLifecycleState(project)
      updateLifecycle(project, {
        ...currentLifecycle,
        status: 'active',
        activatedAt: Date.now(),
        queuePosition: undefined,
      })
    },
    [updateLifecycle]
  )

  const moveProjectToBacklog = useCallback(
    (project: Project) => {
      const currentLifecycle = getLifecycleState(project)
      updateLifecycle(project, {
        ...currentLifecycle,
        status: 'backlog',
        completedAt: undefined,
        queuePosition: 0,
      })
    },
    [updateLifecycle]
  )

  const completeProject = useCallback(
    (project: Project) => {
      const currentLifecycle = getLifecycleState(project)
      updateLifecycle(project, {
        ...currentLifecycle,
        status: 'completed',
        completedAt: Date.now(),
        queuePosition: undefined,
      })
    },
    [updateLifecycle]
  )

  const archiveProject = useCallback(
    (project: Project) => {
      store.commit(
        events.projectArchived({
          id: project.id,
          archivedAt: new Date(),
          actorId,
        })
      )
    },
    [store, actorId]
  )

  const reorderBacklog = useCallback(
    (stream: Stream, reorderedProjects: Project[]) => {
      reorderedProjects.forEach((project, index) => {
        const currentLifecycle = getLifecycleState(project)
        const nextPosition = index + 1
        if (currentLifecycle.queuePosition !== nextPosition) {
          updateLifecycle(project, {
            ...currentLifecycle,
            queuePosition: nextPosition,
            stream,
            status: 'backlog',
          })
        }
      })
    },
    [updateLifecycle]
  )

  const handleQuickAddBronzeProject = useCallback(
    async (name: string) => {
      const projectId = crypto.randomUUID()

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
    },
    [store, actorId]
  )

  const completableProjectIdsByStream = useMemo(() => {
    return {
      gold: new Set(
        activeProjectsByStream.gold
          .filter(project => projectAllTasksDone(project.id, allTasks))
          .map(project => project.id)
      ),
      silver: new Set(
        activeProjectsByStream.silver
          .filter(project => projectAllTasksDone(project.id, allTasks))
          .map(project => project.id)
      ),
    }
  }, [activeProjectsByStream.gold, activeProjectsByStream.silver, allTasks])

  const hasActiveFilters = categoryFilter !== 'all'

  const clearFilters = () => {
    setCategoryFilter('all')
  }

  return (
    <div className='py-4'>
      <div className='mb-4 flex flex-wrap items-center gap-2'>
        <span className='text-xs font-semibold text-[#8b8680]'>Category:</span>
        {CATEGORY_FILTERS.map(category => (
          <button
            key={category.value}
            type='button'
            className={`py-1 px-2.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
              categoryFilter === category.value
                ? 'text-white'
                : 'bg-transparent border-[#e8e4de] text-[#8b8680] hover:border-[#d0ccc5] hover:text-[#2f2b27]'
            }`}
            style={
              categoryFilter === category.value && category.colorHex
                ? {
                    backgroundColor: category.colorHex,
                    borderColor: category.colorHex,
                    color: '#fff',
                  }
                : categoryFilter === category.value
                  ? { backgroundColor: '#2f2b27', borderColor: '#2f2b27', color: '#fff' }
                  : undefined
            }
            onClick={() => setCategoryFilter(category.value)}
          >
            {category.label}
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
                  {summary.activeCount} active / {summary.backlogCount} in backlog
                </span>
                <button
                  type='button'
                  className='ml-auto text-xs py-1 px-2 rounded bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer hover:border-[#d0ccc5] hover:text-[#2f2b27]'
                  onClick={event => {
                    event.stopPropagation()
                    handleTabClick(summary.stream)
                  }}
                >
                  {expandedStream === summary.stream ? 'Hide' : 'Expand'}
                </button>
              </div>
              <div className='px-3 pb-3 border-t' style={{ borderTopColor: colors.border }}>
                <div className='flex items-center gap-2 pt-2'>
                  <span className='text-[10px] font-semibold text-[#8b8680] uppercase tracking-wide'>
                    ACTIVE NOW
                  </span>
                  {summary.activeName ? (
                    <>
                      <span className='text-sm font-semibold text-[#2f2b27]'>
                        {summary.activeName}
                      </span>
                      {summary.activeMeta && (
                        <span className='text-xs text-[#8b8680]'>{summary.activeMeta}</span>
                      )}
                    </>
                  ) : (
                    <span className='text-sm text-[#8b8680]'>None</span>
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
              backlogProjects={backlogProjectsByStream.gold}
              activeProjects={activeProjectsByStream.gold}
              completableProjectIds={completableProjectIdsByStream.gold}
              onActivate={activateProject}
              onMoveToBacklog={moveProjectToBacklog}
              onCompleteProject={completeProject}
              onArchiveProject={archiveProject}
              onReorder={projects => reorderBacklog('gold', projects)}
            />
          )}
          {expandedStream === 'silver' && (
            <GoldSilverPanel
              stream='silver'
              backlogProjects={backlogProjectsByStream.silver}
              activeProjects={activeProjectsByStream.silver}
              completableProjectIds={completableProjectIdsByStream.silver}
              onActivate={activateProject}
              onMoveToBacklog={moveProjectToBacklog}
              onCompleteProject={completeProject}
              onArchiveProject={archiveProject}
              onReorder={projects => reorderBacklog('silver', projects)}
            />
          )}
          {expandedStream === 'bronze' && (
            <BronzePanel
              activeProjects={activeProjectsByStream.bronze}
              backlogProjects={backlogProjectsByStream.bronze}
              allTasks={allTasks}
              onActivate={activateProject}
              onMoveToBacklog={moveProjectToBacklog}
              onQuickAddProject={handleQuickAddBronzeProject}
            />
          )}
        </div>
      )}
    </div>
  )
}
