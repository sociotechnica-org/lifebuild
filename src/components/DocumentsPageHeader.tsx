import React from 'react'
import type { Project } from '../livestore/schema.js'

interface DocumentsPageHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterProjectId: string
  onFilterChange: (projectId: string) => void
  projects: readonly Project[]
  onCreateDocument: () => void
}

export const DocumentsPageHeader: React.FC<DocumentsPageHeaderProps> = ({
  searchQuery,
  onSearchChange,
  filterProjectId,
  onFilterChange,
  projects,
  onCreateDocument,
}) => {
  return (
    <div className='border-b border-gray-200 bg-white px-6 py-4'>
      <div className='flex justify-between items-center mb-4'>
        <div>
          <h1 className='text-xl font-semibold text-gray-900 mb-1'>Documents</h1>
        </div>
        <button
          onClick={onCreateDocument}
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
              onChange={e => onSearchChange(e.target.value)}
              placeholder='Search documents...'
              className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
            />
          </div>
        </div>
        {/* Project filter disabled until we implement proper associations */}
        <select
          value={filterProjectId}
          onChange={e => onFilterChange(e.target.value)}
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
  )
}
