import React, { useState, useEffect } from 'react'
import { useStore } from '@livestore/react'
import { events } from '@work-squared/shared/events'
import { getProjects$, getWorkerProjects$ } from '@work-squared/shared/queries'
import type { Worker, Project } from '@work-squared/shared/schema'

interface ProjectAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  worker: Worker
}

export const ProjectAssignmentModal: React.FC<ProjectAssignmentModalProps> = ({
  isOpen,
  onClose,
  worker,
}) => {
  const { store } = useStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [assignedProjectIds, setAssignedProjectIds] = useState<Set<string>>(new Set())
  const [pendingAssignments, setPendingAssignments] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Load projects and current assignments
      const loadData = async () => {
        const projectsResult = await store.query(getProjects$)
        const assignmentsResult = await store.query(getWorkerProjects$(worker.id))

        setProjects([...projectsResult])
        const currentAssignedIds = new Set(assignmentsResult.map(wp => wp.projectId))
        setAssignedProjectIds(currentAssignedIds)
        setPendingAssignments(new Set(currentAssignedIds))
      }

      loadData()
    }
  }, [isOpen, worker.id, store])

  const filteredProjects = projects.filter(
    project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleProjectToggle = (projectId: string) => {
    const newPendingAssignments = new Set(pendingAssignments)
    if (newPendingAssignments.has(projectId)) {
      newPendingAssignments.delete(projectId)
    } else {
      newPendingAssignments.add(projectId)
    }
    setPendingAssignments(newPendingAssignments)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const currentAssignments = assignedProjectIds
      const newAssignments = pendingAssignments

      // Find projects to assign (in newAssignments but not in currentAssignments)
      const toAssign = Array.from(newAssignments).filter(id => !currentAssignments.has(id))

      // Find projects to unassign (in currentAssignments but not in newAssignments)
      const toUnassign = Array.from(currentAssignments).filter(id => !newAssignments.has(id))

      // Commit assignment events
      for (const projectId of toAssign) {
        await store.commit(
          events.workerAssignedToProject({
            workerId: worker.id,
            projectId,
          })
        )
      }

      // Commit unassignment events
      for (const projectId of toUnassign) {
        await store.commit(
          events.workerUnassignedFromProject({
            workerId: worker.id,
            projectId,
          })
        )
      }

      onClose()
    } catch (error) {
      console.error('Error updating project assignments:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setPendingAssignments(new Set(assignedProjectIds))
    onClose()
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-50'
      onClick={handleBackdropClick}
    >
      <div className='bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-start justify-between p-6 border-b border-gray-200'>
          <h3 className='text-lg font-semibold leading-6 text-gray-900'>
            Assign Projects to {worker.name}
          </h3>
          <button
            onClick={handleClose}
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
        <div className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Search */}
            <div>
              <label
                htmlFor='project-search'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Search Projects
              </label>
              <input
                type='text'
                id='project-search'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Search by project name or description...'
                autoFocus
              />
            </div>

            {/* Project List */}
            <div>
              <label className='block text-sm font-medium text-gray-900 mb-2'>
                Available Projects
              </label>
              <div className='border border-gray-300 rounded-md max-h-64 overflow-y-auto'>
                {filteredProjects.length === 0 ? (
                  <div className='p-4 text-center text-gray-500'>
                    {searchQuery ? 'No projects match your search.' : 'No projects available.'}
                  </div>
                ) : (
                  <div className='p-2 space-y-2'>
                    {filteredProjects.map(project => (
                      <label
                        key={project.id}
                        className='flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={pendingAssignments.has(project.id)}
                          onChange={() => handleProjectToggle(project.id)}
                          className='mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                        />
                        <div className='flex-1 min-w-0'>
                          <div className='text-sm font-medium text-gray-900'>{project.name}</div>
                          {project.description && (
                            <div className='text-sm text-gray-500'>{project.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className='bg-gray-50 p-4 rounded-md'>
              <div className='text-sm text-gray-600'>
                <span className='font-medium'>
                  {pendingAssignments.size} project{pendingAssignments.size !== 1 ? 's' : ''}{' '}
                  selected
                </span>
                {pendingAssignments.size !== assignedProjectIds.size && (
                  <span className='ml-2 text-blue-600'>
                    ({Math.abs(pendingAssignments.size - assignedProjectIds.size)} change
                    {Math.abs(pendingAssignments.size - assignedProjectIds.size) !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className='flex justify-end space-x-3 pt-4'>
              <button
                type='button'
                onClick={handleClose}
                className='px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isSubmitting}
                className='px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
