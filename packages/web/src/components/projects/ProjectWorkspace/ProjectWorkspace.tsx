import React, { useState } from 'react'
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { formatDate } from '../../../util/dates.js'
import { useQuery, useStore } from '@livestore/react'
import { useParams, Link } from 'react-router-dom'
import { preserveStoreIdInUrl } from '../../../util/navigation.js'
import {
  getProjectColumns$,
  getProjectTasks$,
  getAllDocuments$,
  getDocumentProjectsByProject$,
  getProjectWorkers$,
  getWorkers$,
  getContacts$,
} from '@work-squared/shared/queries'
import type { Task, Document, Worker, Contact } from '@work-squared/shared/schema'
import { events } from '@work-squared/shared/schema'
import { ProjectProvider, useProject } from '../../../contexts/ProjectContext.js'
import { KanbanBoard } from '../../tasks/kanban/KanbanBoard.js'
import { TaskModal } from '../../tasks/TaskModal/TaskModal.js'
import { DocumentCreateModal } from '../../documents/DocumentCreateModal/DocumentCreateModal.js'
import { AddExistingDocumentModal } from '../../documents/AddExistingDocumentModal/AddExistingDocumentModal.js'
import { LoadingState } from '../../ui/LoadingState.js'
import { WorkerCard } from '../../workers/WorkerCard/WorkerCard.js'
import { ProjectContacts } from '../ProjectContacts.js'
import { calculateTaskReorder, calculateDropTarget } from '../../../utils/taskReordering.js'

// Component for the actual workspace content
const ProjectWorkspaceContent: React.FC = () => {
  const { project, projectId, isLoading } = useProject()
  const { store } = useStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [insertionPreview, setInsertionPreview] = useState<{
    columnId: string
    position: number
  } | null>(null)
  const [dragOverAddCard, setDragOverAddCard] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'tasks' | 'documents' | 'team' | 'contacts'>('tasks')
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false)
  const [isAddExistingDocumentModalOpen, setIsAddExistingDocumentModalOpen] = useState(false)

  if (isLoading) {
    return <LoadingState message='Loading project...' />
  }

  if (!projectId || !project) {
    return <LoadingState message='Project not found' />
  }

  const columns = useQuery(getProjectColumns$(projectId)) ?? []
  const tasks = useQuery(getProjectTasks$(projectId)) ?? []

  // Get documents for project using client-side filtering for now
  const documentProjects = useQuery(getDocumentProjectsByProject$(projectId)) ?? []
  const allDocuments = useQuery(getAllDocuments$) ?? []
  const documentIds = new Set(documentProjects.map(dp => dp.documentId))
  const documents = allDocuments.filter(doc => documentIds.has(doc.id)) as Document[]

  // Get workers assigned to this project
  const workerProjects = useQuery(getProjectWorkers$(projectId)) ?? []
  const allWorkers = useQuery(getWorkers$) ?? []
  const team: Worker[] = allWorkers.filter(w => workerProjects.some(wp => wp.workerId === w.id))

  // Group tasks by column
  const tasksByColumn = (tasks || []).reduce((acc: Record<string, Task[]>, task: Task) => {
    if (task?.columnId && !acc[task.columnId]) {
      acc[task.columnId] = []
    }
    if (task?.columnId) {
      acc[task.columnId]?.push(task)
    }
    return acc
  }, {})

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
      const targetColumnId = overId.replace('add-card-', '')
      setDragOverAddCard(targetColumnId)
      setInsertionPreview(null)
      return
    }

    // Handle dropping over task cards - show preview for both same and different columns
    const dropTarget = calculateDropTarget(overId, draggedTask, tasksByColumn)
    if (dropTarget) {
      setInsertionPreview({
        columnId: dropTarget.columnId,
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
    const dropTarget = calculateDropTarget(overId, task, tasksByColumn)
    if (!dropTarget) return

    const { columnId: targetColumnId, index: targetIndex } = dropTarget

    // Don't move if dropping in same position
    if (targetColumnId === task.columnId) {
      const columnTasks = tasksByColumn[targetColumnId]
      if (!columnTasks) return
      const sortedTasks = [...columnTasks].sort((a, b) => a.position - b.position)
      const currentIndex = sortedTasks.findIndex(t => t.id === task.id)
      if (currentIndex === targetIndex) return
    }

    // Calculate reorder operations
    const targetColumnTasks = tasksByColumn[targetColumnId] || []
    const sortedTargetTasks = [...targetColumnTasks].sort((a, b) => a.position - b.position)
    const reorderResults = calculateTaskReorder(
      task,
      targetColumnId,
      targetIndex,
      sortedTargetTasks
    )

    // Commit all position updates
    reorderResults.forEach(result => {
      store.commit(
        events.taskMoved({
          taskId: result.taskId,
          toColumnId: result.toColumnId,
          position: result.position,
          updatedAt: result.updatedAt,
        })
      )
    })
  }

  return (
    <div className='h-full bg-white flex flex-col'>
      {/* Project Header with Breadcrumb */}
      <div className='border-b border-gray-200 bg-white px-6 py-4'>
        <div className='flex items-center gap-4 mb-3'>
          <Link
            to={preserveStoreIdInUrl('/projects')}
            className='flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors'
            aria-label='Back to projects'
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
              to={preserveStoreIdInUrl('/projects')}
              className='hover:text-gray-700 transition-colors'
            >
              Projects
            </Link>
            <svg className='w-4 h-4 mx-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
            <span className='text-gray-900 font-medium'>{project?.name || 'Loading...'}</span>
          </nav>
        </div>

        {/* Project Title and Description */}
        <div className='mb-4'>
          <h1 className='text-xl font-semibold text-gray-900 mb-1'>
            {project?.name || 'Loading...'}
          </h1>
          {project?.description && <p className='text-gray-600 text-sm'>{project.description}</p>}
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
              columns={columns || []}
              tasksByColumn={tasksByColumn}
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
                    to={preserveStoreIdInUrl(`/document/${document.id}`)}
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
