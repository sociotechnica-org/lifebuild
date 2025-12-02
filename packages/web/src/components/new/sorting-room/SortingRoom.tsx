import React, { useState, useMemo } from 'react'
import { useQuery } from '@livestore/react'
import { getProjects$, getAllTasks$ } from '@work-squared/shared/queries'
import { resolveLifecycleState, type ProjectLifecycleState } from '@work-squared/shared'
import type { Project, Task, TableBronzeStackEntry } from '@work-squared/shared/schema'
import { useTableState } from '../../../hooks/useTableState.js'
import './sorting-room.css'

export type Stream = 'gold' | 'silver' | 'bronze'

interface StreamSummary {
  stream: Stream
  label: string
  tabledName: string | null
  tabledMeta: string | null
  queueCount: number
}

/**
 * Get lifecycle state from project
 */
function getLifecycleState(project: Project): ProjectLifecycleState {
  return resolveLifecycleState(project.projectLifecycleState, null)
}

/**
 * SortingRoom - Manage Gold, Silver, Bronze priority streams
 *
 * Tab-style interface where only one stream is expanded at a time.
 * Changes update The Table immediately in real-time.
 */
export const SortingRoom: React.FC = () => {
  const [expandedStream, setExpandedStream] = useState<Stream | null>(null)

  // Data queries
  const allProjects = useQuery(getProjects$) ?? []
  const allTasks = useQuery(getAllTasks$) ?? []
  const { configuration, activeBronzeStack } = useTableState()

  // Get Stage 4 backlog projects by stream
  const projectsByStream = useMemo(() => {
    const gold: Project[] = []
    const silver: Project[] = []

    allProjects.forEach(project => {
      if (project.archivedAt) return

      const lifecycle = getLifecycleState(project)

      // Must be backlog status, stage 4
      if (lifecycle.status !== 'backlog' || lifecycle.stage !== 4) return

      // Sort into streams
      if (lifecycle.stream === 'gold') {
        gold.push(project)
      } else if (lifecycle.stream === 'silver') {
        silver.push(project)
      }
    })

    // Sort by queue position
    const sortByQueuePosition = (a: Project, b: Project) => {
      const aPos = getLifecycleState(a).queuePosition ?? 999
      const bPos = getLifecycleState(b).queuePosition ?? 999
      return aPos - bPos
    }

    return {
      gold: gold.sort(sortByQueuePosition),
      silver: silver.sort(sortByQueuePosition),
    }
  }, [allProjects])

  // Get active projects (for Bronze tasks)
  const activeProjectIds = useMemo(() => {
    return new Set(
      allProjects
        .filter(p => !p.archivedAt && getLifecycleState(p).status === 'active')
        .map(p => p.id)
    )
  }, [allProjects])

  // Get Bronze tasks (from active projects, not done, not archived)
  const bronzeTasks = useMemo(() => {
    return allTasks.filter(
      t =>
        t.projectId &&
        activeProjectIds.has(t.projectId) &&
        t.archivedAt === null &&
        t.status !== 'done'
    )
  }, [allTasks, activeProjectIds])

  // Split bronze tasks into tabled vs available
  const tabledTaskIds = useMemo(
    () => new Set(activeBronzeStack.map(entry => entry.taskId)),
    [activeBronzeStack]
  )

  const availableBronzeTasks = useMemo(
    () => bronzeTasks.filter(t => !tabledTaskIds.has(t.id)),
    [bronzeTasks, tabledTaskIds]
  )

  // Get tabled project details
  const goldProject = useMemo(
    () => allProjects.find(p => p.id === configuration?.goldProjectId) ?? null,
    [allProjects, configuration?.goldProjectId]
  )

  const silverProject = useMemo(
    () => allProjects.find(p => p.id === configuration?.silverProjectId) ?? null,
    [allProjects, configuration?.silverProjectId]
  )

  // Get top tabled bronze task
  const topBronzeTask = useMemo(() => {
    if (activeBronzeStack.length === 0) return null
    const topEntry = activeBronzeStack[0]
    return allTasks.find(t => t.id === topEntry?.taskId) ?? null
  }, [activeBronzeStack, allTasks])

  // Build stream summaries
  const streamSummaries: StreamSummary[] = [
    {
      stream: 'gold',
      label: 'Gold * Expansion',
      tabledName: goldProject?.name ?? null,
      tabledMeta: goldProject?.category ?? null,
      queueCount: projectsByStream.gold.length,
    },
    {
      stream: 'silver',
      label: 'Silver * Capacity',
      tabledName: silverProject?.name ?? null,
      tabledMeta: silverProject?.category ?? null,
      queueCount: projectsByStream.silver.length,
    },
    {
      stream: 'bronze',
      label: 'Bronze * Execution',
      tabledName: topBronzeTask?.title ?? null,
      tabledMeta: activeBronzeStack.length > 1 ? `+${activeBronzeStack.length - 1} tabled` : null,
      queueCount: availableBronzeTasks.length,
    },
  ]

  const handleTabClick = (stream: Stream) => {
    setExpandedStream(prev => (prev === stream ? null : stream))
  }

  return (
    <div className='sorting-room'>
      {/* Stream Tabs */}
      <div className='sorting-room-tabs'>
        {streamSummaries.map(summary => (
          <div
            key={summary.stream}
            className={`sorting-room-tab ${summary.stream} ${expandedStream === summary.stream ? 'expanded' : ''}`}
          >
            <div className='sorting-room-tab-header'>
              <span className={`sorting-room-stream-dot ${summary.stream}`} />
              <span className='sorting-room-tab-label'>{summary.label}</span>
              <span className='sorting-room-tab-count'>
                {summary.stream === 'bronze'
                  ? `${activeBronzeStack.length} tabled · ${summary.queueCount} available`
                  : `${summary.queueCount} waiting in queue`}
              </span>
              <button
                type='button'
                className='sorting-room-expand-btn'
                onClick={() => handleTabClick(summary.stream)}
              >
                {expandedStream === summary.stream ? 'Hide queue' : 'Expand queue'}
              </button>
            </div>

            {/* Collapsed Summary - always visible */}
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

      {/* Expanded Panel */}
      {expandedStream && (
        <div className={`sorting-room-panel ${expandedStream}`}>
          {expandedStream === 'gold' && (
            <GoldSilverPanel
              stream='gold'
              tabledProject={goldProject}
              queuedProjects={projectsByStream.gold}
            />
          )}
          {expandedStream === 'silver' && (
            <GoldSilverPanel
              stream='silver'
              tabledProject={silverProject}
              queuedProjects={projectsByStream.silver}
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

/**
 * Gold/Silver Panel - Shows tabled project and queue
 */
interface GoldSilverPanelProps {
  stream: 'gold' | 'silver'
  tabledProject: Project | null
  queuedProjects: Project[]
}

const GoldSilverPanel: React.FC<GoldSilverPanelProps> = ({
  stream,
  tabledProject,
  queuedProjects,
}) => {
  return (
    <div className='sorting-room-stream-panel'>
      {/* On Table Section */}
      <div className='sorting-room-section'>
        <h3 className='sorting-room-section-title'>ON TABLE</h3>
        {tabledProject ? (
          <div className={`sorting-room-project-card tabled ${stream}`}>
            <div className='sorting-room-project-name'>{tabledProject.name}</div>
            <div className='sorting-room-project-meta'>
              {tabledProject.category && <span>{tabledProject.category}</span>}
            </div>
          </div>
        ) : (
          <div className='sorting-room-empty-slot'>
            <span>No {stream} project on table</span>
            <span className='sorting-room-empty-hint'>
              Drag a project here or click "Activate to Table"
            </span>
          </div>
        )}
      </div>

      {/* Queue Section */}
      <div className='sorting-room-section'>
        <h3 className='sorting-room-section-title'>QUEUE ({queuedProjects.length})</h3>
        {queuedProjects.length === 0 ? (
          <div className='sorting-room-empty-queue'>
            No projects in {stream} queue. Complete Stage 4 in the Drafting Room to add projects.
          </div>
        ) : (
          <div className='sorting-room-queue-list'>
            {queuedProjects.map((project, index) => (
              <div key={project.id} className={`sorting-room-project-card queued ${stream}`}>
                <span className='sorting-room-queue-position'>#{index + 1}</span>
                <div className='sorting-room-project-info'>
                  <div className='sorting-room-project-name'>{project.name}</div>
                  <div className='sorting-room-project-meta'>
                    {project.category && <span>{project.category}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Bronze Panel - Shows tabled tasks and available pool
 */
interface BronzePanelProps {
  tabledStack: readonly TableBronzeStackEntry[]
  availableTasks: readonly Task[]
  allTasks: readonly Task[]
  allProjects: readonly Project[]
}

const BronzePanel: React.FC<BronzePanelProps> = ({
  tabledStack,
  availableTasks,
  allTasks,
  allProjects,
}) => {
  // Get task details for tabled items
  const tabledTasksWithDetails = useMemo(() => {
    return tabledStack.map(entry => {
      const task = allTasks.find(t => t.id === entry.taskId)
      const project = task?.projectId ? allProjects.find(p => p.id === task.projectId) : null
      return { entry, task, project }
    })
  }, [tabledStack, allTasks, allProjects])

  // Get project details for available tasks
  const availableTasksWithDetails = useMemo(() => {
    return availableTasks.map(task => {
      const project = task.projectId ? allProjects.find(p => p.id === task.projectId) : null
      return { task, project }
    })
  }, [availableTasks, allProjects])

  return (
    <div className='sorting-room-stream-panel'>
      {/* Tabled Section */}
      <div className='sorting-room-section'>
        <h3 className='sorting-room-section-title'>TABLED ({tabledStack.length})</h3>
        {tabledStack.length === 0 ? (
          <div className='sorting-room-empty-slot'>
            <span>No bronze tasks on table</span>
            <span className='sorting-room-empty-hint'>Add tasks from the available pool below</span>
          </div>
        ) : (
          <div className='sorting-room-queue-list'>
            {tabledTasksWithDetails.map(({ entry, task, project }, index) => (
              <div key={entry.id} className='sorting-room-task-card tabled bronze'>
                <span className='sorting-room-queue-position'>#{index + 1}</span>
                <div className='sorting-room-task-info'>
                  <div className='sorting-room-task-title'>{task?.title ?? 'Unknown task'}</div>
                  <div className='sorting-room-task-meta'>
                    {project?.name && <span>{project.name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Validation warning */}
        {tabledStack.length < 3 && tabledStack.length > 0 && (
          <div className='sorting-room-warning'>
            ⚠️ Minimum 3 bronze tasks recommended. Add {3 - tabledStack.length} more.
          </div>
        )}
      </div>

      {/* Available Section */}
      <div className='sorting-room-section'>
        <h3 className='sorting-room-section-title'>AVAILABLE ({availableTasks.length})</h3>
        {availableTasks.length === 0 ? (
          <div className='sorting-room-empty-queue'>
            No available tasks. Tasks from active projects will appear here.
          </div>
        ) : (
          <div className='sorting-room-queue-list'>
            {availableTasksWithDetails.map(({ task, project }) => (
              <div key={task.id} className='sorting-room-task-card available bronze'>
                <div className='sorting-room-task-info'>
                  <div className='sorting-room-task-title'>{task.title}</div>
                  <div className='sorting-room-task-meta'>
                    {project?.name && <span>{project.name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
