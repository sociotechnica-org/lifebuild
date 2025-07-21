import { useQuery } from '@livestore/react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects$ } from '@work-squared/shared/queries'
import type { Project } from '@work-squared/shared/schema'
import { ProjectCard } from './ProjectCard/ProjectCard.js'
import { CreateProjectModal } from './CreateProjectModal/CreateProjectModal.js'
import { preserveStoreIdInUrl } from '../../util/navigation.js'
import { generateRoute } from '../../constants/routes.js'

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate()
  const projects = useQuery(getProjects$) ?? []
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleProjectClick = (project: Project) => {
    navigate(preserveStoreIdInUrl(generateRoute.project(project.id)))
  }

  if (projects.length === 0) {
    return (
      <div className='h-full bg-white flex flex-col'>
        {/* Header */}
        <div className='border-b border-gray-200 bg-white px-6 py-4'>
          <div className='flex justify-between items-center mb-4'>
            <div>
              <h1 className='text-xl font-semibold text-gray-900 mb-1'>Projects</h1>
              <p className='text-gray-600 text-sm'>Organize your work into projects</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
            >
              Create Project
            </button>
          </div>
        </div>

        {/* Empty State Content */}
        <div className='flex-1 bg-gray-50 flex flex-col items-center justify-center p-8'>
          <div className='text-center'>
            <h2 className='text-xl font-semibold text-gray-600 mb-4'>No projects found</h2>
            <p className='text-gray-500 mb-6'>
              Create your first project to get started organizing your work.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
            >
              Create Project
            </button>
          </div>
        </div>

        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    )
  }

  return (
    <div className='h-full bg-white flex flex-col'>
      {/* Header */}
      <div className='border-b border-gray-200 bg-white px-6 py-4'>
        <div className='flex justify-between items-center mb-4'>
          <div>
            <h1 className='text-xl font-semibold text-gray-900 mb-1'>Projects</h1>
            <p className='text-gray-600 text-sm'>Organize your work into projects</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
          >
            Create Project
          </button>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto bg-gray-50 p-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project)}
              />
            ))}
          </div>
        </div>
      </div>

      <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  )
}
