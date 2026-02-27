import React, { useState } from 'react'
import type { Project } from '@lifebuild/shared/schema'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableProjectCard } from './SortableProjectCard.js'
import { usePostHog } from '../../lib/analytics.js'

export type QueueView = 'backlog' | 'active'

export interface GoldSilverPanelProps {
  stream: 'gold' | 'silver'
  backlogProjects: Project[]
  activeProjects: Project[]
  completableProjectIds: Set<string>
  onActivate: (project: Project) => void
  onMoveToBacklog: (project: Project) => void
  onCompleteProject: (project: Project) => void
  onArchiveProject: (project: Project) => void
  onReorder: (projects: Project[]) => void
}

export const GoldSilverPanel: React.FC<GoldSilverPanelProps> = ({
  stream,
  backlogProjects,
  activeProjects,
  completableProjectIds,
  onActivate,
  onMoveToBacklog,
  onCompleteProject,
  onArchiveProject,
  onReorder,
}) => {
  const posthog = usePostHog()
  const [queueView, setQueueView] = useState<QueueView>('backlog')
  const [draggedProject, setDraggedProject] = useState<Project | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    if (queueView !== 'backlog') return
    const project = backlogProjects.find(p => p.id === event.active.id)
    setDraggedProject(project ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedProject(null)

    if (!over || queueView !== 'backlog' || active.id === over.id) return

    const oldIndex = backlogProjects.findIndex(p => p.id === active.id)
    const newIndex = backlogProjects.findIndex(p => p.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...backlogProjects]
    const [movedProject] = reordered.splice(oldIndex, 1)
    if (!movedProject) return

    reordered.splice(newIndex, 0, movedProject)
    onReorder(reordered)
    posthog?.capture('sorting_queue_reordered', { stream })
  }

  const streamColor = stream === 'gold' ? '#d8a650' : '#c5ced8'

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className='flex flex-col gap-3'>
        <div className='flex gap-0 mb-2 border border-[#e8e4de] rounded-lg overflow-hidden'>
          <button
            type='button'
            className={`flex-1 py-2 px-4 border-none text-sm font-medium cursor-pointer transition-all duration-150 ${
              queueView === 'backlog'
                ? 'bg-[#2f2b27] text-white'
                : 'bg-transparent text-[#8b8680] hover:bg-[#faf9f7]'
            }`}
            style={{ borderRight: '1px solid #e8e4de' }}
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

        {queueView === 'backlog' ? (
          backlogProjects.length === 0 ? (
            <div className='p-4 text-[#8b8680] text-sm italic'>
              No projects in sorting. Complete Stage 4 in the Drafting Room to add projects.
            </div>
          ) : (
            <SortableContext
              items={backlogProjects.map(project => project.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className='flex flex-col gap-2'>
                {backlogProjects.map((project, index) => (
                  <SortableProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    stream={stream}
                    primaryActionLabel='Activate'
                    onPrimaryAction={selectedProject => {
                      posthog?.capture('sorting_project_activated', {
                        stream,
                        projectId: selectedProject.id,
                      })
                      onActivate(selectedProject)
                      setQueueView('active')
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          )
        ) : activeProjects.length === 0 ? (
          <div className='p-4 text-[#8b8680] text-sm italic'>No active projects.</div>
        ) : (
          <SortableContext
            items={activeProjects.map(project => project.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className='flex flex-col gap-2'>
              {activeProjects.map((project, index) => {
                const canComplete = completableProjectIds.has(project.id)

                return (
                  <SortableProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    stream={stream}
                    draggable={false}
                    primaryActionLabel='Move to Backlog'
                    onPrimaryAction={selectedProject => {
                      posthog?.capture('sorting_project_moved_to_backlog', {
                        stream,
                        projectId: selectedProject.id,
                      })
                      onMoveToBacklog(selectedProject)
                    }}
                    extraActions={
                      <>
                        <button
                          type='button'
                          className={`text-xs py-1.5 px-3 rounded-lg border whitespace-nowrap ${
                            canComplete
                              ? 'bg-transparent border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27]'
                              : 'bg-[#f5f3f0] border-[#ece7df] text-[#b6aea3] cursor-not-allowed'
                          }`}
                          onClick={() => {
                            if (!canComplete) return
                            posthog?.capture('sorting_project_completed', {
                              stream,
                              projectId: project.id,
                            })
                            onCompleteProject(project)
                          }}
                          disabled={!canComplete}
                          title={
                            canComplete ? 'Mark project as completed' : 'Complete all tasks first'
                          }
                        >
                          Complete
                        </button>
                        <button
                          type='button'
                          className='text-xs py-1.5 px-3 rounded-lg bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27] whitespace-nowrap'
                          onClick={() => {
                            posthog?.capture('sorting_project_archived', {
                              stream,
                              projectId: project.id,
                            })
                            onArchiveProject(project)
                          }}
                        >
                          Archive
                        </button>
                      </>
                    }
                  />
                )
              })}
            </div>
          </SortableContext>
        )}
      </div>

      <DragOverlay>
        {draggedProject && (
          <div
            className='flex items-start gap-3 p-4 bg-white border border-[#e8e4de] rounded-xl shadow-lg rotate-2'
            style={{ borderLeftWidth: '4px', borderLeftColor: streamColor }}
          >
            <span className='text-xs font-semibold text-[#8b8680] bg-[#faf9f7] py-1 px-2 rounded min-w-[2rem] text-center'>
              #{backlogProjects.findIndex(project => project.id === draggedProject.id) + 1}
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
  )
}
