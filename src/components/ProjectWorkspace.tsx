import React, { useState } from 'react'
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { useQuery, useStore } from '@livestore/react'
import { useParams, Link } from 'react-router-dom'
import {
  getProjectColumns$,
  getProjectTasks$,
  getDocumentsForProject$,
} from '../livestore/queries.js'
import type { Task, Document } from '../livestore/schema.js'
import { events } from '../livestore/schema.js'
import { seedSessionDocuments } from '../util/seed-data.js'
import { ProjectProvider, useProject } from '../contexts/ProjectContext.js'
import { KanbanBoard } from './KanbanBoard.js'
import { TaskModal } from './TaskModal.js'
import { DocumentCreateModal } from './DocumentCreateModal.js'

// Component for the actual workspace content
const ProjectWorkspaceContent: React.FC = () => {
  const { project, projectId } = useProject()
  const { store } = useStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [insertionPreview, setInsertionPreview] = useState<{
    columnId: string
    position: number
  } | null>(null)
  const [dragOverAddCard, setDragOverAddCard] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'tasks' | 'documents'>('tasks')
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false)

  if (!projectId) {
    return <div>Project not found</div>
  }

  const columns = useQuery(getProjectColumns$(projectId)) ?? []
  const tasks = useQuery(getProjectTasks$(projectId)) ?? []
  const documents = (useQuery(getDocumentsForProject$(projectId)) ?? []) as Document[]
  const hasSeededDocumentsRef = React.useRef(false)

  // Seed documents if none exist (similar to project seeding pattern)
  React.useEffect(() => {
    if (documents.length === 0 && !hasSeededDocumentsRef.current) {
      hasSeededDocumentsRef.current = true
      seedSessionDocuments(store)
    }
  }, [documents.length, store])

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

    if (overId.startsWith('add-card-')) {
      // Hovering over Add Card button
      const targetColumnId = overId.replace('add-card-', '')
      setDragOverAddCard(targetColumnId)
      const columnTasks = tasksByColumn[targetColumnId] || []
      const targetPosition = columnTasks.filter(t => t.id !== activeTaskId).length
      setInsertionPreview({ columnId: targetColumnId, position: targetPosition })
    } else {
      // Hovering over a task
      setDragOverAddCard(null)
      const targetTask = findTask(overId)
      if (!targetTask) {
        setInsertionPreview(null)
        return
      }

      // Don't show insertion preview if dragging a task over itself
      if (targetTask.id === activeTaskId) {
        setInsertionPreview(null)
        return
      }

      const targetColumnId = targetTask.columnId
      let targetPosition = targetTask.position

      // For same-column movements, adjust position if moving down
      if (targetColumnId === draggedTask.columnId && draggedTask.position < targetTask.position) {
        targetPosition = targetTask.position - 1
      }

      // Don't show preview if the position would be the same
      if (targetColumnId === draggedTask.columnId && targetPosition === draggedTask.position) {
        setInsertionPreview(null)
        return
      }

      setInsertionPreview({ columnId: targetColumnId, position: targetPosition })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setInsertionPreview(null)
    setDragOverAddCard(null)

    if (!over || !active) return

    const taskId = active.id as string
    const task = findTask(taskId)
    if (!task) return

    const overId = over.id as string
    let targetColumnId: string
    let targetPosition: number

    if (overId.startsWith('add-card-')) {
      // Dropped on Add Card button - place at end of column
      targetColumnId = overId.replace('add-card-', '')
      const columnTasks = tasksByColumn[targetColumnId] || []
      targetPosition = columnTasks.filter(t => t.id !== taskId).length
    } else {
      // Dropped on another task
      const targetTask = findTask(overId)
      if (!targetTask) return

      targetColumnId = targetTask.columnId
      targetPosition = targetTask.position

      // For same-column movements, adjust position if moving down
      if (task.columnId === targetColumnId && task.position < targetTask.position) {
        targetPosition = targetTask.position - 1
      }
    }

    // Don't do anything if dropped in the same position
    if (task.columnId === targetColumnId && task.position === targetPosition) {
      return
    }

    // Calculate position updates for affected tasks
    const now = new Date()
    const moveEvents: any[] = []

    if (task.columnId === targetColumnId) {
      // Moving within the same column
      const columnTasks = tasksByColumn[targetColumnId] || []

      if (task.position < targetPosition) {
        // Moving down: shift tasks between old and new position up
        columnTasks
          .filter(
            t => t.position > task.position && t.position <= targetPosition && t.id !== taskId
          )
          .forEach(t => {
            moveEvents.push(
              events.taskMoved({
                taskId: t.id,
                toColumnId: targetColumnId,
                position: t.position - 1,
                updatedAt: now,
              })
            )
          })
      } else {
        // Moving up: shift tasks between new and old position down
        columnTasks
          .filter(
            t => t.position >= targetPosition && t.position < task.position && t.id !== taskId
          )
          .forEach(t => {
            moveEvents.push(
              events.taskMoved({
                taskId: t.id,
                toColumnId: targetColumnId,
                position: t.position + 1,
                updatedAt: now,
              })
            )
          })
      }
    } else {
      // Moving between columns
      const oldColumnTasks = tasksByColumn[task.columnId] || []
      const newColumnTasks = tasksByColumn[targetColumnId] || []

      // Shift tasks in old column up
      oldColumnTasks
        .filter(t => t.position > task.position)
        .forEach(t => {
          moveEvents.push(
            events.taskMoved({
              taskId: t.id,
              toColumnId: task.columnId,
              position: t.position - 1,
              updatedAt: now,
            })
          )
        })

      // Shift tasks in new column down
      newColumnTasks
        .filter(t => t.position >= targetPosition)
        .forEach(t => {
          moveEvents.push(
            events.taskMoved({
              taskId: t.id,
              toColumnId: targetColumnId,
              position: t.position + 1,
              updatedAt: now,
            })
          )
        })
    }

    // Commit all position updates
    moveEvents.forEach(event => store.commit(event))

    // Finally, move the dragged task
    store.commit(
      events.taskMoved({
        taskId,
        toColumnId: targetColumnId,
        position: targetPosition,
        updatedAt: now,
      })
    )
  }

  return (
    <div className='h-full bg-white flex flex-col'>
      {/* Project Header with Breadcrumb */}
      <div className='border-b border-gray-200 bg-white px-6 py-4'>
        <div className='flex items-center gap-4 mb-3'>
          <Link
            to='/projects'
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
            <Link to='/projects' className='hover:text-gray-700 transition-colors'>
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
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Documents
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
            />
            <TaskModal taskId={selectedTaskId} onClose={handleModalClose} />
          </>
        )}

        {activeTab === 'documents' && (
          <div className='p-6'>
            {/* Header with Create Document button */}
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-medium text-gray-900'>Project Documents</h2>
              <button
                onClick={() => setIsDocumentModalOpen(true)}
                className='inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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

            {/* Documents list */}
            {documents.length > 0 ? (
              <div className='space-y-3'>
                {documents.map((document: Document) => (
                  <div
                    key={document.id}
                    className='bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer'
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
                            Updated {new Date(document.updatedAt).toLocaleDateString()}
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
                  </div>
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
