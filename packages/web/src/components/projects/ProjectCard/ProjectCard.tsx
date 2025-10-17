import React, { useState, useEffect } from 'react'
import { useStore } from '@livestore/react'
import { formatDate } from '../../../util/dates.js'
import type { Project, Worker } from '@work-squared/shared/schema'
import { getProjectWorkers$, getWorkers$ } from '@work-squared/shared/queries'
import { getAvatarColor } from '../../../utils/avatarColors.js'
import { ProjectCategoryBadge } from '../ProjectCategoryBadge.js'

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

// Helper to get full image URL from relative path
const getFullImageUrl = (url: string): string => {
  if (!url) return ''
  // If already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // Otherwise, prepend the worker URL
  const syncUrl = import.meta.env.VITE_LIVESTORE_SYNC_URL || 'http://localhost:8787'
  const httpUrl = syncUrl.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:')
  return `${httpUrl}${url}`
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const { store } = useStore()
  const [assignedWorkers, setAssignedWorkers] = useState<Worker[]>([])

  useEffect(() => {
    const loadAssignedWorkers = async () => {
      try {
        const [projectWorkers, allWorkers] = await Promise.all([
          store.query(getProjectWorkers$(project.id)),
          store.query(getWorkers$),
        ])

        const assignedWorkerIds = new Set(projectWorkers.map(pw => pw.workerId))
        const assigned = allWorkers.filter(worker => assignedWorkerIds.has(worker.id))
        setAssignedWorkers(assigned)
      } catch (error) {
        console.error('Error loading assigned workers:', error)
      }
    }

    loadAssignedWorkers()
  }, [project.id, store])

  const coverImageUrl = (project.attributes as any)?.coverImage
  const fullImageUrl = coverImageUrl ? getFullImageUrl(coverImageUrl) : null

  return (
    <div
      className='bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 overflow-hidden'
      onClick={onClick}
    >
      {fullImageUrl && (
        <div className='w-full h-48 overflow-hidden'>
          <img
            src={fullImageUrl}
            alt={`${project.name} cover`}
            className='w-full h-full object-cover'
          />
        </div>
      )}
      <div className='p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>{project.name}</h3>
      {project.category && (
        <div className='mb-2'>
          <ProjectCategoryBadge category={project.category as any} size='sm' />
        </div>
      )}
      {project.description && (
        <p className='text-sm text-gray-600 mb-3 line-clamp-2'>{project.description}</p>
      )}

      {assignedWorkers.length > 0 && (
        <div className='mb-3'>
          <div className='text-xs text-gray-500 mb-1'>Assigned Team:</div>
          <div className='flex flex-wrap gap-1'>
            {assignedWorkers.slice(0, 3).map(worker => (
              <span
                key={worker.id}
                className={`inline-flex items-center px-2 py-1 text-xs ${getAvatarColor(worker.id)} text-white rounded-full`}
              >
                {worker.avatar && <span className='mr-1'>{worker.avatar}</span>}
                {worker.name}
              </span>
            ))}
            {assignedWorkers.length > 3 && (
              <span className='inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full'>
                +{assignedWorkers.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

        <div className='text-sm text-gray-500'>
          <p>Created: {formatDate(project.createdAt)}</p>
          <p>Updated: {formatDate(project.updatedAt)}</p>
          <p>Team: {assignedWorkers.length > 0 ? assignedWorkers.length : 'None assigned'}</p>
        </div>
      </div>
    </div>
  )
}
