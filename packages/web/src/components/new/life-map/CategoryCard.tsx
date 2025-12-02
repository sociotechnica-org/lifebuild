import React from 'react'
import { Link } from 'react-router-dom'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'

export type CategoryCardProps = {
  categoryValue: string
  categoryName: string
  categoryIcon?: string
  categoryColor: string
  projectCount: number
  workerCount: number
}

/**
 * CategoryCard component - Displays a life category card with project/worker stats
 * and eventually active projects (dual presence from The Table).
 *
 * Based on the prototype design with gradient background and color-coded borders.
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({
  categoryValue,
  categoryName,
  categoryIcon,
  categoryColor,
  projectCount,
  workerCount,
}) => {
  return (
    <Link
      to={preserveStoreIdInUrl(generateRoute.newCategory(categoryValue))}
      className='new-ui-category-card'
      style={{ borderColor: categoryColor, textDecoration: 'none' }}
    >
      <h3>
        <span style={{ color: categoryColor }}>●</span>
        {categoryIcon && <span> {categoryIcon}</span>} {categoryName}
      </h3>
      <div className='count'>
        {projectCount} {projectCount === 1 ? 'project' : 'projects'}
        {workerCount > 0 && (
          <>
            {' · '}
            {workerCount} {workerCount === 1 ? 'worker' : 'workers'}
          </>
        )}
      </div>

      {/* TODO: Add active projects section (dual presence from The Table) */}
      {/* This will show Gold/Silver/Bronze projects that belong to this category */}

      {/* TODO: Add ongoing/planted projects section */}
      {/* This will show automated projects (AI delegated, service, system) */}
    </Link>
  )
}
