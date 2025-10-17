import React from 'react'
import type { ProjectCategory } from '@work-squared/shared'

export interface CategoryCardProps {
  category: {
    value: ProjectCategory
    name: string
    description: string
    colorHex: string
    icon: string
    sortOrder: number
  }
  projectCount: number
  activeProjectCount: number
  planningProjectCount: number
  lastActivityAt: number | null
  onClick: () => void
}

/**
 * Format a timestamp as relative time (e.g., "Active today", "3 days ago")
 */
function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'No activity'

  const now = Date.now()
  const diffMs = now - timestamp
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffDays === 0) return 'Active today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffWeeks === 1) return '1 week ago'
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths === 1) return '1 month ago'
  if (diffMonths < 12) return `${diffMonths} months ago`

  return 'Over a year ago'
}

/**
 * Check if a category should show a warning for being neglected (>1 week since activity)
 */
function isNeglected(timestamp: number | null): boolean {
  if (!timestamp) return false
  const now = Date.now()
  const diffMs = now - timestamp
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDays > 7
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  projectCount,
  activeProjectCount,
  planningProjectCount,
  lastActivityAt,
  onClick,
}) => {
  const isActive = projectCount > 0
  const neglected = isNeglected(lastActivityAt)
  const relativeTime = formatRelativeTime(lastActivityAt)

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full aspect-square rounded-xl p-6
        flex flex-col items-center justify-center
        transition-all duration-200
        cursor-pointer
        ${
          isActive
            ? 'shadow-md hover:shadow-xl hover:-translate-y-1'
            : 'shadow-sm hover:shadow-md opacity-60 hover:opacity-80'
        }
      `}
      style={{
        backgroundColor: isActive ? category.colorHex : '#D4CCC8',
      }}
    >
      {/* Icon */}
      <div className='text-5xl mb-4'>{category.icon}</div>

      {/* Category Name */}
      <h3 className='text-white font-semibold text-center text-lg mb-2'>{category.name}</h3>

      {/* Status Indicators - Bottom Left */}
      <div className='absolute bottom-4 left-4 flex flex-col gap-1'>
        {/* Active Project Count */}
        {activeProjectCount > 0 && (
          <div className='bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5'>
            <span className='text-xs font-semibold text-gray-900'>{activeProjectCount} Active</span>
          </div>
        )}

        {/* Planning Count */}
        {planningProjectCount > 0 && (
          <div className='bg-white/70 backdrop-blur-sm rounded-full px-2 py-0.5'>
            <span className='text-xs font-medium text-gray-700'>
              {planningProjectCount} Planning
            </span>
          </div>
        )}

        {/* No Projects Message */}
        {projectCount === 0 && (
          <div className='bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5'>
            <span className='text-xs font-medium text-gray-700'>No projects</span>
          </div>
        )}
      </div>

      {/* Last Activity - Bottom Right */}
      <div className='absolute bottom-4 right-4'>
        <div
          className={`
          backdrop-blur-sm rounded-full px-2 py-0.5
          ${neglected ? 'bg-amber-100/90' : 'bg-white/70'}
        `}
        >
          <span className={`text-xs font-medium ${neglected ? 'text-amber-800' : 'text-gray-600'}`}>
            {relativeTime}
          </span>
        </div>
      </div>

      {/* Active Indicator Dot */}
      {isActive && (
        <div className='absolute top-4 right-4 w-3 h-3 bg-white rounded-full shadow-md'></div>
      )}

      {/* Neglected Warning Indicator */}
      {neglected && isActive && (
        <div className='absolute top-4 left-4 w-3 h-3 bg-amber-400 rounded-full shadow-md'></div>
      )}
    </button>
  )
}
