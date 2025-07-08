import React from 'react'
import { Link } from 'react-router-dom'
import type { Document } from '../livestore/schema.js'
import { preserveStoreIdInUrl } from '../util/navigation.js'
import { generateRoute } from '../constants/routes.js'

interface DocumentCardProps {
  document: Document
  onArchive: (documentId: string) => void
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onArchive }) => {
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
