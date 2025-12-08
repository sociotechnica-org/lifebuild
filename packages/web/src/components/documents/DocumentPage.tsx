import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatDate } from '../../utils/dates.js'
import { useQuery, useStore } from '@livestore/react'
import { getDocumentById$ } from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'
import { MarkdownRenderer } from '../markdown/MarkdownRenderer.js'
import { LoadingState } from '../ui/LoadingState.js'
import { LoadingSpinner } from '../ui/LoadingSpinner.js'
import { ROUTES, generateRoute } from '../../constants/routes.js'
import { useDocumentProjectsTargeted } from '../../hooks/useDocumentProjects.js'

export const DocumentPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>()
  const { store } = useStore()

  // Get document from store - always call hook to avoid React hook rules violation
  // Use impossible ID when documentId is not available to get empty result
  const documentResult = useQuery(getDocumentById$(documentId || '__impossible__'))
  const document = documentResult?.[0]
  const isLoading = !documentId ? false : documentResult === undefined

  // Get project associations
  const associatedProjects = useDocumentProjectsTargeted(documentId || '__impossible__')

  // Local state for editing
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update local state when document loads
  useEffect(() => {
    if (document) {
      setTitle(document.title || '')
      setContent(document.content || '')
    }
  }, [document])

  // Handle save - memoized to prevent stale closures in event handlers
  const handleSave = useCallback(async () => {
    if (!document || isSaving) return

    setIsSaving(true)
    try {
      const updates = {
        title: title !== document.title ? title : undefined,
        content: content !== document.content ? content : undefined,
      }

      // Only save if there are changes
      if (updates.title !== undefined || updates.content !== undefined) {
        await store.commit(
          events.documentUpdated({
            id: document.id,
            updates,
            updatedAt: new Date(),
          })
        )
      }

      setIsEditing(false)
      setError(null) // Clear any previous errors
    } catch (error) {
      console.error('Error saving document:', error)
      setError('Failed to save document. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [document, title, content, isSaving, store])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  // Handle loading and not found states
  if (!documentId) {
    return <LoadingState message='Invalid document URL' />
  }

  if (isLoading) {
    return <LoadingState message='Loading document...' />
  }

  if (!document) {
    return <LoadingState message='Document not found' />
  }

  return (
    <div className='h-full bg-white flex flex-col'>
      {/* Header with Breadcrumb */}
      <div className='border-b border-gray-200 bg-white px-6 py-4'>
        <div className='flex items-center gap-4 mb-3'>
          <Link
            to={preserveStoreIdInUrl(ROUTES.DOCUMENTS)}
            className='flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors'
            aria-label='Back to documents'
          >
            <svg
              className='w-4 h-4 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </Link>

          {/* Breadcrumb */}
          <nav className='flex items-center text-sm text-gray-500'>
            <Link
              to={preserveStoreIdInUrl(ROUTES.DOCUMENTS)}
              className='hover:text-gray-700 transition-colors'
            >
              Documents
            </Link>
            <svg className='w-4 h-4 mx-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
            <span className='text-gray-900 font-medium'>
              {document.title || 'Untitled Document'}
            </span>
          </nav>
        </div>

        {/* Document Actions */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <span className='text-xs text-gray-500'>
              Last updated {formatDate(document.updatedAt)}
            </span>

            {/* Project associations */}
            {associatedProjects.length > 0 && (
              <div className='flex items-center gap-2'>
                <span className='text-xs text-gray-500'>Projects:</span>
                <div className='flex flex-wrap gap-1'>
                  {associatedProjects.map(project => (
                    <Link
                      key={project.id}
                      to={preserveStoreIdInUrl(generateRoute.oldProject(project.id))}
                      className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors'
                    >
                      {project.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className='flex items-center gap-2'>
            {isEditing && (
              <button
                type='button'
                onClick={() => {
                  setTitle(document.title || '')
                  setContent(document.content || '')
                  setIsEditing(false)
                  setError(null) // Clear any errors when canceling
                }}
                className='px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors'
              >
                Cancel
              </button>
            )}

            <button
              type='button'
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={isSaving}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isEditing
                  ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size='sm' color='white' />
                  <span className='ml-2'>Saving...</span>
                </>
              ) : isEditing ? (
                <>
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                  Save
                </>
              ) : (
                <>
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                    />
                  </svg>
                  Edit
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-md'>
            <div className='flex items-center'>
              <svg
                className='w-5 h-5 text-red-400 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <span className='text-red-800 text-sm'>{error}</span>
              <button
                onClick={() => setError(null)}
                className='ml-auto text-red-400 hover:text-red-600'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Document Content */}
      <div className='flex-1 overflow-auto'>
        <div className='max-w-4xl mx-auto p-6'>
          {/* Document Title */}
          <div className='mb-6'>
            {isEditing ? (
              <input
                type='text'
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder='Document title'
                className='w-full text-2xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none focus:ring-0 p-0 bg-transparent'
              />
            ) : (
              <h1 className='text-2xl font-bold text-gray-900'>
                {document.title || 'Untitled Document'}
              </h1>
            )}
          </div>

          {/* Document Content */}
          <div className='prose prose-lg max-w-none'>
            {isEditing ? (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder='Write your document content here...'
                className='w-full min-h-[500px] text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
              />
            ) : (
              <div className='min-h-[500px] p-4 border border-gray-200 rounded-md bg-gray-50'>
                {document.content ? (
                  <MarkdownRenderer
                    content={document.content}
                    className='prose prose-lg max-w-none'
                  />
                ) : (
                  <div className='text-gray-500 italic'>
                    No content yet. Click Edit to add content.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
