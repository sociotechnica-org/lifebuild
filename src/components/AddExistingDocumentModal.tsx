import React, { useState, useMemo } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { getAllDocuments$, getDocumentProjectsByProject$ } from '../livestore/queries.js'
import { events } from '../livestore/schema.js'
import { LoadingSpinner } from './LoadingSpinner.js'

interface AddExistingDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

export const AddExistingDocumentModal: React.FC<AddExistingDocumentModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const { store } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Get all documents and existing associations
  const allDocuments = useQuery(getAllDocuments$) ?? []
  const documentProjects = useQuery(getDocumentProjectsByProject$(projectId)) ?? []

  // Filter out documents already associated with this project
  const existingDocumentIds = useMemo(() => {
    return new Set(documentProjects.map(dp => dp.documentId))
  }, [documentProjects])

  const availableDocuments = useMemo(() => {
    return allDocuments.filter(doc => !existingDocumentIds.has(doc.id))
  }, [allDocuments, existingDocumentIds])

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return availableDocuments

    const query = searchQuery.toLowerCase()
    return availableDocuments.filter(
      doc =>
        (doc.title || '').toLowerCase().includes(query) ||
        (doc.content || '').toLowerCase().includes(query)
    )
  }, [availableDocuments, searchQuery])

  const selectedDocument = useMemo(() => {
    return selectedDocumentId ? allDocuments.find(doc => doc.id === selectedDocumentId) : null
  }, [selectedDocumentId, allDocuments])

  const handleSubmit = async () => {
    if (!selectedDocumentId) return

    setIsSubmitting(true)
    setError(null)

    try {
      await store.commit(
        events.documentAddedToProject({
          documentId: selectedDocumentId,
          projectId,
        })
      )

      // Reset and close modal
      setSearchQuery('')
      setSelectedDocumentId(null)
      setRetryCount(0)
      onClose()
    } catch (error) {
      console.error('Failed to add document to project:', error)
      setError(error instanceof Error ? error.message : 'Failed to add document to project')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    handleSubmit()
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedDocumentId(null)
    setError(null)
    setRetryCount(0)
    onClose()
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-50'
      onClick={handleBackdropClick}
    >
      <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>Add Existing Document</h2>
          <button
            onClick={handleClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
            role='button'
            aria-label='Close'
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

        {/* Search */}
        <div className='p-6 border-b border-gray-200'>
          <input
            type='text'
            placeholder='Search documents...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        {/* Content */}
        <div className='flex-1 overflow-hidden flex'>
          {/* Document List */}
          <div className='w-1/2 border-r border-gray-200 overflow-y-auto'>
            {filteredDocuments.length === 0 ? (
              <div className='p-6 text-center text-gray-500'>
                {availableDocuments.length === 0 ? (
                  <p>No documents available to add</p>
                ) : (
                  <p>No documents match your search</p>
                )}
              </div>
            ) : (
              <div className='p-4 space-y-2'>
                {filteredDocuments.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocumentId(doc.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedDocumentId === doc.id
                        ? 'bg-blue-50 border-blue-200 border'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className='font-medium text-gray-900 truncate'>
                      {doc.title || 'Untitled Document'}
                    </div>
                    <div className='text-sm text-gray-500 mt-1 line-clamp-2'>
                      {(doc.content || '').substring(0, 100)}
                      {doc.content && doc.content.length > 100 ? '...' : ''}
                    </div>
                    <div className='text-xs text-gray-400 mt-1'>
                      Updated {new Date(doc.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Document Preview */}
          <div className='w-1/2 overflow-y-auto'>
            {selectedDocument ? (
              <div className='p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  {selectedDocument.title || 'Untitled Document'}
                </h3>
                <div className='prose prose-sm max-w-none'>
                  <div className='text-gray-700 whitespace-pre-wrap'>
                    {selectedDocument.content || 'No content available.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className='p-6 text-center text-gray-500'>
                <p>Select a document to preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='border-t border-gray-200'>
          {/* Error message */}
          {error && (
            <div className='px-6 py-4 bg-red-50 border-b border-red-200'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm text-red-800'>{error}</p>
                    {retryCount > 0 && (
                      <p className='text-xs text-red-600 mt-1'>Retry attempt {retryCount}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleRetry}
                  disabled={isSubmitting}
                  className='text-sm text-red-600 hover:text-red-800 underline disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          <div className='flex justify-end gap-3 p-6'>
            <button
              onClick={handleClose}
              className='px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedDocumentId || isSubmitting}
              className='px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center'
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size='sm' color='white' />
                  <span className='ml-2'>Adding...</span>
                </>
              ) : (
                'Add to Project'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
