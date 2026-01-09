import React, { useState } from 'react'
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { formatDate } from '../../../utils/dates.js'
import { useQuery, useStore } from '../../../livestore-compat.js'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'
import {
  getProjectTasks$,
  getAllDocuments$,
  getDocumentProjectsByProject$,
  getProjectWorkers$,
  getWorkers$,
} from '@lifebuild/shared/queries'
import type { Task, Document, Worker, TaskStatus } from '@lifebuild/shared/schema'
import { events } from '@lifebuild/shared/schema'
import { STATUS_COLUMNS, getCategoryInfo } from '@lifebuild/shared'
import { ProjectProvider, useProject } from '../../../contexts/ProjectContext.js'
import { KanbanBoard } from '../../tasks/kanban/KanbanBoard.js'
import { TaskModal } from '../../tasks/TaskModal/TaskModal.js'
import { DocumentCreateModal } from '../../documents/DocumentCreateModal/DocumentCreateModal.js'
import { AddExistingDocumentModal } from '../../documents/AddExistingDocumentModal/AddExistingDocumentModal.js'
import { EditProjectModal } from '../EditProjectModal/EditProjectModal.js'
import { LoadingState } from '../../ui/LoadingState.js'
import { WorkerCard } from '../../workers/WorkerCard/WorkerCard.js'
import { ProjectContacts } from '../ProjectContacts.js'
import { useAuth } from '../../../contexts/AuthContext.js'
import {
  calculateStatusTaskReorder,
  calculateStatusDropTarget,
} from '../../../utils/statusTaskReordering.js'
import type { PlanningAttributes } from '@lifebuild/shared'
import { useTaskStatusChange } from '../../../hooks/useTaskStatusChange.js'

// Component for the actual workspace content
const ProjectWorkspaceContent: React.FC = () => {
  const { project, projectId, isLoading } = useProject()
  const { store } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { changeTaskStatus } = useTaskStatusChange()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [insertionPreview, setInsertionPreview] = useState<{
    statusId: string
    position: number
  } | null>(null)
  const [dragOverAddCard, setDragOverAddCard] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'tasks' | 'documents' | 'team' | 'contacts'>('tasks')
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false)
  const [isAddExistingDocumentModalOpen, setIsAddExistingDocumentModalOpen] = useState(false)
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false)

  if (isLoading) {
    return <LoadingState message='Loading project...' />
  }

  if (!projectId || !project) {
    return <LoadingState message='Project not found' />
  }

  const tasks = useQuery(getProjectTasks$(projectId)) ?? []

  // Check if project is in planning status
  const projectAttrs = project?.attributes as PlanningAttributes | null
  const isInPlanning = projectAttrs?.status === 'planning'
  const planningStage = projectAttrs?.planningStage

  // Only show "Done Planning" button for stage 3 (task planning stage)
  const showDonePlanningButton = isInPlanning && planningStage === 3

  // Handle completing planning stage 3
  const handleDonePlanning = () => {
    if (!projectId || !project) return

    // Update project attributes to advance to stage 4
    const updatedAttributes: PlanningAttributes = {
      ...(projectAttrs || {}),
      status: 'planning',
      planningStage: 4,
    }

    store.commit(
      events.projectAttributesUpdated({
        id: projectId,
        attributes: updatedAttributes as any,
        updatedAt: new Date(),
        actorId: user?.id,
      })
    )

    // Navigate back to category backlog view
    if (project.category) {
      navigate(
        preserveStoreIdInUrl(`/old/category/${project.category}?tab=planning&subtab=backlog`)
      )
    }
  }

  // Get stage label for planning indicator
  const getPlanningStageLabel = (stage?: number) => {
    switch (stage) {
      case 1:
        return 'Stage 1: Basic Details'
      case 2:
        return 'Stage 2: Scoped'
      case 3:
        return 'Stage 3: Task Planning'
      case 4:
        return 'Stage 4: Ready for Backlog'
      default:
        return 'Planning'
    }
  }

  // Get documents for project using client-side filtering for now
  const documentProjects = useQuery(getDocumentProjectsByProject$(projectId)) ?? []
  const allDocuments = useQuery(getAllDocuments$) ?? []
  const documentIds = new Set(documentProjects.map(dp => dp.documentId))
  const documents = allDocuments.filter(doc => documentIds.has(doc.id)) as Document[]

  // Get workers assigned to this project
  const workerProjects = useQuery(getProjectWorkers$(projectId)) ?? []
  const allWorkers = useQuery(getWorkers$) ?? []
  const team: Worker[] = allWorkers.filter(w => workerProjects.some(wp => wp.workerId === w.id))

  // Group tasks by status
  const tasksByStatus = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    STATUS_COLUMNS.forEach(statusColumn => {
      grouped[statusColumn.status] = tasks.filter(task => task.status === statusColumn.status)
    })
    return grouped
  }, [tasks])

  // Find task by ID helper
  const findTask = (taskId: string): Task | undefined => {
    return tasks.find(task => task.id === taskId)
  }

  // Handle task card click
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId)
  }

  // Handle modal close
  const handleModalClose = () => {
    setSelectedTaskId(null)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string
    const task = findTask(taskId)
    setActiveTask(task || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event
    if (!over || !active) {
      setInsertionPreview(null)
      setDragOverAddCard(null)
      return
    }

    const overId = over.id as string
    const activeTaskId = active.id as string
    const draggedTask = findTask(activeTaskId)

    if (!draggedTask) {
      setInsertionPreview(null)
      setDragOverAddCard(null)
      return
    }

    // Handle dropping over Add Card buttons
    if (overId.startsWith('add-card-')) {
      const targetStatusId = overId.replace('add-card-', '')
      setDragOverAddCard(targetStatusId)
      setInsertionPreview(null)
      return
    }

    // Handle dropping over task cards - show preview for both same and different statuses
    const dropTarget = calculateStatusDropTarget(overId, draggedTask, tasksByStatus)
    if (dropTarget) {
      setInsertionPreview({
        statusId: dropTarget.statusId,
        position: dropTarget.index,
      })
      setDragOverAddCard(null)
    } else {
      setInsertionPreview(null)
      setDragOverAddCard(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    // Clear drag state
    setActiveTask(null)
    setInsertionPreview(null)
    setDragOverAddCard(null)

    if (!over || !active) return

    const taskId = active.id as string
    const task = findTask(taskId)
    if (!task) return

    const overId = over.id as string

    // Calculate drop target
    const dropTarget = calculateStatusDropTarget(overId, task, tasksByStatus)
    if (!dropTarget) return

    const { statusId: targetStatusId, index: targetIndex } = dropTarget

    // Don't move if dropping in same position
    if (targetStatusId === task.status) {
      const statusTasks = tasksByStatus[targetStatusId]
      if (!statusTasks) return
      const sortedTasks = [...statusTasks].sort((a, b) => a.position - b.position)
      const currentIndex = sortedTasks.findIndex(t => t.id === task.id)
      if (currentIndex === targetIndex) return
    }

    // Calculate reorder operations
    const targetStatusTasks = tasksByStatus[targetStatusId] || []
    const sortedTargetTasks = [...targetStatusTasks].sort((a, b) => a.position - b.position)
    const reorderResults = calculateStatusTaskReorder(
      task,
      targetStatusId as TaskStatus,
      targetIndex,
      sortedTargetTasks
    )

    // Commit position updates
    // For the primary dragged task, use changeTaskStatus to handle auto-activation of bronze projects
    // For other tasks (affected by normalization), use direct events
    reorderResults.forEach(result => {
      if (result.taskId === task.id) {
        // Use the hook for the dragged task to trigger auto-activation if needed
        changeTaskStatus(task, result.toStatus, result.position, result.updatedAt)
      } else {
        // Use direct event for other tasks (position normalization)
        store.commit(
          events.taskStatusChanged({
            taskId: result.taskId,
            toStatus: result.toStatus,
            position: result.position,
            updatedAt: result.updatedAt,
          })
        )
      }
    })
  }

  // Get category information for breadcrumb
  const categoryInfo = project?.category ? getCategoryInfo(project.category as any) : null
  const categoryBackUrl = project?.category
    ? `/old/category/${project.category}` // No tab param - use smart defaults
    : '/old/projects'
  const categoryLabel = categoryInfo?.name || 'Projects'

  return (
    <div className='h-full bg-white flex flex-col'>
      {/* Project Header with Breadcrumb */}
      <div className='border-b border-gray-200 bg-white px-6 py-4'>
        <div className='flex items-center gap-4 mb-3'>
          <Link
            to={preserveStoreIdInUrl(categoryBackUrl)}
            className='flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors'
            aria-label={`Back to ${categoryLabel}`}
          >
            <svg
              className='w-4 h-4 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </Link>

          {/* Breadcrumb */}
          <nav className='flex items-center text-sm text-gray-500'>
            <Link
              to={preserveStoreIdInUrl(categoryBackUrl)}
              className='hover:text-gray-700 transition-colors flex items-center gap-1.5'
            >
              {categoryInfo?.icon && <span className='text-base'>{categoryInfo.icon}</span>}
              {categoryLabel}
            </Link>
            <svg className='w-4 h-4 mx-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
            <span className='text-gray-900 font-medium'>{project?.name || 'Loading...'}</span>
          </nav>
        </div>

        {/* Planning Stage Indicator */}
        {isInPlanning && planningStage && (
          <div className='mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='flex items-center gap-2'>
                  <div className='w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold'>
                    {planningStage}
                  </div>
                  <span className='text-sm font-medium text-blue-900'>
                    {getPlanningStageLabel(planningStage)}
                  </span>
                </div>
                <div className='flex gap-1'>
                  {[1, 2, 3, 4].map(stage => (
                    <div
                      key={stage}
                      className={`h-2 w-2 rounded-full ${
                        stage < planningStage
                          ? 'bg-blue-400'
                          : stage === planningStage
                            ? 'bg-blue-600'
                            : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className='text-sm text-blue-700'>
                {planningStage === 3
                  ? 'Add and organize your tasks, then click "Done Planning" when ready'
                  : planningStage === 4
                    ? 'Project ready for backlog - set priority in planning view'
                    : 'Continue planning in the Project Creation form'}
              </p>
            </div>
          </div>
        )}

        {/* Project Title and Description */}
        <div className='mb-4'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1'>
              <h1 className='text-xl font-semibold text-gray-900 mb-2'>
                {project?.name || 'Loading...'}
              </h1>
              {project?.description && (
                <p className='text-gray-600 text-sm'>{project.description}</p>
              )}
            </div>
            <div className='flex items-center gap-2'>
              {showDonePlanningButton && (
                <button
                  onClick={handleDonePlanning}
                  className='flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors'
                  aria-label='Done planning'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                  Done Planning
                </button>
              )}
              <button
                onClick={() => setIsEditProjectModalOpen(true)}
                className='flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
                aria-label='Edit project'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
                Edit
              </button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      'Are you sure you want to archive this project? It will be hidden from the main view.'
                    )
                  ) {
                    store.commit(
                      events.projectArchived({
                        id: projectId,
                        archivedAt: new Date(),
                        actorId: user?.id,
                      })
                    )
                    // Navigate back to projects page using React Router
                    navigate(preserveStoreIdInUrl('/old/projects'))
                  }
                }}
                className='flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors'
                aria-label='Archive project'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
                  />
                </svg>
                Archive
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className='flex border-b border-gray-200 -mb-px'>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'team'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Team
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'contacts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Contacts
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className='flex-1 overflow-hidden'>
        {activeTab === 'tasks' && (
          <>
            <KanbanBoard
              statusColumns={STATUS_COLUMNS}
              tasksByStatus={tasksByStatus}
              enableDragAndDrop={true}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              insertionPreview={insertionPreview}
              activeTask={activeTask}
              dragOverAddCard={dragOverAddCard}
              onTaskClick={handleTaskClick}
              showRecurringTasks={true}
              projectId={projectId}
            />
            <TaskModal taskId={selectedTaskId} onClose={handleModalClose} />
          </>
        )}

        {activeTab === 'team' && (
          <div className='p-6'>
            {team.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                {team.map(worker => (
                  <WorkerCard key={worker.id} worker={worker} />
                ))}
              </div>
            ) : (
              <div className='flex items-center justify-center h-64 text-gray-500'>
                <p>No team members assigned</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className='p-6'>
            <ProjectContacts projectId={projectId} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className='p-6'>
            {/* Header with Create Document button */}
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-medium text-gray-900'>Project Documents</h2>
              <div className='flex items-center gap-3'>
                <button
                  onClick={() => setIsAddExistingDocumentModalOpen(true)}
                  className='inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                    />
                  </svg>
                  Add Existing Document
                </button>
                <button
                  onClick={() => setIsDocumentModalOpen(true)}
                  className='inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 4v16m8-8H4'
                    />
                  </svg>
                  Create Document
                </button>
              </div>
            </div>

            {/* Documents list */}
            {documents.length > 0 ? (
              <div className='space-y-3'>
                {documents.map((document: Document) => (
                  <Link
                    key={document.id}
                    to={preserveStoreIdInUrl(`/old/document/${document.id}`)}
                    className='block bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h3 className='text-base font-medium text-gray-900 mb-2'>
                          {document.title || 'Untitled Document'}
                        </h3>
                        {document.content && (
                          <p className='text-sm text-gray-600 line-clamp-2'>
                            {document.content.substring(0, 150)}
                            {document.content.length > 150 && '...'}
                          </p>
                        )}
                        <div className='flex items-center gap-4 mt-3'>
                          <span className='text-xs text-gray-500'>
                            Updated {formatDate(document.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <div className='flex items-center gap-2 ml-4'>
                        <svg
                          className='w-4 h-4 text-gray-400'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={1.5}
                            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className='flex items-center justify-center h-64 text-gray-500'>
                <div className='text-center'>
                  <svg
                    className='w-12 h-12 mx-auto mb-4 text-gray-300'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  <p className='text-lg font-medium mb-1'>No documents yet</p>
                  <p className='text-sm mb-4'>Create your first document to get started</p>
                  <button
                    onClick={() => setIsDocumentModalOpen(true)}
                    className='inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    <svg
                      className='w-4 h-4 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 4v16m8-8H4'
                      />
                    </svg>
                    Create Document
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Create Modal */}
      <DocumentCreateModal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        projectId={projectId}
      />

      {/* Add Existing Document Modal */}
      <AddExistingDocumentModal
        isOpen={isAddExistingDocumentModalOpen}
        onClose={() => setIsAddExistingDocumentModalOpen(false)}
        projectId={projectId}
      />

      {/* Edit Project Modal */}
      {project && isEditProjectModalOpen && (
        <EditProjectModal
          isOpen={isEditProjectModalOpen}
          onClose={() => setIsEditProjectModalOpen(false)}
          project={project}
        />
      )}
    </div>
  )
}

// Main component that provides project context
export function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <ProjectProvider projectId={projectId || null}>
      <ProjectWorkspaceContent />
    </ProjectProvider>
  )
}
