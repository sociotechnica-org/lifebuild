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

  // Filter and sort Gold/Silver projects (Stage 4, backlog status, sorted by queuePosition)
  // Exclude projects that are currently on the table
  const projectsByStream = useMemo(() => {
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
      queueCount: projectsByStream.gold.length,
    },
    {
      stream: 'silver',
      label: 'Silver',
      tabledName: silverProject?.name ?? null,
      tabledMeta: silverProject?.category ?? null,
      queueCount: projectsByStream.silver.length,
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

  // Handler for activating a project to the table
  const handleActivateGold = useCallback(
    async (project: Project) => {
      // Update lifecycle to mark as slotted
      const currentLifecycle = getLifecycleState(project)
      store.commit(
        events.projectLifecycleUpdated({
          projectId: project.id,
          lifecycleState: {
            ...currentLifecycle,
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
    [store, actorId, assignGold, configuration, initializeConfiguration]
  )

  const handleActivateSilver = useCallback(
    async (project: Project) => {
      const currentLifecycle = getLifecycleState(project)
      store.commit(
        events.projectLifecycleUpdated({
          projectId: project.id,
          lifecycleState: {
            ...currentLifecycle,
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
    [store, actorId, assignSilver, configuration, initializeConfiguration]
  )

  // Handler for releasing a project from the table
  const handleReleaseGold = useCallback(async () => {
    if (!configuration) return
    if (goldProject) {
      const currentLifecycle = getLifecycleState(goldProject)
      store.commit(
        events.projectLifecycleUpdated({
          projectId: goldProject.id,
          lifecycleState: {
            ...currentLifecycle,
            slot: undefined,
            queuePosition: 0, // Move to top of queue
          },
          updatedAt: new Date(),
          actorId,
        })
      )
    }
    await clearGold()
  }, [goldProject, store, actorId, clearGold, configuration])

  const handleReleaseSilver = useCallback(async () => {
    if (!configuration) return
    if (silverProject) {
      const currentLifecycle = getLifecycleState(silverProject)
      store.commit(
        events.projectLifecycleUpdated({
          projectId: silverProject.id,
          lifecycleState: {
            ...currentLifecycle,
            slot: undefined,
            queuePosition: 0,
          },
          updatedAt: new Date(),
          actorId,
        })
      )
    }
    await clearSilver()
  }, [silverProject, store, actorId, clearSilver, configuration])

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
                  : `${summary.queueCount} waiting in queue`}
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
              queuedProjects={projectsByStream.gold}
              onActivateToTable={handleActivateGold}
              onReleaseFromTable={handleReleaseGold}
              onReorder={handleReorderGold}
              draggedProject={draggedGoldProject}
              setDraggedProject={setDraggedGoldProject}
            />
          )}
          {expandedStream === 'silver' && (
            <GoldSilverPanel
              stream='silver'
              tabledProject={silverProject}
              queuedProjects={projectsByStream.silver}
              onActivateToTable={handleActivateSilver}
              onReleaseFromTable={handleReleaseSilver}
              onReorder={handleReorderSilver}
              draggedProject={draggedSilverProject}
              setDraggedProject={setDraggedSilverProject}
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
