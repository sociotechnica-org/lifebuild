import React, { useState } from 'react'
import { useStore } from '@livestore/react'
import { events } from '../livestore/schema.js'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { store } = useStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({})

  const validateForm = () => {
    const newErrors: { name?: string; description?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Project name is required'
    }

    if (description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      store.commit(
        events.projectCreated({
          id: crypto.randomUUID(),
          name: name.trim(),
          description: description.trim() || undefined,
          createdAt: new Date(),
        })
      )

      // Reset form and close modal
      setName('')
      setDescription('')
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setErrors({})
    onClose()
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    if (errors.name) {
      setErrors({ ...errors, name: undefined })
    }
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    if (errors.description) {
      setErrors({ ...errors, description: undefined })
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
        {/* Backdrop */}
        <div
          className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
          onClick={handleClose}
        />

        {/* Modal */}
        <div className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6'>
          <div>
            <div className='mt-3 text-center sm:mt-0 sm:text-left'>
              <h3 className='text-lg font-semibold leading-6 text-gray-900'>Create New Project</h3>
              <div className='mt-4'>
                <form onSubmit={handleSubmit}>
                  {/* Project Name */}
                  <div className='mb-4'>
                    <label
                      htmlFor='project-name'
                      className='block text-sm font-medium text-gray-700'
                    >
                      Project Name *
                    </label>
                    <input
                      type='text'
                      id='project-name'
                      value={name}
                      onChange={handleNameChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      placeholder='Enter project name'
                      autoFocus
                    />
                    {errors.name && <p className='mt-1 text-sm text-red-600'>{errors.name}</p>}
                  </div>

                  {/* Project Description */}
                  <div className='mb-6'>
                    <label
                      htmlFor='project-description'
                      className='block text-sm font-medium text-gray-700'
                    >
                      Description
                    </label>
                    <textarea
                      id='project-description'
                      rows={4}
                      value={description}
                      onChange={handleDescriptionChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        errors.description
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : ''
                      }`}
                      placeholder='Describe the project goals and context (optional)'
                      maxLength={500}
                    />
                    <div className='mt-1 flex justify-between'>
                      <div>
                        {errors.description && (
                          <p className='text-sm text-red-600'>{errors.description}</p>
                        )}
                      </div>
                      <p className='text-sm text-gray-500'>{description.length}/500 characters</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex justify-end space-x-3'>
                    <button
                      type='button'
                      onClick={handleClose}
                      className='inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={isSubmitting}
                      className='inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isSubmitting ? 'Creating...' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
