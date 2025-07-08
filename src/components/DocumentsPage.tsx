import { useQuery, useStore } from '@livestore/react'
import React, { useState } from 'react'
import { getAllDocuments$, getProjects$ } from '../livestore/queries.js'
import { events } from '../livestore/schema.js'
import { DocumentCreateModal } from './DocumentCreateModal.js'
import { DocumentsPageHeader } from './DocumentsPageHeader.js'
import { DocumentsEmptyState } from './DocumentsEmptyState.js'
import { DocumentCard } from './DocumentCard.js'
import { ArchiveConfirmModal } from './ArchiveConfirmModal.js'
import { ErrorMessage } from './ErrorMessage.js'
import { useSearch } from '../hooks/useSearch.js'

export const DocumentsPage: React.FC = () => {
  const { store } = useStore()
  const documents = useQuery(getAllDocuments$) ?? []
  const projects = useQuery(getProjects$) ?? []
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProjectId, setFilterProjectId] = useState<string>('all')
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // TODO: Implement proper document-project associations
  // For now, we'll show documents without project associations

  // Filter documents based on search and project filter
  const filteredDocuments = useSearch(documents, searchQuery, {
    searchFields: ['title', 'content'],
    // TODO: Add project filter once we have proper associations
  })

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
    try {
      await store.commit(
        events.documentArchived({
          id: documentId,
          archivedAt: new Date(),
        })
      )
      setConfirmArchive(null)
      setError(null)
    } catch (error) {
      console.error('Error archiving document:', error)
      setError('Failed to archive document. Please try again.')
    }
  }

  return (
    <div className='h-full bg-gray-50 flex flex-col'>
      <DocumentsPageHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterProjectId={filterProjectId}
        onFilterChange={setFilterProjectId}
        projects={projects}
        onCreateDocument={handleCreateDocument}
      />

      <div className='flex-1 overflow-auto px-6 py-6'>
        {filteredDocuments.length === 0 ? (
          <DocumentsEmptyState
            searchQuery={searchQuery}
            filterProjectId={filterProjectId}
            onCreateDocument={handleCreateDocument}
          />
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {filteredDocuments.map(document => (
              <DocumentCard key={document.id} document={document} onArchive={setConfirmArchive} />
            ))}
          </div>
        )}
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      <ArchiveConfirmModal
        isOpen={!!confirmArchive}
        onConfirm={() => confirmArchive && handleArchiveDocument(confirmArchive)}
        onCancel={() => setConfirmArchive(null)}
      />

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
