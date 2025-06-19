import React from 'react'
import type { Project } from '../livestore/schema.js'

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date))
  }

  return (
    <div
      className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200'
      onClick={onClick}
    >
      <h3 className='text-lg font-semibold text-gray-900 mb-2'>{project.name}</h3>
      {project.description && (
        <p className='text-sm text-gray-600 mb-3 line-clamp-2'>{project.description}</p>
      )}
      <div className='text-sm text-gray-500'>
        <p>Created: {formatDate(project.createdAt)}</p>
        <p>Updated: {formatDate(project.updatedAt)}</p>
      </div>
    </div>
  )
}
