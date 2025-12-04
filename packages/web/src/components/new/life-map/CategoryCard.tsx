import React from 'react'
import { Link } from 'react-router-dom'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'
import type { Project } from '@work-squared/shared/schema'

export type CategoryCardProps = {
  categoryValue: string
  categoryName: string
  categoryIcon?: string
  categoryColor: string
  projectCount: number
  workerCount: number
  activeProjects?: Project[]
  ongoingProjects?: Project[]
  backlogCount?: number
  planningCount?: number
  projectCompletionMap?: Map<string, number>
}

/**
 * ProjectItem - A clickable project card within a category
 */
const ProjectItem: React.FC<{
  project: Project
  categoryColor: string
  completionPercentage: number
}> = ({ project, categoryColor, completionPercentage }) => {
  return (
    <Link
      to={preserveStoreIdInUrl(generateRoute.project(project.id))}
      className='new-ui-project-card'
      style={{ textDecoration: 'none', display: 'block' }}
      onClick={e => e.stopPropagation()}
    >
      <div className='title'>{project.name}</div>
      <div className='progress'>
        <div
          className='bar'
          style={{
            width: `${completionPercentage}%`,
            backgroundColor: categoryColor,
          }}
        />
      </div>
    </Link>
  )
}

/**
 * CategoryCard component - Displays a life category card with project/worker stats
 * and active projects (dual presence from The Table).
 *
 * Based on the prototype design with gradient background and color-coded borders.
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({
  categoryValue,
  categoryName,
  categoryIcon,
  categoryColor,
  projectCount: _projectCount,
  workerCount: _workerCount,
  activeProjects = [],
  ongoingProjects = [],
  backlogCount = 0,
  planningCount = 0,
  projectCompletionMap = new Map(),
}) => {
  return (
    <div className='new-ui-category-card' style={{ borderColor: categoryColor }}>
      <Link
        to={preserveStoreIdInUrl(generateRoute.category(categoryValue))}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <h3>
          <span style={{ color: categoryColor }}>●</span>
          {categoryIcon && <span> {categoryIcon}</span>} {categoryName}
        </h3>
      </Link>

      {/* Active Projects Section */}
      {activeProjects.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <div className='new-ui-planted-label'>Active</div>
          {activeProjects.map(project => (
            <ProjectItem
              key={project.id}
              project={project}
              categoryColor={categoryColor}
              completionPercentage={projectCompletionMap.get(project.id) ?? 0}
            />
          ))}
        </div>
      )}

      {/* Ongoing Projects Section (active status, not on table) */}
      {ongoingProjects.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <div className='new-ui-planted-label'>Ongoing</div>
          <div className='new-ui-planted-grid'>
            {ongoingProjects.slice(0, 6).map(project => (
              <Link
                key={project.id}
                to={preserveStoreIdInUrl(generateRoute.project(project.id))}
                className='new-ui-planted-card'
                style={{ textDecoration: 'none' }}
                onClick={e => e.stopPropagation()}
              >
                <div className='new-ui-planted-title'>{project.name}</div>
              </Link>
            ))}
          </div>
          {ongoingProjects.length > 6 && (
            <div className='count' style={{ marginTop: '0.25rem' }}>
              +{ongoingProjects.length - 6} more
            </div>
          )}
        </div>
      )}

      {/* Planning and Backlog links */}
      {(planningCount > 0 || backlogCount > 0) && (
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {planningCount > 0 && (
            <Link
              to={preserveStoreIdInUrl(`${generateRoute.draftingRoom()}?category=${categoryValue}`)}
              className='new-ui-backlog-link'
              style={{ textDecoration: 'none' }}
              onClick={e => e.stopPropagation()}
            >
              DRAFTING ({planningCount})
            </Link>
          )}
          {backlogCount > 0 && (
            <Link
              to={preserveStoreIdInUrl(`${generateRoute.sortingRoom()}?category=${categoryValue}`)}
              className='new-ui-backlog-link'
              style={{ textDecoration: 'none' }}
              onClick={e => e.stopPropagation()}
            >
              SORTING ({backlogCount})
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
