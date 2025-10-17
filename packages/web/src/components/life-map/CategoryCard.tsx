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
  onClick: () => void
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, projectCount, onClick }) => {
  const isActive = projectCount > 0

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

      {/* Project Count Badge */}
      <div className='absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1'>
        <span className='text-xs font-medium text-gray-700'>
          {projectCount === 0
            ? 'No projects'
            : `${projectCount} ${projectCount === 1 ? 'project' : 'projects'}`}
        </span>
      </div>

      {/* Active Indicator Dot */}
      {isActive && (
        <div className='absolute top-4 right-4 w-3 h-3 bg-white rounded-full shadow-md'></div>
      )}
    </button>
  )
}
