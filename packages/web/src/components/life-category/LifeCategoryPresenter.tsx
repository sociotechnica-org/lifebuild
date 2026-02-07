import React, { useMemo, useState } from 'react'
import type { PlanningAttributes } from '@lifebuild/shared'
import type { Project } from '@lifebuild/shared/schema'
import { ProjectCard } from '../projects/ProjectCard/ProjectCard.js'
import { ProjectCreationView } from '../project-creation/ProjectCreationView.js'
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
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ConfirmModal } from '../ui/ConfirmModal/ConfirmModal.js'

export type CategoryTab = 'planning' | 'active' | 'completed'
export type PlanningSubTab = 'project-creation' | 'project-plans' | 'backlog'

export interface LifeCategoryPresenterProps {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon?: string
  selectedTab: CategoryTab
  selectedSubTab: PlanningSubTab | null
  activeProjects: Project[]
  completedProjects: Project[]
  inProgressPlans: Project[]
  backlogProjects: Project[]
  onTabChange: (tab: CategoryTab) => void
  onSubTabChange: (subTab: PlanningSubTab) => void
  onProjectClick: (project: Project) => void
  onBacklogReorder?: (event: DragEndEvent) => void
  onActivateProject?: (project: Project) => Promise<void> | void
}

// Sortable backlog project card component
interface SortableBacklogProjectProps {
  project: Project
  index: number
  categoryColor: string
  onProjectClick: (project: Project) => void
  isDragInProgress: boolean
  onActivateClick?: (project: Project) => void
  isActivationInProgress: boolean
  activationTargetId?: string
}

const SortableBacklogProject: React.FC<SortableBacklogProjectProps> = ({
  project,
  index,
  categoryColor,
  onProjectClick,
  isDragInProgress,
  onActivateClick,
  isActivationInProgress,
  activationTargetId,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderLeft: `4px solid ${categoryColor}`,
  }

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if we just finished dragging
    if (isDragInProgress) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    onProjectClick(project)
  }

  const handleActivateClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isActivationInProgress) return
    onActivateClick?.(project)
  }

  const isActivatingThisProject =
    isActivationInProgress && activationTargetId && activationTargetId === project.id

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className='flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer'
        onClick={handleClick}
      >
        <div
          {...listeners}
          className='flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 cursor-grab active:cursor-grabbing'
        >
          {index + 1}
        </div>
        <div className='flex-1'>
          <h3 className='font-medium text-gray-900'>{project.name}</h3>
          {project.description && (
            <p className='text-sm text-gray-500 mt-1'>{project.description}</p>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <div
            className='text-xs px-2 py-1 rounded-md'
            style={{ border: `1px solid ${categoryColor}`, color: categoryColor }}
          >
            Stage 4
          </div>
          <button
            type='button'
            onClick={handleActivateClick}
            disabled={isActivationInProgress}
            className='px-3 py-1.5 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {isActivatingThisProject ? 'Activating...' : 'Activate to Table'}
          </button>
        </div>
      </div>
    </div>
  )
}

export const LifeCategoryPresenter: React.FC<LifeCategoryPresenterProps> = ({
  categoryName,
  categoryColor,
  categoryIcon,
  selectedTab,
  selectedSubTab,
  activeProjects,
  completedProjects,
  inProgressPlans,
  backlogProjects,
  onTabChange,
  onSubTabChange,
  onProjectClick,
  onBacklogReorder,
  onActivateProject,
}) => {
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [isDragInProgress, setIsDragInProgress] = useState(false)
  const [projectToActivate, setProjectToActivate] = useState<Project | null>(null)
  const [isConfirmActivating, setIsConfirmActivating] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragInProgress(true)
    const project = backlogProjects.find(p => p.id === event.active.id)
    setActiveProject(project || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveProject(null)
    if (onBacklogReorder) {
      onBacklogReorder(event)
    }
    // Reset drag state after a brief delay to prevent immediate click
    setTimeout(() => setIsDragInProgress(false), 100)
  }

  const handleActivateClick = (project: Project) => {
    setProjectToActivate(project)
  }

  const handleCloseActivateModal = () => {
    if (isConfirmActivating) return
    setProjectToActivate(null)
  }

  const handleConfirmActivate = async () => {
    if (!projectToActivate || !onActivateProject) return
    setIsConfirmActivating(true)
    try {
      await onActivateProject(projectToActivate)
      setProjectToActivate(null)
    } catch (error) {
      console.error('Failed to activate project', error)
    } finally {
      setIsConfirmActivating(false)
    }
  }

  const activationDetails = useMemo(() => {
    if (!projectToActivate) return null
    const attrs = (projectToActivate.attributes as PlanningAttributes | null) || {}

    const archetype = attrs.archetype ? attrs.archetype : null
    const estimatedDuration = attrs.estimatedDuration
    const deadline = attrs.deadline ? new Date(attrs.deadline) : null
    const objective = attrs.objectives ? String(attrs.objectives) : null

    return {
      archetype,
      estimatedDuration,
      deadline,
      objective,
    }
  }, [projectToActivate])

  const activationMessage = projectToActivate ? (
    <div className='space-y-3 text-sm'>
      <p>
        Activating <span className='font-medium text-gray-900'>{projectToActivate.name}</span> will
        move it into your Active projects so you can start execution.
      </p>
      {activationDetails?.objective ? (
        <div>
          <div className='text-xs uppercase font-semibold tracking-wide text-gray-400'>
            Objective
          </div>
          <p className='text-gray-700 mt-1'>{activationDetails.objective}</p>
        </div>
      ) : null}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        {activationDetails?.archetype ? (
          <div>
            <div className='text-xs uppercase font-semibold tracking-wide text-gray-400'>
              Archetype
            </div>
            <p className='text-gray-700 mt-1 capitalize'>{activationDetails.archetype}</p>
          </div>
        ) : null}
        {activationDetails?.deadline ? (
          <div>
            <div className='text-xs uppercase font-semibold tracking-wide text-gray-400'>
              Deadline
            </div>
            <p className='text-gray-700 mt-1'>
              {new Intl.DateTimeFormat(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).format(activationDetails.deadline)}
            </p>
          </div>
        ) : null}
        {activationDetails?.estimatedDuration ? (
          <div>
            <div className='text-xs uppercase font-semibold tracking-wide text-gray-400'>
              Est. Duration
            </div>
            <p className='text-gray-700 mt-1'>{activationDetails.estimatedDuration} hrs</p>
          </div>
        ) : null}
      </div>
      <p className='text-gray-600'>
        You can always adjust tasks and metadata from the project workspace after activation.
      </p>
    </div>
  ) : null

  const activationTargetId = projectToActivate?.id
  const tabs: { id: CategoryTab; label: string }[] = [
    { id: 'planning', label: 'Planning' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
  ]

  const planningSubTabs: { id: PlanningSubTab; label: string }[] = [
    { id: 'project-creation', label: 'Project Creation' },
    { id: 'project-plans', label: 'Project Plans' },
    { id: 'backlog', label: 'Backlog' },
  ]

  return (
    <>
      <div className='h-full bg-white flex flex-col'>
        {/* Header */}
        <div className='border-b border-gray-200 bg-white px-6 py-4'>
          <div className='mb-4'>
            <h1 className='text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2'>
              {categoryIcon && <span className='text-2xl'>{categoryIcon}</span>}
              {categoryName}
            </h1>
            <p className='text-gray-600 text-sm'>Manage projects in this life category</p>
          </div>

          {/* Main Tabs */}
          <div className='flex gap-6 border-b border-gray-200'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`pb-3 px-1 text-sm font-medium transition-colors relative cursor-pointer ${
                  selectedTab === tab.id
                    ? 'text-gray-900 border-b-2'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={
                  selectedTab === tab.id
                    ? {
                        borderBottomColor: categoryColor,
                      }
                    : undefined
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Planning Sub-tabs (only visible when Planning tab is active) */}
        {selectedTab === 'planning' && (
          <div className='border-b border-gray-200 bg-gray-50 px-6'>
            <div className='flex gap-4 pt-2'>
              {planningSubTabs.map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => onSubTabChange(subTab.id)}
                  className={`pb-2 px-1 text-xs font-medium transition-colors cursor-pointer ${
                    selectedSubTab === subTab.id
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className='flex-1 overflow-y-auto'>
          {selectedTab === 'planning' && selectedSubTab === 'project-creation' && (
            <ProjectCreationView />
          )}

          {selectedTab === 'planning' && selectedSubTab === 'project-plans' && (
            <div className='p-6'>
              {/* Stage Header */}
              <div className='max-w-2xl mx-auto mb-8'>
                <div className='flex items-center gap-2 mb-2'>
                  <div
                    className='w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold'
                    style={{ backgroundColor: categoryColor }}
                  >
                    1-3
                  </div>
                  <div>
                    <h2 className='text-lg font-semibold text-gray-900'>In-Progress Plans</h2>
                    <p className='text-sm text-gray-500'>Continue planning your projects</p>
                  </div>
                </div>
                <div className='flex gap-2 mt-4'>
                  <div className='h-2 flex-1 rounded' style={{ backgroundColor: categoryColor }} />
                  <div className='h-2 flex-1 rounded' style={{ backgroundColor: categoryColor }} />
                  <div className='h-2 flex-1 rounded' style={{ backgroundColor: categoryColor }} />
                  <div className='h-2 flex-1 bg-gray-200 rounded' />
                </div>
              </div>

              {inProgressPlans.length === 0 ? (
                <div className='text-center py-12'>
                  <h2 className='text-xl font-semibold text-gray-600 mb-2'>
                    No projects in planning
                  </h2>
                  <p className='text-gray-500'>
                    Start a new project in Project Creation to begin planning.
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {inProgressPlans.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => onProjectClick(project)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'planning' && selectedSubTab === 'backlog' && (
            <div className='p-6'>
              {/* Stage Header */}
              <div className='max-w-2xl mx-auto mb-8'>
                <div className='flex items-center gap-2 mb-2'>
                  <div
                    className='w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold'
                    style={{ backgroundColor: categoryColor }}
                  >
                    4
                  </div>
                  <div>
                    <h2 className='text-lg font-semibold text-gray-900'>Stage 4: Backlog</h2>
                    <p className='text-sm text-gray-500'>
                      Projects ready for prioritization - drag to reorder
                    </p>
                  </div>
                </div>
                <div className='flex gap-2 mt-4'>
                  <div className='h-2 flex-1 rounded' style={{ backgroundColor: categoryColor }} />
                  <div className='h-2 flex-1 rounded' style={{ backgroundColor: categoryColor }} />
                  <div className='h-2 flex-1 rounded' style={{ backgroundColor: categoryColor }} />
                  <div className='h-2 flex-1 rounded' style={{ backgroundColor: categoryColor }} />
                </div>
              </div>

              {backlogProjects.length === 0 ? (
                <div className='text-center py-12'>
                  <h2 className='text-xl font-semibold text-gray-600 mb-2'>
                    No projects in backlog
                  </h2>
                  <p className='text-gray-500'>
                    Complete planning (Stage 4) for a project to add it to the backlog.
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={backlogProjects.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className='space-y-3'>
                      {backlogProjects.map((project, index) => (
                        <SortableBacklogProject
                          key={project.id}
                          project={project}
                          index={index}
                          categoryColor={categoryColor}
                          onProjectClick={onProjectClick}
                          isDragInProgress={isDragInProgress}
                          onActivateClick={handleActivateClick}
                          isActivationInProgress={isConfirmActivating}
                          activationTargetId={activationTargetId}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeProject ? (
                      <div className='flex items-center gap-4 p-4 bg-white border-2 border-blue-400 rounded-lg shadow-lg'>
                        <div className='flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600'>
                          {backlogProjects.findIndex(p => p.id === activeProject.id) + 1}
                        </div>
                        <div className='flex-1'>
                          <h3 className='font-medium text-gray-900'>{activeProject.name}</h3>
                          {activeProject.description && (
                            <p className='text-sm text-gray-500 mt-1'>
                              {activeProject.description}
                            </p>
                          )}
                        </div>
                        <div className='text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md'>
                          Stage 4
                        </div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
          )}

          {selectedTab === 'active' && (
            <div className='p-6'>
              {activeProjects.length === 0 ? (
                <div className='text-center py-12'>
                  <h2 className='text-xl font-semibold text-gray-600 mb-2'>No active projects</h2>
                  <p className='text-gray-500'>
                    Create projects in the Planning tab to get started.
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {activeProjects.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => onProjectClick(project)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'completed' && (
            <div className='p-6'>
              {completedProjects.length === 0 ? (
                <div className='text-center py-12'>
                  <h2 className='text-xl font-semibold text-gray-600 mb-2'>
                    No completed projects
                  </h2>
                  <p className='text-gray-500'>
                    Completed projects will appear here when you finish them.
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {completedProjects.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => onProjectClick(project)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!projectToActivate}
        onClose={handleCloseActivateModal}
        onConfirm={handleConfirmActivate}
        title={projectToActivate ? `Activate ${projectToActivate.name}?` : 'Activate project'}
        message={activationMessage}
        confirmText='Activate Project'
        cancelText='Not Yet'
        isLoading={isConfirmActivating}
      />
    </>
  )
}
