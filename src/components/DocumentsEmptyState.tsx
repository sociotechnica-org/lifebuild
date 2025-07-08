import React from 'react'

interface DocumentsEmptyStateProps {
  searchQuery: string
  filterProjectId: string
  onCreateDocument: () => void
}

export const DocumentsEmptyState: React.FC<DocumentsEmptyStateProps> = ({
  searchQuery,
  filterProjectId,
  onCreateDocument,
}) => {
  return (
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
            onClick={onCreateDocument}
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
          >
            New Document
          </button>
        </div>
      )}
    </div>
  )
}
