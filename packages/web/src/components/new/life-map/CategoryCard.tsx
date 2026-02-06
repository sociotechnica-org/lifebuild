import React from 'react'
import { Link } from 'react-router-dom'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'
import type { Project } from '@lifebuild/shared/schema'
import { usePostHog } from '../../../lib/analytics.js'
import { ProjectAvatar } from '../../common/ProjectAvatar.js'

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
      className='block no-underline mb-2 p-2 rounded-lg bg-[#faf9f7] hover:bg-[#f5f3f0] transition-colors duration-200'
      onClick={e => e.stopPropagation()}
    >
      <div className='flex items-center gap-2'>
        <ProjectAvatar project={project} size={24} />
        <div className='font-semibold text-sm text-[#2f2b27] mb-1'>{project.name}</div>
      </div>
      <div className='h-2 bg-[#f1efe9] rounded-full overflow-hidden'>
        <div
          className='h-full rounded-full'
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
  const posthog = usePostHog()

  const handleCardClick = () => {
    posthog?.capture('life_map_category_clicked', { category: categoryValue })
  }

  return (
    <div
      className='border-2 rounded-2xl p-4 bg-white'
      style={{ borderColor: categoryColor }}
      onClick={handleCardClick}
    >
      <h3 className="font-['Source_Serif_4',Georgia,serif] text-lg font-semibold mb-2 flex items-center gap-1">
        <span style={{ color: categoryColor }}>●</span>
        {categoryIcon && <span> {categoryIcon}</span>} {categoryName}
      </h3>

      {/* Active Projects Section */}
      {activeProjects.length > 0 && (
        <div className='mt-2'>
          <div className='text-[10px] font-semibold text-[#8b8680] uppercase tracking-wide mb-1'>
            Active
          </div>
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
        <div className='mt-2'>
          <div className='text-[10px] font-semibold text-[#8b8680] uppercase tracking-wide mb-1'>
            Ongoing
          </div>
          <div className='grid grid-cols-2 gap-1'>
            {ongoingProjects.slice(0, 6).map(project => (
              <Link
                key={project.id}
                to={preserveStoreIdInUrl(generateRoute.project(project.id))}
                className='no-underline p-1.5 rounded bg-[#faf9f7] hover:bg-[#f5f3f0] transition-colors duration-200'
                onClick={e => e.stopPropagation()}
              >
                <div className='flex items-center gap-1.5 text-xs text-[#2f2b27] truncate'>
                  <ProjectAvatar project={project} size={18} />
                  <span className='truncate'>{project.name}</span>
                </div>
              </Link>
            ))}
          </div>
          {ongoingProjects.length > 6 && (
            <div className='text-xs text-[#8b8680] mt-1'>+{ongoingProjects.length - 6} more</div>
          )}
        </div>
      )}

      {/* Planning and Backlog links */}
      {(planningCount > 0 || backlogCount > 0) && (
        <div className='mt-2 flex gap-2 flex-wrap'>
          {planningCount > 0 && (
            <Link
              to={preserveStoreIdInUrl(`${generateRoute.draftingRoom()}?category=${categoryValue}`)}
              className='no-underline text-[10px] font-semibold text-[#8b8680] uppercase tracking-wide hover:text-[#2f2b27]'
              onClick={e => e.stopPropagation()}
            >
              DRAFTING ({planningCount})
            </Link>
          )}
          {backlogCount > 0 && (
            <Link
              to={preserveStoreIdInUrl(`${generateRoute.sortingRoom()}?category=${categoryValue}`)}
              className='no-underline text-[10px] font-semibold text-[#8b8680] uppercase tracking-wide hover:text-[#2f2b27]'
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
