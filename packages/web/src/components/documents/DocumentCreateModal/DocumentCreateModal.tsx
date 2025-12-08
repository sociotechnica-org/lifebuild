import React from 'react'
import { useStore } from '@livestore/react'
import { events } from '@lifebuild/shared/schema'
import { FormModal } from '../../ui/FormModal/index.js'
import { useModalForm } from '../../../hooks/useModalForm.js'

interface DocumentCreateModalProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string
}

interface DocumentFormValues {
  title: string
  content: string
}

export const DocumentCreateModal: React.FC<DocumentCreateModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const { store } = useStore()

  const { values, errors, handleChange, handleSubmit, isSubmitting } =
    useModalForm<DocumentFormValues>({
      initialValues: {
        title: '',
        content: '',
      },
      isOpen,
      validate: values => {
        const errors: Partial<Record<keyof DocumentFormValues, string>> = {}

        if (!values.title.trim()) {
          errors.title = 'Document title is required'
        }

        if (values.title.length > 200) {
          errors.title = 'Title must be 200 characters or less'
        }

        return errors
      },
      onSubmit: async values => {
        const documentId = crypto.randomUUID()
        const createdAt = new Date()

        store.commit(
          events.documentCreated({
            id: documentId,
            title: values.title.trim(),
            content: values.content.trim(),
            createdAt,
          })
        )

        if (projectId) {
          store.commit(
            events.documentAddedToProject({
              documentId,
              projectId,
            })
          )
        }

        onClose()
      },
    })

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title='Create New Document'
      onSubmit={handleSubmit}
      submitText='Create Document'
      submitDisabled={!values.title.trim()}
      isSubmitting={isSubmitting}
    >
      <div className='space-y-4'>
        <div>
          <label htmlFor='document-title' className='block text-sm font-medium text-gray-700 mb-1'>
            Title *
          </label>
          <input
            id='document-title'
            type='text'
            value={values.title}
            onChange={handleChange('title')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder='Enter document title'
          />
          {errors.title && <p className='mt-1 text-sm text-red-600'>{errors.title}</p>}
        </div>

        <div>
          <label
            htmlFor='document-content'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Content
          </label>
          <textarea
            id='document-content'
            value={values.content}
            onChange={handleChange('content')}
            rows={8}
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical'
            placeholder='Enter document content...'
          />
        </div>
      </div>
    </FormModal>
  )
}
