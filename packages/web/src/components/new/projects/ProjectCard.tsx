import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import { getProjectTasks$, getProjectWorkers$ } from '@work-squared/shared/queries'
import type { Project as ProjectType } from '@work-squared/shared/schema'
import { ARCHETYPE_LABELS } from '@work-squared/shared'
import type { PlanningAttributes } from '@work-squared/shared'
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

interface ProjectCardProps {
  project: ProjectType
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { user: authUser } = useAuth()
  const tasks = useQuery(getProjectTasks$(project.id)) ?? []
  const workerProjects = useQuery(getProjectWorkers$(project.id)) ?? []

  // Parse project attributes
  const attributes = useMemo(() => {
    if (!project.attributes) return null
    try {
      const parsed =
        typeof project.attributes === 'string' ? JSON.parse(project.attributes) : project.attributes
      return parsed as PlanningAttributes
    } catch {
      return null
    }
  }, [project.attributes])

  // Get archetype label
  const archetypeLabel = attributes?.archetype ? ARCHETYPE_LABELS[attributes.archetype] : null

  // Calculate task stats
  const taskStats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter(task => task.status === 'done').length
    return { total, done }
  }, [tasks])

  // Count tasks assigned to current user
  const currentUserId = authUser?.id
  const userTaskCount = useMemo(() => {
    if (!currentUserId) return 0
    return tasks.filter(task => {
      const assigneeIds = parseAssigneeIds(task.assigneeIds)
      return assigneeIds.includes(currentUserId)
    }).length
  }, [tasks, currentUserId])

  // Count unique workers assigned to this project
  // workerProjects is an array of { workerId, projectId } rows from the workerProjects table
  const workerCount = useMemo(() => {
    const uniqueWorkerIds = new Set(workerProjects.map(wp => wp.workerId))
    return uniqueWorkerIds.size
  }, [workerProjects])

  return (
    <div className='mb-4'>
      <div className='mb-2'>
        <Link
          to={preserveStoreIdInUrl(`/new/projects/${project.id}`)}
          className='text-lg font-semibold'
        >
          {project.name || 'Untitled project'}
        </Link>
      </div>

      {archetypeLabel && (
        <div className='text-sm text-gray-600 mb-2'>
          <span className='font-medium'>Archetype:</span> {archetypeLabel}
        </div>
      )}

      <div className='text-sm text-gray-600 mb-2'>
        {taskStats.total === 0 ? (
          <span>No Tasks</span>
        ) : (
          <span>
            {taskStats.done} of {taskStats.total} tasks complete
          </span>
        )}
      </div>

      {userTaskCount > 0 && (
        <div className='text-sm text-gray-600 mb-2'>
          <span className='font-medium'>Your tasks:</span> {userTaskCount}
        </div>
      )}

      {workerCount > 0 && (
        <div className='text-sm text-gray-600'>
          <span className='font-medium'>Workers:</span> {workerCount}
        </div>
      )}
    </div>
  )
}
