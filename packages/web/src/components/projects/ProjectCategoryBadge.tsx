import React from 'react'
import { getCategoryInfo, type ProjectCategory } from '@work-squared/shared'

interface ProjectCategoryBadgeProps {
  category: ProjectCategory
  size?: 'sm' | 'md' | 'lg'
}

export const ProjectCategoryBadge: React.FC<ProjectCategoryBadgeProps> = ({
  category,
  size = 'sm',
}) => {
  const info = getCategoryInfo(category)
  if (!info) return null

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium text-white ${sizeClasses[size]}`}
      style={{ backgroundColor: info.colorHex }}
      title={info.description}
    >
      {info.name}
    </span>
  )
}
