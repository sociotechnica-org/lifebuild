import React from 'react'
import { useStore } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { PROJECT_CATEGORIES } from '@work-squared/shared'
import { useAuth } from '../../../contexts/AuthContext.js'
import { ImageUpload } from '../../common/ImageUpload.js'
import { FormModal } from '../../ui/FormModal/index.js'
import { useModalForm } from '../../../hooks/useModalForm.js'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ProjectFormValues {
  name: string
  description: string
  category: string
  coverImageUrl: string
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { store } = useStore()
  const { user } = useAuth()

  const { values, errors, handleChange, setFieldValue, handleSubmit, isSubmitting } =
    useModalForm<ProjectFormValues>({
      initialValues: {
        name: '',
        description: '',
        category: '',
        coverImageUrl: '',
      },
      isOpen,
      validate: values => {
        const errors: Partial<Record<keyof ProjectFormValues, string>> = {}

        if (!values.name.trim()) {
          errors.name = 'Project name is required'
        }

        if (values.description.length > 500) {
          errors.description = 'Description must be 500 characters or less'
        }

        return errors
      },
      onSubmit: async values => {
        const projectId = crypto.randomUUID()
        const createdAt = new Date()

        const attributes = values.coverImageUrl ? { coverImage: values.coverImageUrl } : undefined

        store.commit(
          events.projectCreatedV2({
            id: projectId,
            name: values.name.trim(),
            description: values.description.trim() || undefined,
            category: (values.category || undefined) as any,
            attributes,
            createdAt,
            actorId: user?.id,
          })
        )

        onClose()
      },
    })

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title='Create New Project'
      onSubmit={handleSubmit}
      submitText='Create Project'
      submitDisabled={!values.name.trim()}
      isSubmitting={isSubmitting}
      maxWidth='max-w-lg'
    >
      <div className='space-y-6'>
        {/* Project Name */}
        <div>
          <label htmlFor='project-name' className='block text-sm font-medium text-gray-900 mb-2'>
            Project Name *
          </label>
          <input
            type='text'
            id='project-name'
            value={values.name}
            onChange={handleChange('name')}
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
            value={values.description}
            onChange={handleChange('description')}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[100px] ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder='Describe the project goals and context (optional)'
            maxLength={500}
          />
          <div className='mt-1 flex justify-between'>
            <div>
              {errors.description && <p className='text-sm text-red-600'>{errors.description}</p>}
            </div>
            <p className='text-sm text-gray-500'>{values.description.length}/500 characters</p>
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
            value={values.category}
            onChange={handleChange('category')}
            className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          >
            <option value=''>No category</option>
            {PROJECT_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.name}
              </option>
            ))}
          </select>
          {values.category && (
            <p className='mt-1 text-sm text-gray-500'>
              {PROJECT_CATEGORIES.find(c => c.value === values.category)?.description}
            </p>
          )}
        </div>

        {/* Cover Image */}
        <div>
          <label className='block text-sm font-medium text-gray-900 mb-2'>
            Cover Image (Optional)
          </label>
          <ImageUpload
            onUploadComplete={url => setFieldValue('coverImageUrl', url)}
            currentImageUrl={values.coverImageUrl}
          />
        </div>
      </div>
    </FormModal>
  )
}
