import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project } from '@lifebuild/shared/schema'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableProjectCard } from './SortableProjectCard.js'
import { TableDropZone } from './TableDropZone.js'
import { TableConfirmDialog, type DialogMode } from './TableConfirmDialog.js'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'
import { usePostHog } from '../../../lib/analytics.js'

export type QueueView = 'backlog' | 'active'

export interface GoldSilverPanelProps {
  stream: 'gold' | 'silver'
  tabledProject: Project | null
  backlogProjects: Project[]
  activeProjects: Project[]
  onActivateToTable: (project: Project) => void
  onReleaseFromTable: () => void
  onCompleteProject: () => void
  onArchiveProject: () => void
  onReorder: (projects: Project[]) => void
  draggedProject: Project | null
  setDraggedProject: (project: Project | null) => void
  outgoingProjectHasProgress: boolean
  allTasksDone: boolean
  tabledProjectCompletionPercentage?: number
}

/**
 * Gold/Silver Panel - Shows tabled project and queue with drag-and-drop
 * Reusable for both Gold and Silver streams
 */
export const GoldSilverPanel: React.FC<GoldSilverPanelProps> = ({
  stream,
  tabledProject,
  backlogProjects,
  activeProjects,
  onActivateToTable,
  onReleaseFromTable,
  onCompleteProject,
  onArchiveProject,
  onReorder,
  draggedProject,
  setDraggedProject,
  outgoingProjectHasProgress,
  allTasksDone,
  tabledProjectCompletionPercentage = 0,
}) => {
  const navigate = useNavigate()
  const posthog = usePostHog()
  const [queueView, setQueueView] = useState<QueueView>('backlog')
  const [pendingProject, setPendingProject] = useState<Project | null>(null)
  const [dialogMode, setDialogMode] = useState<DialogMode>('activate')
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  // Reset archive dialog when tabled project changes to prevent showing dialog for wrong project
  useEffect(() => {
    setShowArchiveConfirm(false)
  }, [tabledProject?.id])

  const handleViewTabledProject = () => {
    if (tabledProject) {
      navigate(preserveStoreIdInUrl(generateRoute.project(tabledProject.id)))
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Get projects based on current view
  const displayedProjects = queueView === 'backlog' ? backlogProjects : activeProjects

  const handleDragStart = (event: DragStartEvent) => {
    const project = displayedProjects.find(p => p.id === event.active.id)
    setDraggedProject(project ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedProject(null)

    if (!over) return

    // Check if dropped on table drop zone
    if (over.id === `table-drop-${stream}`) {
      const project = displayedProjects.find(p => p.id === active.id)
      if (project) {
        // Show activation confirmation dialog
        setDialogMode('activate')
        setPendingProject(project)
      }
      return
    }

    // Handle reordering within queue (only for backlog view)
    if (queueView === 'backlog' && active.id !== over.id) {
      const oldIndex = backlogProjects.findIndex(p => p.id === active.id)
      const newIndex = backlogProjects.findIndex(p => p.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = [...backlogProjects]
        const [movedProject] = reordered.splice(oldIndex, 1)
        if (movedProject) {
          reordered.splice(newIndex, 0, movedProject)
          onReorder(reordered)
          posthog?.capture('queue_reordered', { stream })
        }
      }
    }
  }

  const handleActivateClick = (project: Project) => {
    // Show activation confirmation dialog
    setDialogMode('activate')
    setPendingProject(project)
  }

  const handleReleaseClick = () => {
    // Show release confirmation dialog
    setDialogMode('release')
    setPendingProject(null) // No incoming project for release
  }

  const handleConfirm = () => {
    // Switch to the appropriate tab based on where the outgoing project will go
    if (tabledProject) {
      if (outgoingProjectHasProgress) {
        // Project stays active, switch to Active tab
        setQueueView('active')
      } else {
        // Project goes to backlog, switch to Backlog tab
        setQueueView('backlog')
      }
    }

    if (dialogMode === 'activate' && pendingProject) {
      posthog?.capture('project_tabled', { stream, projectId: pendingProject.id })
      onActivateToTable(pendingProject)
    } else if (dialogMode === 'release') {
      posthog?.capture('project_released', { stream })
      onReleaseFromTable()
    }
    setPendingProject(null)
    setDialogMode('activate') // Reset to default mode
  }

  const handleCancel = () => {
    setPendingProject(null)
    setDialogMode('activate') // Reset to default mode to close release dialog
  }

  // Dialog is open when:
  // - activate mode: pendingProject is set
  // - release mode: dialogMode is 'release' and we have a tabledProject
  const isDialogOpen =
    (dialogMode === 'activate' && !!pendingProject) ||
    (dialogMode === 'release' && !!tabledProject && !pendingProject)

  // Stream-specific styles
  const streamColor = stream === 'gold' ? '#d8a650' : '#c5ced8'
  const streamBgGradient =
    stream === 'gold'
      ? 'linear-gradient(145deg, rgba(216, 166, 80, 0.1), #fff)'
      : 'linear-gradient(145deg, rgba(197, 206, 216, 0.12), #fff)'

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className='flex flex-col gap-6'>
          {/* On Table Section with Drop Zone */}
          <div className='flex flex-col gap-3'>
            <h3 className='text-xs font-semibold uppercase tracking-wide text-[#8b8680] m-0'>
              ON TABLE
            </h3>
            <TableDropZone stream={stream} hasProject={!!tabledProject}>
              {tabledProject ? (
                <div
                  className='flex items-start gap-3 p-4 bg-white border-2 rounded-xl transition-all duration-150'
                  style={{
                    borderColor: streamColor,
                    background: streamBgGradient,
                  }}
                >
                  <div className='flex-1 min-w-0'>
                    <div className='font-semibold text-[#2f2b27] text-[0.95rem]'>
                      {tabledProject.name}
                    </div>
                    <div className='text-xs text-[#8b8680] mt-0.5'>
                      {tabledProject.category && <span>{tabledProject.category}</span>}
                    </div>
                    {/* Progress bar or Unstarted label */}
                    {outgoingProjectHasProgress ? (
                      <div className='h-1 bg-[#e8e4de] rounded mt-2 overflow-hidden'>
                        <div
                          className='h-full rounded transition-all duration-300'
                          style={{
                            width: `${tabledProjectCompletionPercentage}%`,
                            backgroundColor: streamColor,
                          }}
                        />
                      </div>
                    ) : (
                      <div className='text-xs text-[#8b8680] italic mt-1'>Unstarted</div>
                    )}
                  </div>
                  <div className='flex gap-2 flex-shrink-0'>
                    <button
                      type='button'
                      className='text-xs py-1.5 px-3 rounded-lg bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27] whitespace-nowrap'
                      onClick={handleViewTabledProject}
                    >
                      View
                    </button>
                    <button
                      type='button'
                      className='text-xs py-1.5 px-3 rounded-lg bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27] whitespace-nowrap'
                      onClick={handleReleaseClick}
                    >
                      Release
                    </button>
                    <button
                      type='button'
                      className='text-xs py-1.5 px-3 rounded-lg bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27] whitespace-nowrap'
                      onClick={() => setShowArchiveConfirm(true)}
                    >
                      Archive
                    </button>
                  </div>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center p-8 bg-black/[0.02] border-2 border-dashed border-[#e8e4de] rounded-xl text-center text-[#8b8680]'>
                  <span>No project on table</span>
                  <span className='text-sm mt-1 opacity-70'>
                    Drag a project here or click "Activate to Table"
                  </span>
                </div>
              )}
            </TableDropZone>
          </div>

          {/* Queue Section with Toggle */}
          <div className='flex flex-col gap-3'>
            {/* Toggle between Backlog and Active */}
            <div className='flex gap-0 mb-4 border border-[#e8e4de] rounded-lg overflow-hidden'>
              <button
                type='button'
                className={`flex-1 py-2 px-4 border-none text-sm font-medium cursor-pointer transition-all duration-150 ${
                  queueView === 'backlog'
                    ? 'bg-[#2f2b27] text-white'
                    : 'bg-transparent text-[#8b8680] hover:bg-[#faf9f7]'
                }`}
                style={{
                  borderRight: '1px solid #e8e4de',
                }}
                onClick={() => setQueueView('backlog')}
              >
                Sorting ({backlogProjects.length})
              </button>
              <button
                type='button'
                className={`flex-1 py-2 px-4 border-none text-sm font-medium cursor-pointer transition-all duration-150 ${
                  queueView === 'active'
                    ? 'bg-[#2f2b27] text-white'
                    : 'bg-transparent text-[#8b8680] hover:bg-[#faf9f7]'
                }`}
                onClick={() => setQueueView('active')}
              >
                Active ({activeProjects.length})
              </button>
            </div>

            {displayedProjects.length === 0 ? (
              <div className='p-4 text-[#8b8680] text-sm italic'>
                {queueView === 'backlog'
                  ? `No projects in sorting. Complete Stage 4 in the Drafting Room to add projects.`
                  : `No active projects.`}
              </div>
            ) : (
              <SortableContext
                items={displayedProjects.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className='flex flex-col gap-2'>
                  {displayedProjects.map((project, index) => (
                    <SortableProjectCard
                      key={project.id}
                      project={project}
                      index={index}
                      stream={stream}
                      onActivateToTable={handleActivateClick}
                      isActiveView={queueView === 'active'}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedProject && (
            <div
              className='flex items-start gap-3 p-4 bg-white border border-[#e8e4de] rounded-xl shadow-lg rotate-2'
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: streamColor,
              }}
            >
              <span className='text-xs font-semibold text-[#8b8680] bg-[#faf9f7] py-1 px-2 rounded min-w-[2rem] text-center'>
                #{displayedProjects.findIndex(p => p.id === draggedProject.id) + 1}
              </span>
              <div className='flex-1 min-w-0'>
                <div className='font-medium text-sm text-[#2f2b27] truncate'>
                  {draggedProject.name}
                </div>
                <div className='text-xs text-[#8b8680] mt-0.5'>
                  {draggedProject.category && <span>{draggedProject.category}</span>}
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Confirmation Dialog */}
      <TableConfirmDialog
        isOpen={isDialogOpen}
        mode={dialogMode}
        incomingProject={pendingProject}
        outgoingProject={tabledProject}
        outgoingHasProgress={outgoingProjectHasProgress}
        allTasksDone={allTasksDone}
        stream={stream}
        onConfirm={handleConfirm}
        onComplete={onCompleteProject}
        onCancel={handleCancel}
      />

      {/* Archive Confirmation Dialog */}
      {showArchiveConfirm && tabledProject && (
        <div
          className='fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]'
          onClick={() => setShowArchiveConfirm(false)}
        >
          <div
            className='bg-white rounded-xl p-6 max-w-[400px] w-[90%] shadow-[0_8px_32px_rgba(0,0,0,0.2)]'
            onClick={e => e.stopPropagation()}
          >
            <h3 className='m-0 mb-4 text-lg font-semibold text-[#2f2b27]'>Archive Project</h3>
            <p className='m-0 mb-6 text-sm text-[#2f2b27] leading-relaxed'>
              Are you sure you want to archive <strong>{tabledProject.name}</strong>? This will
              remove it from your active projects and release it from the table. You can unarchive
              it later from the Life Map.
            </p>
            <div className='flex gap-3 justify-end'>
              <button
                type='button'
                className='py-2 px-5 rounded-lg text-sm font-medium bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27]'
                onClick={() => setShowArchiveConfirm(false)}
              >
                Cancel
              </button>
              <button
                type='button'
                className='py-2 px-5 rounded-lg text-sm font-medium bg-[#2f2b27] text-white border-none cursor-pointer transition-all duration-150 hover:bg-black'
                onClick={() => {
                  onArchiveProject()
                  setShowArchiveConfirm(false)
                }}
              >
                Archive Project
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
