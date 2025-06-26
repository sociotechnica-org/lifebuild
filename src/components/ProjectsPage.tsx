import { useQuery, useStore } from '@livestore/react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects$ } from '../livestore/queries.js'
import type { Project } from '../livestore/schema.js'
import { seedSampleBoards } from '../util/seed-data.js'
import { ProjectCard } from './ProjectCard.js'
import { CreateProjectModal } from './CreateProjectModal.js'
import { preserveStoreIdInUrl } from '../util/navigation.js'

export const ProjectsPage: React.FC = () => {
  const { store } = useStore()
  const navigate = useNavigate()
  const projects = useQuery(getProjects$) ?? []
  const hasSeededRef = React.useRef(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Seed sample data if no projects exist (dev only)
  React.useEffect(() => {
    if (projects.length === 0 && !hasSeededRef.current) {
      hasSeededRef.current = true
      seedSampleBoards(store)
    }
  }, [projects.length, store])

  const handleProjectClick = (project: Project) => {
    navigate(preserveStoreIdInUrl(`/project/${project.id}`))
  }

  if (projects.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-3xl font-bold text-gray-900 mb-8'>Projects</h1>
          <div className='flex flex-col items-center justify-center py-12'>
            <div className='text-center'>
              <h2 className='text-xl font-semibold text-gray-600 mb-4'>No projects found</h2>
              <p className='text-gray-500 mb-6'>
                Create your first project to get started organizing your work.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors'
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Projects</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors'
          >
            Create Project
          </button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleProjectClick(project)}
            />
          ))}
        </div>

        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </div>
  )
}
