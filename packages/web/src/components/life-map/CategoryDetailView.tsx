import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import { getProjects$ } from '@work-squared/shared/queries'
import { getCategoryInfo } from '@work-squared/shared'
import { ProjectCard } from '../projects/ProjectCard/ProjectCard.js'
import { preserveStoreIdInUrl } from '../../util/navigation.js'
import { generateRoute } from '../../constants/routes.js'
import type { Project } from '@work-squared/shared/schema'

/**
 * Category Detail View - Shows projects within a specific life category
 * Part of Story 1.4: Navigate to category detail on click
 */
export const CategoryDetailView: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const projects = useQuery(getProjects$) ?? []

  const categoryInfo = getCategoryInfo(categoryId as any)

  if (!categoryInfo) {
    return (
      <div className='h-full bg-white flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-600 mb-2'>Category not found</h2>
          <button
            onClick={() => navigate(preserveStoreIdInUrl('/life-map'))}
            className='text-blue-500 hover:text-blue-600'
          >
            Back to Life Map
          </button>
        </div>
      </div>
    )
  }

  const categoryProjects = projects.filter(
    p => p.category === categoryId && !p.archivedAt && !p.deletedAt
  )

  const handleProjectClick = (project: Project) => {
    navigate(preserveStoreIdInUrl(generateRoute.project(project.id)))
  }

  return (
    <div className='h-full bg-white flex flex-col'>
      {/* Header */}
      <div className='border-b border-gray-200 bg-white px-6 py-6'>
        <div className='flex items-center gap-4 mb-4'>
          <button
            onClick={() => navigate(preserveStoreIdInUrl('/life-map'))}
            className='text-gray-500 hover:text-gray-700'
          >
            ← Back to Life Map
          </button>
        </div>
        <div className='flex items-center gap-4'>
          <div
            className='w-16 h-16 rounded-xl flex items-center justify-center text-3xl'
            style={{ backgroundColor: categoryInfo.colorHex }}
          >
            {categoryInfo.icon}
          </div>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>{categoryInfo.name}</h1>
            <p className='text-gray-600'>{categoryInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {categoryProjects.length === 0 ? (
        <div className='flex-1 bg-gray-50 flex flex-col items-center justify-center p-8'>
          <div className='text-center'>
            <h2 className='text-xl font-semibold text-gray-600 mb-4'>No projects yet</h2>
            <p className='text-gray-500 mb-6'>
              Create your first project in this life category to get started.
            </p>
            {/* TODO: Add quick create project button in Story 3.1 */}
          </div>
        </div>
      ) : (
        <div className='flex-1 overflow-y-auto bg-gray-50 p-8'>
          <div className='max-w-7xl mx-auto'>
            <div className='mb-4 text-sm text-gray-600'>
              {categoryProjects.length} {categoryProjects.length === 1 ? 'project' : 'projects'}
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {categoryProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleProjectClick(project)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
