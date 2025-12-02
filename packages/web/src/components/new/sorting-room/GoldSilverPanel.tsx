import React from 'react'
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

export interface GoldSilverPanelProps {
  stream: 'gold' | 'silver'
  tabledProject: Project | null
  queuedProjects: Project[]
  onActivateToTable: (project: Project) => void
  onReleaseFromTable: () => void
  onReorder: (projects: Project[]) => void
  draggedProject: Project | null
  setDraggedProject: (project: Project | null) => void
}

/**
 * Gold/Silver Panel - Shows tabled project and queue with drag-and-drop
 * Reusable for both Gold and Silver streams
 */
export const GoldSilverPanel: React.FC<GoldSilverPanelProps> = ({
  stream,
  tabledProject,
  queuedProjects,
  onActivateToTable,
  onReleaseFromTable,
  onReorder,
  draggedProject,
  setDraggedProject,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    const project = queuedProjects.find(p => p.id === event.active.id)
    setDraggedProject(project ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedProject(null)

    if (!over) return

    // Check if dropped on table drop zone
    if (over.id === `table-drop-${stream}`) {
      const project = queuedProjects.find(p => p.id === active.id)
      if (project) {
        onActivateToTable(project)
      }
      return
    }

    // Handle reordering within queue
    if (active.id !== over.id) {
      const oldIndex = queuedProjects.findIndex(p => p.id === active.id)
      const newIndex = queuedProjects.findIndex(p => p.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = [...queuedProjects]
        const [movedProject] = reordered.splice(oldIndex, 1)
        if (movedProject) {
          reordered.splice(newIndex, 0, movedProject)
          onReorder(reordered)
        }
      }
    }
  }

  return (
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
                  onClick={onReleaseFromTable}
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

        {/* Queue Section */}
        <div className='sorting-room-section'>
          <h3 className='sorting-room-section-title'>QUEUE ({queuedProjects.length})</h3>
          {queuedProjects.length === 0 ? (
            <div className='sorting-room-empty-queue'>
              No projects in {stream} queue. Complete Stage 4 in the Drafting Room to add projects.
            </div>
          ) : (
            <SortableContext
              items={queuedProjects.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className='sorting-room-queue-list'>
                {queuedProjects.map((project, index) => (
                  <SortableProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    stream={stream}
                    onActivateToTable={onActivateToTable}
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
              #{queuedProjects.findIndex(p => p.id === draggedProject.id) + 1}
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
  )
}
