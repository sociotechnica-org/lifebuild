import React, { useState } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { getProjects$, getProjectColumns$, getOrphanedColumns$ } from '../livestore/queries.js'
import type { Project, Column, Task } from '../livestore/schema.js'
import { events } from '../livestore/schema.js'

interface MoveTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task
}

export const MoveTaskModal: React.FC<MoveTaskModalProps> = ({ isOpen, onClose, task }) => {
  const { store } = useStore()
  const projects = useQuery(getProjects$) ?? []

  // States
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(task.projectId)
  const [selectedColumnId, setSelectedColumnId] = useState<string>(task.columnId)

  // Get columns for selected project (or orphaned columns)
  const projectColumns = selectedProjectId ? useQuery(getProjectColumns$(selectedProjectId)) : null
  const orphanedColumns = !selectedProjectId ? useQuery(getOrphanedColumns$) : null

  const columns = selectedProjectId ? (projectColumns ?? []) : (orphanedColumns ?? [])

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedProjectId(task.projectId)
      setSelectedColumnId(task.columnId)
    }
  }, [isOpen, task.projectId, task.columnId])

  // Update column selection when project changes
  React.useEffect(() => {
    if (columns.length > 0 && !columns.find(col => col.id === selectedColumnId)) {
      setSelectedColumnId(columns[0]?.id || '')
    }
  }, [columns, selectedColumnId])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedColumnId) {
      return // Should not happen if columns are loaded
    }

    // Check if anything changed
    const projectChanged = selectedProjectId !== task.projectId
    const columnChanged = selectedColumnId !== task.columnId

    if (projectChanged || columnChanged) {
      // Calculate next position in the destination column (add at the beginning)
      const nextPosition = 0 // For simplicity, add at the beginning

      if (projectChanged) {
        // Use the new cross-project move event
        store.commit(
          events.taskMovedToProject({
            taskId: task.id,
            toProjectId: selectedProjectId || undefined,
            toColumnId: selectedColumnId,
            position: nextPosition,
            updatedAt: new Date(),
          })
        )
      } else {
        // Use the regular move event for within-project moves
        store.commit(
          events.taskMoved({
            taskId: task.id,
            toColumnId: selectedColumnId,
            position: nextPosition,
            updatedAt: new Date(),
          })
        )
      }
    }

    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const getCurrentProjectName = () => {
    if (!task.projectId) return 'Orphaned Tasks'
    const project = projects.find((p: Project) => p.id === task.projectId)
    return project?.name || 'Unknown Project'
  }

  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50'
      onClick={handleBackdropClick}
    >
      <div
        className='bg-white rounded-lg shadow-lg max-w-md w-full'
        role='dialog'
        aria-modal='true'
        aria-labelledby='move-task-modal-title'
        onKeyDown={handleKeyDown}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b border-gray-200'>
            <h1 id='move-task-modal-title' className='text-lg font-semibold text-gray-900'>
              Move Card
            </h1>
            <button
              type='button'
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100'
              aria-label='Close modal'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className='p-6 space-y-4'>
            {/* Current location */}
            <div className='bg-gray-50 p-3 rounded-md'>
              <div className='text-sm text-gray-700'>
                <strong>"{task.title}"</strong> is currently in{' '}
                <strong>{getCurrentProjectName()}</strong>
              </div>
            </div>

            {/* Select destination */}
            <div className='space-y-4'>
              <h2 className='text-sm font-medium text-gray-900'>Select destination</h2>

              {/* Project Selection */}
              <div>
                <label
                  htmlFor='move-project'
                  className='block text-sm font-medium text-gray-900 mb-2'
                >
                  Project
                </label>
                <select
                  id='move-project'
                  value={selectedProjectId || ''}
                  onChange={e => setSelectedProjectId(e.target.value || null)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Orphaned Tasks</option>
                  {projects.map((project: Project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Column Selection */}
              {columns.length > 0 && (
                <div>
                  <label
                    htmlFor='move-column'
                    className='block text-sm font-medium text-gray-900 mb-2'
                  >
                    List
                  </label>
                  <select
                    id='move-column'
                    value={selectedColumnId}
                    onChange={e => setSelectedColumnId(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    required
                  >
                    {columns.map((column: Column) => (
                      <option key={column.id} value={column.id}>
                        {column.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedProjectId && columns.length === 0 && (
                <div className='text-sm text-gray-500 bg-gray-50 p-3 rounded-md'>
                  This project has no columns yet. Columns will be created automatically.
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className='flex gap-3 px-6 py-4 border-t border-gray-200'>
            <button
              type='submit'
              disabled={!selectedColumnId}
              className='bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors'
            >
              Move
            </button>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
