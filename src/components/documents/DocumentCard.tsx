import React from 'react'
import { Link } from 'react-router-dom'
import type { Document } from '../../livestore/schema.js'
import { preserveStoreIdInUrl } from '../../util/navigation.js'
import { generateRoute } from '../../constants/routes.js'
import { useDocumentProjects } from '../../hooks/useDocumentProjects.js'

interface DocumentCardProps {
  document: Document
  onArchive: (documentId: string) => void
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onArchive }) => {
  const associatedProjects = useDocumentProjects(document.id)
  return (
    <Link
      to={preserveStoreIdInUrl(generateRoute.document(document.id))}
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

          {/* Project associations */}
          {associatedProjects.length > 0 && (
            <div className='mt-3 flex items-center gap-2'>
              <svg
                className='w-3 h-3 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
                />
              </svg>
              <div className='flex flex-wrap gap-1'>
                {associatedProjects.map(project => (
                  <span
                    key={project.id}
                    className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700'
                  >
                    {project.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className='mt-3 flex items-center text-xs text-gray-500'>
            <span>Updated {new Date(document.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className='ml-4 flex-shrink-0'>
          <button
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onArchive(document.id)
            }}
            className='text-gray-400 hover:text-gray-500'
            title='Archive document'
          >
            <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
  )
}
