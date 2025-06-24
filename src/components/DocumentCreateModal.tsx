import React, { useState } from 'react'
import { useStore } from '@livestore/react'
import { events } from '../livestore/schema.js'

interface DocumentCreateModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

export const DocumentCreateModal: React.FC<DocumentCreateModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const { store } = useStore()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({})

  const validateForm = () => {
    const newErrors: { title?: string; content?: string } = {}

    if (!title.trim()) {
      newErrors.title = 'Document title is required'
    }

    if (title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less'
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
      const documentId = crypto.randomUUID()
      const createdAt = new Date()

      // Create the document
      store.commit(
        events.documentCreated({
          id: documentId,
          title: title.trim(),
          content: content.trim(),
          createdAt,
        })
      )

      // Associate it with the project
      store.commit(
        events.documentAddedToProject({
          documentId,
          projectId,
        })
      )

      // Reset form and close modal
      setTitle('')
      setContent('')
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Failed to create document:', error)
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle('')
      setContent('')
      setErrors({})
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-medium text-gray-900'>Create New Document</h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className='text-gray-400 hover:text-gray-500 disabled:opacity-50'
            >
              <span className='sr-only'>Close</span>
              <svg
                className='w-6 h-6'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='1.5'
                stroke='currentColor'
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='px-6 py-4 space-y-4'>
          <div>
            <label
              htmlFor='document-title'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Title *
            </label>
            <input
              id='document-title'
              type='text'
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
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
              value={content}
              onChange={e => setContent(e.target.value)}
              disabled={isSubmitting}
              rows={8}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-vertical'
              placeholder='Enter document content...'
            />
          </div>
        </form>

        <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3'>
          <button
            type='button'
            onClick={handleClose}
            disabled={isSubmitting}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Cancel
          </button>
          <button
            type='submit'
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className='px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSubmitting ? 'Creating...' : 'Create Document'}
          </button>
        </div>
      </div>
    </div>
  )
}
