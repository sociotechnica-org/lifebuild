import React, { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import {
  getProjectsByCategory$,
  getAllTasksByCategoryId$,
  getAllWorkerProjects$,
} from '@work-squared/shared/queries'
import { getCategoryInfo } from '@work-squared/shared'
import type { ProjectCategory } from '@work-squared/shared'
import { ROUTES } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'
import { useAuth } from '../../../contexts/AuthContext.js'

const LIFE_CATEGORIES = {
  health: { name: 'Health' },
  relationships: { name: 'Relationships' },
  finances: { name: 'Finances' },
  growth: { name: 'Learning' },
  leisure: { name: 'Leisure' },
  spirituality: { name: 'Purpose' },
  home: { name: 'Home' },
  contribution: { name: 'Service' },
} as const

const parseAssigneeIds = (raw: string | null | undefined): string[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export const LifeCategory: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const { user: authUser } = useAuth()
  const allWorkerProjects = useQuery(getAllWorkerProjects$) ?? []

  // Validate categoryId
  if (!categoryId || !(categoryId in LIFE_CATEGORIES)) {
    return (
      <div>
        <Link to={preserveStoreIdInUrl(ROUTES.NEW)}>← Back to life map</Link>
        <h1>Category not found</h1>
        <p>The category you're looking for doesn't exist.</p>
      </div>
    )
  }

  const category = LIFE_CATEGORIES[categoryId as keyof typeof LIFE_CATEGORIES]
  const categoryInfo = getCategoryInfo(categoryId as ProjectCategory)

  // Get projects for this category
  const categoryProjects = useQuery(getProjectsByCategory$(categoryId)) ?? []
  const categoryProjectIds = categoryProjects.map(p => p.id)

  // Get tasks for this category, optionally filtered by assigneeId
  const currentUserId = authUser?.id
  const allTasksForCategory = useQuery(getAllTasksByCategoryId$(categoryId, currentUserId)) ?? []

  // Filter tasks by category project IDs and optionally by assigneeId
  const filteredTasks = useMemo(() => {
    return allTasksForCategory.filter(task => {
      // Filter by project ID (must be in category)
      if (!categoryProjectIds.includes(task.projectId || '')) {
        return false
      }
      // If assigneeId was provided, filter by assignee
      if (currentUserId) {
        const assigneeIds = parseAssigneeIds(task.assigneeIds)
        return assigneeIds.includes(currentUserId)
      }
      return true
    })
  }, [allTasksForCategory, categoryProjectIds, currentUserId])

  // User tasks are the filtered tasks when assigneeId is provided
  const userTasks = currentUserId ? filteredTasks : []

  // Get unique workers assigned to projects in this category
  const categoryWorkers = useMemo(() => {
    const workerIds = new Set<string>()
    categoryProjectIds.forEach(projectId => {
      const projectWorkers = allWorkerProjects.filter(wp => wp.projectId === projectId)
      projectWorkers.forEach(wp => workerIds.add(wp.workerId))
    })
    return workerIds.size
  }, [categoryProjectIds, allWorkerProjects])

  return (
    <div>
      <Link to={preserveStoreIdInUrl(ROUTES.NEW)}>← Back to life map</Link>

      <header>
        <h1 className='text-2xl font-bold'>
          {categoryInfo?.icon && <span>{categoryInfo.icon}</span>} {category.name}
        </h1>
      </header>

      <section>
        <h2 className='text-lg font-semibold mt-4'>Statistics</h2>
        <ul>
          <li>
            <strong>Projects:</strong> {categoryProjects.length}
          </li>
          <li>
            <strong>Workers:</strong> {categoryWorkers}
          </li>
          {currentUserId && (
            <li>
              <strong>My Tasks:</strong> {userTasks.length}
            </li>
          )}
        </ul>
      </section>

      {currentUserId && userTasks.length > 0 && (
        <section>
          <h2 className='text-lg font-semibold mt-4'>My Tasks</h2>
          <ul>
            {userTasks.map(task => {
              const project = categoryProjects.find(p => p.id === task.projectId)
              return (
                <li key={task.id}>
                  <div>
                    <strong>{task.title || 'Untitled task'}</strong>
                    {project && (
                      <span>
                        {' '}
                        in{' '}
                        <Link to={preserveStoreIdInUrl(`/new/projects/${project.id}`)}>
                          {project.name}
                        </Link>
                      </span>
                    )}
                  </div>
                  <div>
                    <span>Status: {task.status}</span>
                  </div>
                  {task.description && (
                    <div>
                      <small>{task.description}</small>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className='text-lg font-semibold mt-4'>Projects</h2>
        {categoryProjects.length === 0 ? (
          <p>No projects in this category yet.</p>
        ) : (
          <ul>
            {categoryProjects.map(project => (
              <li key={project.id}>
                <Link to={preserveStoreIdInUrl(`/new/projects/${project.id}`)}>
                  {project.name || 'Untitled project'}
                </Link>
                {project.description && <p>{project.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
