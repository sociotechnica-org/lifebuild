import { useQuery } from '../../livestore-compat.js'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects$ } from '@lifebuild/shared/queries'
import { PROJECT_CATEGORIES, type ProjectCategory, getCategoryInfo } from '@lifebuild/shared'
import { CategoryCard } from './CategoryCard.js'
import { QuickAddProjectModal } from './QuickAddProjectModal.js'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'
import { generateRoute } from '../../constants/routes.js'

const LAST_VISITED_CATEGORY_KEY = 'lifemap:lastVisitedCategory'
const LAST_VISIT_TIMESTAMP_KEY = 'lifemap:lastVisitTimestamp'
const RECENT_VISIT_THRESHOLD = 24 * 60 * 60 * 1000 // 24 hours

export const LifeMapView: React.FC = () => {
  const navigate = useNavigate()
  const projects = useQuery(getProjects$) ?? []
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | null>(null)
  const [lastVisitedCategory, setLastVisitedCategory] = useState<ProjectCategory | null>(null)
  const [showReturnButton, setShowReturnButton] = useState(false)

  // Load last visited category from localStorage on mount
  useEffect(() => {
    const lastCategory = localStorage.getItem(LAST_VISITED_CATEGORY_KEY)
    const lastTimestamp = localStorage.getItem(LAST_VISIT_TIMESTAMP_KEY)

    if (lastCategory && lastTimestamp) {
      // Validate that the category exists in our constants
      const categoryInfo = getCategoryInfo(lastCategory as ProjectCategory)
      if (!categoryInfo) {
        // Invalid category, clear localStorage
        localStorage.removeItem(LAST_VISITED_CATEGORY_KEY)
        localStorage.removeItem(LAST_VISIT_TIMESTAMP_KEY)
        return
      }

      const timeSinceVisit = Date.now() - parseInt(lastTimestamp, 10)
      if (timeSinceVisit < RECENT_VISIT_THRESHOLD) {
        setLastVisitedCategory(lastCategory as ProjectCategory)
        setShowReturnButton(true)
      }
    }
  }, [])

  // Compute category stats by combining hardcoded categories with project counts
  const categoriesWithStats = useMemo(() => {
    return PROJECT_CATEGORIES.map(category => {
      const categoryProjects = projects.filter(
        p => p.category === category.value && !p.archivedAt && !p.deletedAt
      )

      // Count active projects: status === 'active' OR no status set
      const activeProjects = categoryProjects.filter(p => {
        const status = (p.attributes as { status?: string } | null)?.status
        return status === 'active' || (!status && !p.archivedAt && !p.deletedAt)
      })

      // Count planning projects: status === 'planning'
      const planningProjects = categoryProjects.filter(p => {
        const status = (p.attributes as { status?: string } | null)?.status
        return status === 'planning'
      })

      // Compute last activity timestamp
      // Get the most recent updatedAt from category projects OR their tasks
      const lastActivityAt =
        categoryProjects.length > 0
          ? Math.max(...categoryProjects.map(p => p.updatedAt.getTime()))
          : null

      return {
        ...category,
        projectCount: categoryProjects.length,
        activeProjectCount: activeProjects.length,
        planningProjectCount: planningProjects.length,
        lastActivityAt,
      }
    })
  }, [projects])

  const handleCategoryClick = (categoryValue: string) => {
    // Persist last visited category
    localStorage.setItem(LAST_VISITED_CATEGORY_KEY, categoryValue)
    localStorage.setItem(LAST_VISIT_TIMESTAMP_KEY, Date.now().toString())

    navigate(preserveStoreIdInUrl(generateRoute.oldCategory(categoryValue)))
  }

  const handleReturnToCategory = () => {
    if (lastVisitedCategory) {
      handleCategoryClick(lastVisitedCategory)
    }
  }

  const handleQuickAdd = (categoryValue: ProjectCategory) => {
    setSelectedCategory(categoryValue)
    setQuickAddModalOpen(true)
  }

  const handleCloseModal = () => {
    setQuickAddModalOpen(false)
    setSelectedCategory(null)
  }

  return (
    <div className='h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col'>
      {/* Header */}
      <div className='border-b border-gray-200 bg-white px-4 sm:px-6 py-4 sm:py-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1'>
              <h1 className='text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2'>Life Map</h1>
              <p className='text-sm sm:text-base text-gray-600'>
                View and manage all areas of your life at a glance
              </p>
            </div>

            {/* Return to Last Visited Category Button */}
            {showReturnButton && lastVisitedCategory && (
              <button
                onClick={handleReturnToCategory}
                className='flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm sm:text-base font-medium text-gray-700 whitespace-nowrap'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M10 19l-7-7m0 0l7-7m-7 7h18'
                  />
                </svg>
                <span className='hidden sm:inline'>Return to </span>
                <span>{getCategoryInfo(lastVisitedCategory)?.name}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content - Responsive Grid Layout */}
      <div className='flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8'>
        <div className='max-w-7xl mx-auto'>
          {/* Mobile: 2x4 grid, Tablet: 2x4 grid, Desktop: 4x2 grid */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6'>
            {categoriesWithStats.map(category => (
              <CategoryCard
                key={category.value}
                category={category}
                projectCount={category.projectCount}
                activeProjectCount={category.activeProjectCount}
                planningProjectCount={category.planningProjectCount}
                lastActivityAt={category.lastActivityAt}
                onClick={() => handleCategoryClick(category.value)}
                onQuickAdd={() => handleQuickAdd(category.value)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {selectedCategory && (
        <QuickAddProjectModal
          isOpen={quickAddModalOpen}
          onClose={handleCloseModal}
          categoryId={selectedCategory}
        />
      )}
    </div>
  )
}
