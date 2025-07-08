import { useQuery, useStore } from '@livestore/react'
import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getAllDocuments$, getProjects$ } from '../livestore/queries.js'
import type { Document } from '../livestore/schema.js'
import { events } from '../livestore/schema.js'
import { DocumentCreateModal } from './DocumentCreateModal.js'
import { preserveStoreIdInUrl } from '../util/navigation.js'

export const DocumentsPage: React.FC = () => {
  const { store } = useStore()
  const documents = useQuery(getAllDocuments$) ?? []
  const projects = useQuery(getProjects$) ?? []
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProjectId, setFilterProjectId] = useState<string>('all')

  // TODO: Implement proper document-project associations
  // For now, we'll show documents without project associations

  // Filter documents based on search and project filter
  const filteredDocuments = useMemo(() => {
    let filtered = documents

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        doc => doc.title.toLowerCase().includes(query) || doc.content.toLowerCase().includes(query)
      )
    }

    // TODO: Apply project filter once we have proper associations

    return filtered
  }, [documents, searchQuery])

  const handleCreateDocument = () => {
    // If a project is filtered, use it as the default
    if (filterProjectId !== 'all') {
      setSelectedProjectId(filterProjectId)
    } else if (projects.length > 0) {
      setSelectedProjectId(projects[0]!.id)
    }
    // Always open the modal, even without a project
    setIsCreateModalOpen(true)
  }

  const handleArchiveDocument = async (documentId: string) => {
    if (confirm('Are you sure you want to archive this document?')) {
      store.commit(
        events.documentArchived({
          id: documentId,
          archivedAt: new Date(),
        })
      )
    }
  }

  return (
    <div className='h-full bg-gray-50 flex flex-col'>
      {/* Header */}
      <div className='border-b border-gray-200 bg-white px-6 py-4'>
        <div className='flex justify-between items-center mb-4'>
          <div>
            <h1 className='text-xl font-semibold text-gray-900 mb-1'>Documents</h1>
          </div>
          <button
            onClick={handleCreateDocument}
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
          >
            New Document
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className='flex gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <svg
                  className='h-5 w-5 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
              </div>
              <input
                type='text'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Search documents...'
                className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
              />
            </div>
          </div>
          {/* Project filter disabled until we implement proper associations */}
          <select
            value={filterProjectId}
            onChange={e => setFilterProjectId(e.target.value)}
            className='block w-48 px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm opacity-50'
            disabled
            title='Project filtering coming soon'
          >
            <option value='all'>All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-auto px-6 py-6'>
        {filteredDocuments.length === 0 ? (
          <div className='text-center py-12'>
            <svg
              className='mx-auto h-12 w-12 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            <h3 className='mt-2 text-sm font-medium text-gray-900'>No documents</h3>
            <p className='mt-1 text-sm text-gray-500'>
              {searchQuery || filterProjectId !== 'all'
                ? 'No documents match your search criteria.'
                : 'Get started by creating a new document.'}
            </p>
            {!searchQuery && filterProjectId === 'all' && (
              <div className='mt-6'>
                <button
                  onClick={handleCreateDocument}
                  className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                >
                  New Document
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {filteredDocuments.map(document => (
              <Link
                key={document.id}
                to={preserveStoreIdInUrl(`/document/${document.id}`)}
                className='bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer block'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1 min-w-0'>
                    <h3 className='text-base font-medium text-gray-900 truncate'>
                      {document.title || 'Untitled Document'}
                    </h3>
                    {document.content && (
                      <p className='mt-2 text-sm text-gray-600 line-clamp-3'>{document.content}</p>
                    )}
                    {/* TODO: Show associated projects once we implement proper associations */}
                    <div className='mt-3 flex items-center text-xs text-gray-500'>
                      <span>Updated {new Date(document.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className='ml-4 flex-shrink-0'>
                    <button
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleArchiveDocument(document.id)
                      }}
                      className='text-gray-400 hover:text-gray-500'
                      title='Archive document'
                    >
                      <svg
                        className='h-5 w-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Document Modal */}
      <DocumentCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setSelectedProjectId('')
        }}
        projectId={selectedProjectId}
      />
    </div>
  )
}
