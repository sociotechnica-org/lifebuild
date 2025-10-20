import React from 'react'
import type { ProjectCategory } from '@work-squared/shared'
import { formatRelativeTime } from '../../util/dates.js'
import { isNeglected } from '../../util/categoryHelpers.js'

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
  onQuickAdd?: () => void
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  projectCount,
  activeProjectCount,
  planningProjectCount,
  lastActivityAt,
  onClick,
  onQuickAdd,
}) => {
  const isActive = projectCount > 0
  const neglected = isNeglected(lastActivityAt)
  const relativeTime = formatRelativeTime(lastActivityAt)

  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    onQuickAdd?.()
  }

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full aspect-square rounded-lg sm:rounded-xl p-4 sm:p-6
        flex flex-col items-center justify-center
        transition-all duration-200
        cursor-pointer
        group
        min-h-[120px] sm:min-h-0
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
      <div className='text-4xl sm:text-5xl mb-2 sm:mb-4'>{category.icon}</div>

      {/* Category Name */}
      <h3 className='text-white font-semibold text-center text-sm sm:text-lg mb-2 leading-tight'>
        {category.name}
      </h3>

      {/* Status Indicators - Bottom Left */}
      <div className='absolute bottom-2 sm:bottom-4 left-2 sm:left-4 flex flex-col gap-1'>
        {/* Active Project Count */}
        {activeProjectCount > 0 && (
          <div className='bg-white/90 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5'>
            <span className='text-[10px] sm:text-xs font-semibold text-gray-900'>
              {activeProjectCount} Active
            </span>
          </div>
        )}

        {/* Planning Count */}
        {planningProjectCount > 0 && (
          <div className='bg-white/70 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5'>
            <span className='text-[10px] sm:text-xs font-medium text-gray-700'>
              {planningProjectCount} Planning
            </span>
          </div>
        )}

        {/* Empty State Guidance */}
        {projectCount === 0 && (
          <div className='bg-white/90 backdrop-blur-sm rounded-full px-2 sm:px-3 py-0.5 sm:py-1'>
            <span className='text-[10px] sm:text-xs font-medium text-gray-700'>Get Started →</span>
          </div>
        )}
      </div>

      {/* Last Activity - Bottom Right */}
      <div className='absolute bottom-2 sm:bottom-4 right-2 sm:right-4'>
        <div
          className={`
          backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5
          ${neglected ? 'bg-amber-100/90' : 'bg-white/70'}
        `}
        >
          <span
            className={`text-[10px] sm:text-xs font-medium ${neglected ? 'text-amber-800' : 'text-gray-600'}`}
          >
            {relativeTime}
          </span>
        </div>
      </div>

      {/* Active Indicator Dot */}
      {isActive && (
        <div className='absolute top-2 sm:top-4 right-2 sm:right-4 w-2 sm:w-3 h-2 sm:h-3 bg-white rounded-full shadow-md'></div>
      )}

      {/* Neglected Warning Indicator */}
      {neglected && isActive && (
        <div className='absolute top-2 sm:top-4 left-2 sm:left-4 w-2 sm:w-3 h-2 sm:h-3 bg-amber-400 rounded-full shadow-md'></div>
      )}

      {/* Quick Add Button - Shows on hover */}
      {onQuickAdd && projectCount > 0 && (
        <button
          onClick={handleQuickAddClick}
          className='absolute top-4 right-12 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50'
          aria-label='Quick add project'
        >
          <svg
            className='w-5 h-5 text-gray-700'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
        </button>
      )}

      {/* Larger Quick Add for Empty Categories */}
      {onQuickAdd && projectCount === 0 && (
        <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none'>
          <button
            onClick={handleQuickAddClick}
            className='w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors pointer-events-auto'
            aria-label='Add first project'
          >
            <svg
              className='w-10 h-10 text-gray-700'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
          </button>
        </div>
      )}
    </button>
  )
}
