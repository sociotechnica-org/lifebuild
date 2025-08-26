import React, { useState } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { Project, events } from '@work-squared/shared/schema'
import { getProjects$ } from '@work-squared/shared/queries'

interface ProjectPickerProps {
  contactId: string
  existingProjectIds: string[]
  onClose: () => void
}

export const ProjectPicker: React.FC<ProjectPickerProps> = ({
  contactId,
  existingProjectIds,
  onClose,
}) => {
  const projects = useQuery(getProjects$) ?? []
  const { store } = useStore()
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableProjects = projects.filter((p: Project) => !existingProjectIds.includes(p.id))

  const handleToggleProject = (projectId: string) => {
    const newSelected = new Set(selectedProjectIds)
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId)
    } else {
      newSelected.add(projectId)
    }
    setSelectedProjectIds(newSelected)
  }

  const handleSubmit = async () => {
    if (selectedProjectIds.size === 0) return

    setIsSubmitting(true)
    try {
      const eventsToCommit = Array.from(selectedProjectIds).map(projectId =>
        events.projectContactAdded({
          id: crypto.randomUUID(),
          projectId,
          contactId,
          createdAt: new Date(),
        })
      )

      await store.commit(...eventsToCommit)
      onClose()
    } catch (error) {
      console.error('Failed to add contact to projects:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
        <div
          className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75'
          onClick={onClose}
        />

        <div className='inline-block w-full max-w-md px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6'>
          <div>
            <h3 className='text-lg font-medium leading-6 text-gray-900'>Add to Projects</h3>

            {availableProjects.length === 0 ? (
              <p className='mt-4 text-sm text-gray-500'>
                This contact is already associated with all available projects.
              </p>
            ) : (
              <>
                <div className='mt-4 space-y-2 max-h-60 overflow-y-auto'>
                  {availableProjects.map((project: Project) => (
                    <label
                      key={project.id}
                      className='flex items-start p-3 rounded-lg hover:bg-gray-50 cursor-pointer'
                    >
                      <input
                        type='checkbox'
                        checked={selectedProjectIds.has(project.id)}
                        onChange={() => handleToggleProject(project.id)}
                        className='mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                      />
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-gray-900'>{project.name}</p>
                        {project.description && (
                          <p className='text-xs text-gray-500 mt-1'>{project.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div className='mt-5 sm:mt-6 flex justify-end space-x-3'>
                  <button
                    type='button'
                    onClick={onClose}
                    className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={selectedProjectIds.size === 0 || isSubmitting}
                    className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isSubmitting
                      ? 'Adding...'
                      : `Add to ${selectedProjectIds.size} Project${selectedProjectIds.size !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
