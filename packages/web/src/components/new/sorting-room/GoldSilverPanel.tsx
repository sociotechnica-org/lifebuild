import React, { useState } from 'react'
import type { Project } from '@work-squared/shared/schema'
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

export type QueueView = 'backlog' | 'active'

export interface GoldSilverPanelProps {
  stream: 'gold' | 'silver'
  tabledProject: Project | null
  backlogProjects: Project[]
  activeProjects: Project[]
  onActivateToTable: (project: Project) => void
  onReleaseFromTable: () => void
  onReorder: (projects: Project[]) => void
  draggedProject: Project | null
  setDraggedProject: (project: Project | null) => void
  outgoingProjectHasProgress: boolean
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
  onReorder,
  draggedProject,
  setDraggedProject,
  outgoingProjectHasProgress,
}) => {
  const [queueView, setQueueView] = useState<QueueView>('backlog')
  const [pendingProject, setPendingProject] = useState<Project | null>(null)
  const [dialogMode, setDialogMode] = useState<DialogMode>('activate')

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
      onActivateToTable(pendingProject)
    } else if (dialogMode === 'release') {
      onReleaseFromTable()
    }
    setPendingProject(null)
  }

  const handleCancel = () => {
    setPendingProject(null)
  }

  // Dialog is open when:
  // - activate mode: pendingProject is set
  // - release mode: dialogMode is 'release' and we have a tabledProject
  const isDialogOpen =
    (dialogMode === 'activate' && !!pendingProject) ||
    (dialogMode === 'release' && !!tabledProject && !pendingProject)

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className='sorting-room-stream-panel'>
          {/* On Table Section with Drop Zone */}
          <div className='sorting-room-section'>
            <h3 className='sorting-room-section-title'>ON TABLE</h3>
            <TableDropZone stream={stream} hasProject={!!tabledProject}>
              {tabledProject ? (
                <div className={`sorting-room-project-card tabled ${stream}`}>
                  <div className='sorting-room-project-info'>
                    <div className='sorting-room-project-name'>{tabledProject.name}</div>
                    <div className='sorting-room-project-meta'>
                      {tabledProject.category && <span>{tabledProject.category}</span>}
                    </div>
                  </div>
                  <button
                    type='button'
                    className='sorting-room-action-btn release'
                    onClick={handleReleaseClick}
                  >
                    Release to Queue
                  </button>
                </div>
              ) : (
                <div className='sorting-room-empty-slot'>
                  <span>No {stream} project on table</span>
                  <span className='sorting-room-empty-hint'>
                    Drag a project here or click "Activate to Table"
                  </span>
                </div>
              )}
            </TableDropZone>
          </div>

          {/* Queue Section with Toggle */}
          <div className='sorting-room-section'>
            {/* Toggle between Backlog and Active */}
            <div className='sorting-room-queue-toggle'>
              <button
                type='button'
                className={`sorting-room-toggle-btn ${queueView === 'backlog' ? 'active' : ''}`}
                onClick={() => setQueueView('backlog')}
              >
                Backlog ({backlogProjects.length})
              </button>
              <button
                type='button'
                className={`sorting-room-toggle-btn ${queueView === 'active' ? 'active' : ''}`}
                onClick={() => setQueueView('active')}
              >
                Active ({activeProjects.length})
              </button>
            </div>

            {displayedProjects.length === 0 ? (
              <div className='sorting-room-empty-queue'>
                {queueView === 'backlog'
                  ? `No projects in ${stream} backlog. Complete Stage 4 in the Drafting Room to add projects.`
                  : `No active ${stream} projects.`}
              </div>
            ) : (
              <SortableContext
                items={displayedProjects.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className='sorting-room-queue-list'>
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
            <div className={`sorting-room-project-card queued ${stream} dragging`}>
              <span className='sorting-room-queue-position'>
                #{displayedProjects.findIndex(p => p.id === draggedProject.id) + 1}
              </span>
              <div className='sorting-room-project-info'>
                <div className='sorting-room-project-name'>{draggedProject.name}</div>
                <div className='sorting-room-project-meta'>
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
        stream={stream}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  )
}
