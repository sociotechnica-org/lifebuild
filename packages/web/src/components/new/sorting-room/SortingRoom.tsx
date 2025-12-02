import React, { useState, useMemo, useCallback } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { getProjects$, getAllTasks$ } from '@work-squared/shared/queries'
import { resolveLifecycleState, type ProjectLifecycleState } from '@work-squared/shared'
import type { Project, Task } from '@work-squared/shared/schema'
import { events } from '@work-squared/shared/schema'
import { useTableState } from '../../../hooks/useTableState.js'
import { useAuth } from '../../../contexts/AuthContext.js'
import { GoldSilverPanel } from './GoldSilverPanel.js'
import { BronzePanel } from './BronzePanel.js'
import './sorting-room.css'

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
export const SortingRoom: React.FC = () => {
  const [expandedStream, setExpandedStream] = useState<Stream | null>(null)
  const [draggedGoldProject, setDraggedGoldProject] = useState<Project | null>(null)
  const [draggedSilverProject, setDraggedSilverProject] = useState<Project | null>(null)

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
  } = useTableState()
  const { store } = useStore()
  const { user } = useAuth()
  const actorId = user?.id

  // Filter and sort backlog projects (Stage 4, backlog status, sorted by queuePosition)
  // Exclude projects that are currently on the table
  const backlogProjectsByStream = useMemo(() => {
    const stage4Projects = allProjects.filter(project => {
      const lifecycle = getLifecycleState(project)
      return lifecycle.status === 'backlog' && lifecycle.stage === 4
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
  }, [allProjects, configuration?.goldProjectId, configuration?.silverProjectId])

  // Filter and sort active projects by stream (sorted by last activity time)
  // Exclude projects that are currently on the table
  const activeProjectsByStream = useMemo(() => {
    const activeProjects = allProjects.filter(project => {
      const lifecycle = getLifecycleState(project)
      return lifecycle.status === 'active'
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
  }, [allProjects, allTasks, configuration?.goldProjectId, configuration?.silverProjectId])

  // Get all tasks from active projects for bronze
  const activeProjectIds = useMemo(() => {
    return new Set(allProjects.filter(p => getLifecycleState(p).status === 'active').map(p => p.id))
  }, [allProjects])

  const bronzeTasks = useMemo(() => {
    return allTasks.filter(
      t => t.projectId && activeProjectIds.has(t.projectId) && t.archivedAt === null
    )
  }, [allTasks, activeProjectIds])

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
      label: 'Gold',
      tabledName: goldProject?.name ?? null,
      tabledMeta: goldProject?.category ?? null,
      queueCount: backlogProjectsByStream.gold.length,
    },
    {
      stream: 'silver',
      label: 'Silver',
      tabledName: silverProject?.name ?? null,
      tabledMeta: silverProject?.category ?? null,
      queueCount: backlogProjectsByStream.silver.length,
    },
    {
      stream: 'bronze',
      label: 'Bronze',
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
    (outgoingProject: Project, hasProgress: boolean, stream: 'gold' | 'silver') => {
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

  return (
    <div className='sorting-room'>
      <div className='sorting-room-tabs'>
        {streamSummaries.map(summary => (
          <div
            key={summary.stream}
            className={`sorting-room-tab ${summary.stream} ${expandedStream === summary.stream ? 'expanded' : ''}`}
          >
            <div className='sorting-room-tab-header' onClick={() => handleTabClick(summary.stream)}>
              <span className={`sorting-room-stream-dot ${summary.stream}`} />
              <span className='sorting-room-tab-label'>{summary.label}</span>
              <span className='sorting-room-tab-count'>
                {summary.stream === 'bronze'
                  ? `${activeBronzeStack.length} tabled / ${summary.queueCount} available`
                  : `${summary.queueCount} in backlog`}
              </span>
              <button
                type='button'
                className='sorting-room-expand-btn'
                onClick={e => {
                  e.stopPropagation()
                  handleTabClick(summary.stream)
                }}
              >
                {expandedStream === summary.stream ? 'Hide' : 'Expand'}
              </button>
            </div>
            <div className='sorting-room-tab-summary'>
              <div className='sorting-room-on-table'>
                <span className='sorting-room-on-table-label'>ON TABLE</span>
                {summary.tabledName ? (
                  <>
                    <span className='sorting-room-on-table-name'>{summary.tabledName}</span>
                    {summary.tabledMeta && (
                      <span className='sorting-room-on-table-meta'>{summary.tabledMeta}</span>
                    )}
                  </>
                ) : (
                  <span className='sorting-room-on-table-empty'>Empty</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {expandedStream && (
        <div className={`sorting-room-panel ${expandedStream}`}>
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
            />
          )}
          {expandedStream === 'bronze' && (
            <BronzePanel
              tabledStack={activeBronzeStack}
              availableTasks={availableBronzeTasks}
              allTasks={allTasks}
              allProjects={allProjects}
            />
          )}
        </div>
      )}
    </div>
  )
}
