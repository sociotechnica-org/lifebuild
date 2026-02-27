import React from 'react'
import { getCategoryInfo, PROJECT_CATEGORIES, type ProjectCategory } from '@lifebuild/shared'

export type WorkshopUnplacedProjectItem = {
  id: string
  name: string
  category: string | null
}

type WorkshopOverlayContentProps = {
  unplacedProjects?: readonly WorkshopUnplacedProjectItem[]
  onPlaceOnMap?: (projectId: string) => void
}

const CategoryDot: React.FC<{ category: string | null }> = ({ category }) => {
  const isKnownCategory = PROJECT_CATEGORIES.some(item => item.value === category)
  const normalizedCategory = isKnownCategory ? (category as ProjectCategory) : null
  const categoryInfo = getCategoryInfo(normalizedCategory)

  return (
    <span
      className='h-2.5 w-2.5 flex-shrink-0 rounded-full'
      style={{ backgroundColor: categoryInfo?.colorHex ?? '#8b8680' }}
    />
  )
}

export const WorkshopOverlayContent: React.FC<WorkshopOverlayContentProps> = ({
  unplacedProjects = [],
  onPlaceOnMap,
}) => {
  return (
    <div className='mx-auto w-full max-w-3xl px-1 py-2'>
      <h1 className='text-2xl font-semibold text-[#2f2b27]'>Workshop</h1>

      <p className='mt-2 text-sm text-[#6a5845]'>
        Select a project sketch, then place it on an empty hex tile.
      </p>

      <div className='mt-5 rounded-2xl border border-[#d8cab3] bg-[#f0e2c9] p-5 shadow-[0_14px_28px_rgba(68,46,26,0.14)]'>
        <h2 className='text-sm font-semibold text-[#3f3024]'>Unplaced Projects</h2>
        <p className='mt-1 text-xs text-[#5f4a36]'>Ready to place: {unplacedProjects.length}</p>

        {unplacedProjects.length === 0 ? (
          <div
            className='mt-4 rounded-xl border border-dashed border-[#b59370] bg-[#fff7eb] px-4 py-5 text-sm text-[#5f4a36]'
            data-testid='workshop-empty-unplaced-projects'
          >
            No unplaced projects right now.
          </div>
        ) : (
          <ul className='mt-4 space-y-2' data-testid='workshop-unplaced-project-list'>
            {unplacedProjects.map(project => (
              <li
                key={project.id}
                className='flex items-center gap-3 rounded-xl border border-[#d8cab3] bg-[#fff7eb] px-3 py-2'
              >
                <CategoryDot category={project.category} />
                <span className='min-w-0 flex-1 truncate text-sm font-medium text-[#2f2b27]'>
                  {project.name}
                </span>
                <button
                  type='button'
                  className='rounded-md border border-[#c48b5a] bg-[#fff2e4] px-2.5 py-1 text-xs font-semibold text-[#8f5d2f] hover:bg-[#fde8d2]'
                  onClick={() => onPlaceOnMap?.(project.id)}
                  data-testid={`workshop-place-project-${project.id}`}
                >
                  Place
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className='mt-4 text-xs text-[#5f4a36]'>
          Placement mode closes this overlay and highlights valid hex cells on the map.
        </p>
      </div>
    </div>
  )
}
