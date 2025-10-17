import { useQuery } from '@livestore/react'
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects$ } from '@work-squared/shared/queries'
import { PROJECT_CATEGORIES, type ProjectCategory } from '@work-squared/shared'
import { CategoryCard } from './CategoryCard.js'
import { QuickAddProjectModal } from './QuickAddProjectModal.js'
import { preserveStoreIdInUrl } from '../../util/navigation.js'
import { generateRoute } from '../../constants/routes.js'

export const LifeMapView: React.FC = () => {
  const navigate = useNavigate()
  const projects = useQuery(getProjects$) ?? []
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | null>(null)

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
    navigate(preserveStoreIdInUrl(generateRoute.category(categoryValue)))
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
      <div className='border-b border-gray-200 bg-white px-6 py-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Life Map</h1>
          <p className='text-gray-600'>View and manage all areas of your life at a glance</p>
        </div>
      </div>

      {/* Content - 2x4 Grid */}
      <div className='flex-1 overflow-y-auto p-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
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
