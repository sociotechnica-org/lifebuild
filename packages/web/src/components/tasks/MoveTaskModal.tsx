import React, { useState } from 'react'
import { useQuery, useStore } from '../../livestore-compat.js'
import { getProjects$, getProjectTasks$, getOrphanedTasks$ } from '@lifebuild/shared/queries'
import type { Project, Task, TaskStatus } from '@lifebuild/shared/schema'
import { events } from '@lifebuild/shared/schema'
import { STATUS_COLUMNS } from '@lifebuild/shared'
import { useTaskStatusChange } from '../../hooks/useTaskStatusChange.js'

interface MoveTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task
}

export const MoveTaskModal: React.FC<MoveTaskModalProps> = ({ isOpen, onClose, task }) => {
  const { store } = useStore()
  const projects = useQuery(getProjects$) ?? []
  const { changeTaskStatus } = useTaskStatusChange()

  // States
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(task.projectId)
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(
    (task.status as TaskStatus) || 'todo'
  )

  // Query tasks for position calculation
  const projectTasks = useQuery(
    selectedProjectId ? getProjectTasks$(selectedProjectId) : getOrphanedTasks$
  )
  const tasksInScope = projectTasks ?? []

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedProjectId(task.projectId)
      setSelectedStatus((task.status as TaskStatus) || 'todo')
    }
  }, [isOpen, task.projectId, task.status])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check if anything changed
    const projectChanged = selectedProjectId !== task.projectId
    const statusChanged = selectedStatus !== task.status

    if (projectChanged || statusChanged) {
      // Calculate next position in the destination status (add at the end)
      const tasksWithStatus = tasksInScope.filter((t: Task) => t.status === selectedStatus)
      const validPositions = tasksWithStatus
        .map((t: Task) => t.position)
        .filter((pos: number) => typeof pos === 'number' && !isNaN(pos))
      const POSITION_GAP = 1000
      const nextPosition =
        validPositions.length > 0 ? Math.max(...validPositions) + POSITION_GAP : POSITION_GAP

      if (projectChanged) {
        // Use the v2 cross-project move event
        store.commit(
          events.taskMovedToProjectV2({
            taskId: task.id,
            toProjectId: selectedProjectId || undefined,
            position: nextPosition,
            updatedAt: new Date(),
          })
        )

        // If status also changed, update it separately
        // Use changeTaskStatus to handle auto-activation of bronze projects
        // Pass selectedProjectId as override since task.projectId still points to source
        if (statusChanged) {
          changeTaskStatus(
            task,
            selectedStatus,
            nextPosition,
            new Date(),
            undefined,
            selectedProjectId
          )
        }
      } else if (statusChanged) {
        // Use changeTaskStatus for within-project moves
        // This handles auto-activation of bronze projects
        changeTaskStatus(task, selectedStatus, nextPosition)
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
      className='fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]'
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

              {/* Status Selection */}
              <div>
                <label
                  htmlFor='move-status'
                  className='block text-sm font-medium text-gray-900 mb-2'
                >
                  Status
                </label>
                <select
                  id='move-status'
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as TaskStatus)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  required
                >
                  {STATUS_COLUMNS.map(statusColumn => (
                    <option key={statusColumn.id} value={statusColumn.status}>
                      {statusColumn.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='flex gap-3 px-6 py-4 border-t border-gray-200'>
            <button
              type='submit'
              className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors'
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
