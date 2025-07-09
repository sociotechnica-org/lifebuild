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
      onClose()
    } catch (error) {
      console.error('Failed to add document to project:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedDocumentId(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
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
        <div className='flex justify-end gap-3 p-6 border-t border-gray-200'>
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
  )
}
