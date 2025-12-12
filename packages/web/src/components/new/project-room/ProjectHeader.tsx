import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import type { Project } from '@lifebuild/shared/schema'
import { getTableConfiguration$ } from '@lifebuild/shared/queries'
import {
  resolveLifecycleState,
  describeProjectLifecycleState,
  type ProjectLifecycleState,
} from '@lifebuild/shared'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'

interface ProjectHeaderProps {
  project: Project
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const navigate = useNavigate()
  const tableConfiguration = useQuery(getTableConfiguration$) ?? []
  const tableConfig = tableConfiguration[0]

  // Get lifecycle state
  const lifecycleState: ProjectLifecycleState = resolveLifecycleState(
    project.projectLifecycleState,
    null
  )

  // Check if project is on the table
  const isOnGoldTable = tableConfig?.goldProjectId === project.id
  const isOnSilverTable = tableConfig?.silverProjectId === project.id
  const isOnTable = isOnGoldTable || isOnSilverTable

  // Get table slot label
  const tableSlotLabel = isOnGoldTable ? 'Gold' : isOnSilverTable ? 'Silver' : null

  // Get lifecycle description
  const lifecycleDescription = describeProjectLifecycleState(lifecycleState)

  const handleClose = () => {
    navigate(preserveStoreIdInUrl(generateRoute.lifeMap()))
  }

  return (
    <div className='bg-white border-b border-[#e5e2dc] px-6 py-4 rounded-t-2xl'>
      <div className='flex items-start justify-between'>
        <div className='flex-1 min-w-0'>
          {/* Project name */}
          <h1 className='text-2xl font-bold text-gray-900 truncate'>{project.name}</h1>

          {/* Status badges */}
          <div className='flex items-center gap-2 mt-2'>
            {/* Lifecycle status badge */}
            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
              {lifecycleDescription}
            </span>

            {/* On Table badge */}
            {isOnTable && tableSlotLabel && (
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                On Table · {tableSlotLabel}
              </span>
            )}
          </div>

          {/* Objectives */}
          {lifecycleState.objectives && (
            <p className='mt-3 text-sm text-gray-600'>{lifecycleState.objectives}</p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className='flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors'
          aria-label='Close and return to Life Map'
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
    </div>
  )
}
