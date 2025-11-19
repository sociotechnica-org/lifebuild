import React, { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import {
  getProjectsByCategory$,
  getAllTasksByCategoryId$,
  getAllWorkerProjects$,
} from '@work-squared/shared/queries'
import { ProjectCard } from '../projects/ProjectCard.js'
import { PROJECT_CATEGORIES } from '@work-squared/shared'
import { ROUTES } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'
import { useAuth } from '../../../contexts/AuthContext.js'

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
  const category = PROJECT_CATEGORIES.find(c => c.value === categoryId)
  if (!categoryId || !category) {
    return (
      <div>
        <Link to={preserveStoreIdInUrl(ROUTES.NEW)}>← Back to life map</Link>
        <h1>Category not found</h1>
        <p>The category you're looking for doesn't exist.</p>
      </div>
    )
  }

  // Get projects for this category, filtered by status (filtering happens at database level)
  const activeProjects = useQuery(getProjectsByCategory$(categoryId, 'active')) ?? []
  const planningProjects = useQuery(getProjectsByCategory$(categoryId, 'planning')) ?? []

  // Combine all projects for statistics and task filtering
  const allCategoryProjects = useMemo(
    () => [...activeProjects, ...planningProjects],
    [activeProjects, planningProjects]
  )
  const categoryProjectIds = allCategoryProjects.map(p => p.id)

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
          {category.icon && <span>{category.icon}</span>} {category.name}
        </h1>
      </header>

      <section>
        <h2 className='text-lg font-semibold mt-4'>Statistics</h2>
        <ul>
          <li>
            <strong>Active Projects:</strong> {activeProjects.length}
          </li>
          <li>
            <strong>Planning Projects:</strong> {planningProjects.length}
          </li>
          <li>
            <strong>Total Projects:</strong> {allCategoryProjects.length}
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
              const project = allCategoryProjects.find(p => p.id === task.projectId)
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

      {activeProjects.length > 0 && (
        <section>
          <h2 className='text-lg font-semibold mt-4'>Active Projects</h2>
          <div>
            {activeProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {planningProjects.length > 0 && (
        <section>
          <h2 className='text-lg font-semibold mt-4'>Planning Projects</h2>
          <div>
            {planningProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {activeProjects.length === 0 && planningProjects.length === 0 && (
        <section>
          <h2 className='text-lg font-semibold mt-4'>Projects</h2>
          <p>No projects in this category yet.</p>
        </section>
      )}
    </div>
  )
}
