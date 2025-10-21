import React, { useState } from 'react'
import { useStore } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { PROJECT_CATEGORIES } from '@work-squared/shared'
import { useAuth } from '../../../contexts/AuthContext.js'
import { ImageUpload } from '../../common/ImageUpload.js'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { store } = useStore()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('')
  const [coverImageUrl, setCoverImageUrl] = useState<string>('')
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
      const projectId = crypto.randomUUID()
      const createdAt = new Date()

      // Build attributes with cover image if provided
      const attributes = coverImageUrl ? { coverImage: coverImageUrl } : undefined

      // PR4: Create the project using v2 event with category support
      store.commit(
        events.projectCreatedV2({
          id: projectId,
          name: name.trim(),
          description: description.trim() || undefined,
          category: (category || undefined) as any,
          attributes,
          createdAt,
          actorId: user?.id,
        })
      )

      // Reset form and close modal
      setName('')
      setDescription('')
      setCategory('')
      setCoverImageUrl('')
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
    setCategory('')
    setCoverImageUrl('')
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
      <div className='bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-start justify-between p-6 border-b border-gray-200'>
          <h3 className='text-lg font-semibold leading-6 text-gray-900'>Create New Project</h3>
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
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Enter project name'
                autoFocus
              />
              {errors.name && <p className='mt-1 text-sm text-red-600'>{errors.name}</p>}
            </div>

            {/* Project Description */}
            <div>
              <label
                htmlFor='project-description'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Description
              </label>
              <textarea
                id='project-description'
                rows={4}
                value={description}
                onChange={handleDescriptionChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[100px] ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
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

            {/* Project Category */}
            <div>
              <label
                htmlFor='project-category'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Category
              </label>
              <select
                id='project-category'
                value={category}
                onChange={e => setCategory(e.target.value)}
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value=''>No category</option>
                {PROJECT_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {category && (
                <p className='mt-1 text-sm text-gray-500'>
                  {PROJECT_CATEGORIES.find(c => c.value === category)?.description}
                </p>
              )}
            </div>

            {/* Cover Image */}
            <div>
              <label className='block text-sm font-medium text-gray-900 mb-2'>
                Cover Image (Optional)
              </label>
              <ImageUpload onUploadComplete={setCoverImageUrl} currentImageUrl={coverImageUrl} />
            </div>

            {/* Actions */}
            <div className='flex justify-end space-x-3 pt-4'>
              <button
                type='button'
                onClick={handleClose}
                className='px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isSubmitting}
                className='px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
