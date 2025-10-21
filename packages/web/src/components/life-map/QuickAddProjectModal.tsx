import React, { useState } from 'react'
import { useStore } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { PROJECT_CATEGORIES, type ProjectCategory } from '@work-squared/shared'
import { useAuth } from '../../contexts/AuthContext.js'
import { useSnackbar } from '../ui/Snackbar/Snackbar.js'
import { useCategoryAdvisor } from '../../hooks/useCategoryAdvisor.js'

interface QuickAddProjectModalProps {
  isOpen: boolean
  onClose: () => void
  categoryId: ProjectCategory
}

export const QuickAddProjectModal: React.FC<QuickAddProjectModalProps> = ({
  isOpen,
  onClose,
  categoryId,
}) => {
  const { store } = useStore()
  const { user } = useAuth()
  const { showSnackbar } = useSnackbar()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const category = PROJECT_CATEGORIES.find(c => c.value === categoryId)

  // Ensure category advisor exists (auto-creates if needed)
  useCategoryAdvisor(categoryId)

  const validateForm = () => {
    if (!name.trim()) {
      setError('Project name is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const projectId = crypto.randomUUID()
      const createdAt = new Date()

      // Create project with category pre-filled
      // Note: attributes are not set here as the schema currently defines an empty struct
      // Projects will default to 'planning' status in future phase when attributes are extended
      store.commit(
        events.projectCreatedV2({
          id: projectId,
          name: name.trim(),
          description: undefined,
          category: categoryId as any,
          attributes: undefined,
          createdAt,
          actorId: user?.id,
        })
      )

      // Show success notification
      showSnackbar({
        message: `${name.trim()} added to ${category?.name}`,
        type: 'success',
        duration: 3000,
      })

      // Reset form and close modal
      setName('')
      setError(undefined)
      onClose()
    } catch (error) {
      console.error('Error creating project:', error)
      setError('Failed to create project. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setName('')
    setError(undefined)
    onClose()
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    if (error) {
      setError(undefined)
    }
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-20 px-4 z-50'
      onClick={handleBackdropClick}
    >
      <div className='bg-white rounded-lg shadow-lg max-w-md w-full'>
        {/* Header */}
        <div className='flex items-start justify-between p-6 border-b border-gray-200'>
          <div>
            <h3 className='text-lg font-semibold leading-6 text-gray-900'>Add Project</h3>
            <p className='text-sm text-gray-500 mt-1'>{category?.name}</p>
          </div>
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
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Project Name */}
            <div>
              <label
                htmlFor='project-name'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Project Name *
              </label>
              <input
                type='text'
                id='project-name'
                value={name}
                onChange={handleNameChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Enter project name'
                autoFocus
              />
              {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
            </div>

            {/* Actions */}
            <div className='flex justify-end space-x-3 pt-2'>
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
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
