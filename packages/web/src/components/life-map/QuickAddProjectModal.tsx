import React from 'react'
import { useStore } from '@livestore/react'
import { events } from '@lifebuild/shared/schema'
import { PROJECT_CATEGORIES, type ProjectCategory } from '@lifebuild/shared'
import { useAuth } from '../../contexts/AuthContext.js'
import { useSnackbar } from '../ui/Snackbar/Snackbar.js'
import { FormModal } from '../ui/FormModal/index.js'
import { useModalForm } from '../../hooks/useModalForm.js'
import { useCategoryAdvisor } from '../../hooks/useCategoryAdvisor.js'

interface QuickAddProjectModalProps {
  isOpen: boolean
  onClose: () => void
  categoryId: ProjectCategory
}

interface QuickAddFormValues {
  name: string
}

export const QuickAddProjectModal: React.FC<QuickAddProjectModalProps> = ({
  isOpen,
  onClose,
  categoryId,
}) => {
  const { store } = useStore()
  const { user } = useAuth()
  const { showSnackbar } = useSnackbar()

  const category = PROJECT_CATEGORIES.find(c => c.value === categoryId)

  // Ensure category advisor exists (auto-creates if needed)
  useCategoryAdvisor(categoryId)

  const { values, errors, handleChange, handleSubmit, isSubmitting } =
    useModalForm<QuickAddFormValues>({
      initialValues: {
        name: '',
      },
      isOpen,
      validate: values => {
        const errors: Partial<Record<keyof QuickAddFormValues, string>> = {}

        if (!values.name.trim()) {
          errors.name = 'Project name is required'
        }

        return errors
      },
      onSubmit: async values => {
        const projectId = crypto.randomUUID()
        const createdAt = new Date()

        store.commit(
          events.projectCreatedV2({
            id: projectId,
            name: values.name.trim(),
            description: undefined,
            category: categoryId as any,
            attributes: undefined,
            createdAt,
            actorId: user?.id,
          })
        )

        showSnackbar({
          message: `${values.name.trim()} added to ${category?.name}`,
          type: 'success',
          duration: 3000,
        })

        onClose()
      },
    })

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <div className='text-lg font-semibold'>Add Project</div>
          <p className='text-sm text-gray-500 mt-1 font-normal'>{category?.name}</p>
        </div>
      }
      ariaLabel={`Add Project to ${category?.name || 'Category'}`}
      onSubmit={handleSubmit}
      submitText='Create'
      isSubmitting={isSubmitting}
    >
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
    </FormModal>
  )
}
