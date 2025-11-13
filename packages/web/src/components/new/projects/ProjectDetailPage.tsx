import React, { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import {
  getProjectById$,
  getProjectTasks$,
  getUsers$,
  getTaskComments$,
} from '@work-squared/shared/queries'
import type { Project, Task, User } from '@work-squared/shared/schema'
import {
  ARCHETYPE_LABELS,
  STAGE_LABELS,
  type PlanningAttributes,
  getCategoryInfo,
} from '@work-squared/shared'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'

const parseAssigneeIds = (raw: string | null | undefined): string[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

type UsersById = Map<string, User>

const TaskListItem: React.FC<{ task: Task; usersById: UsersById }> = ({ task, usersById }) => {
  const comments = useQuery(getTaskComments$(task.id)) ?? []
  const assigneeIds = parseAssigneeIds(task.assigneeIds)
  const assignees = assigneeIds
    .map(id => usersById.get(id))
    .filter((user): user is User => Boolean(user))
  const assigneeNames = assignees.map(user => user.name || user.email || user.id)
  const hasDescription = Boolean(task.description && task.description.trim().length > 0)
  const hasComments = comments.length > 0

  return (
    <li className='mb-2'>
      <div>
        <strong className='font-semibold'>{task.title || 'Untitled task'}</strong>
        <span> [{task.status}]</span>
      </div>
      <div>
        <span>Assignees: {assigneeNames.length > 0 ? assigneeNames.join(', ') : 'Unassigned'}</span>
        {hasDescription && <span> 📝</span>}
        {hasComments && <span> 💬 ({comments.length})</span>}
      </div>
      {task.description && (
        <div>
          <small>{task.description}</small>
        </div>
      )}
    </li>
  )
}

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const resolvedProjectId = projectId ?? '__invalid__'
  const projectRows = useQuery(getProjectById$(resolvedProjectId)) ?? []
  const tasks = useQuery(getProjectTasks$(resolvedProjectId)) ?? []
  const users = useQuery(getUsers$) ?? []
  const usersById = useMemo(() => new Map(users.map(user => [user.id, user])), [users])
  const project = (projectRows[0] ?? undefined) as Project | undefined

  // Parse project attributes
  const attributes = useMemo(() => {
    if (!project?.attributes) return null
    try {
      const parsed =
        typeof project.attributes === 'string'
          ? JSON.parse(project.attributes)
          : (project.attributes as PlanningAttributes)
      return parsed as PlanningAttributes
    } catch {
      return null
    }
  }, [project?.attributes])

  // Determine back link and label based on project category
  const backLink = useMemo(() => {
    if (project?.category) {
      return preserveStoreIdInUrl(generateRoute.newCategory(project.category))
    }
    return preserveStoreIdInUrl('/new')
  }, [project?.category])

  const backLabel = useMemo(() => {
    if (project?.category) {
      const categoryInfo = getCategoryInfo(project.category)
      return categoryInfo ? `← Back to ${categoryInfo.name}` : `← Back to ${project.category}`
    }
    return '← Back to Life Map'
  }, [project?.category])

  // Format date helper
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null
    return new Date(timestamp).toLocaleDateString()
  }

  // Format duration helper
  const formatDuration = (hours?: number) => {
    if (!hours) return null
    if (hours < 1) return `${Math.round(hours * 60)} minutes`
    if (hours < 24) return `${hours.toFixed(1)} hours`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (remainingHours === 0) return `${days} day${days !== 1 ? 's' : ''}`
    return `${days} day${days !== 1 ? 's' : ''}, ${remainingHours.toFixed(1)} hours`
  }

  return (
    <div>
      <Link to={backLink}>{backLabel}</Link>

      {!projectId ? (
        <p>Invalid project ID</p>
      ) : !project ? (
        <div>
          <h1>Project not found</h1>
          <p>The requested project ({projectId}) does not exist.</p>
        </div>
      ) : (
        <div>
          <header>
            <h1 className='text-2xl font-bold'>{project.name || 'Untitled project'}</h1>
            {project.description && <p>{project.description}</p>}
          </header>

          {attributes && (
            <section className='mt-6'>
              <h2 className='text-lg font-semibold mb-4'>Project Attributes</h2>
              <dl className='space-y-2'>
                {attributes.status && (
                  <div>
                    <dt className='font-medium inline'>Status:</dt>
                    <dd className='inline ml-2 capitalize'>{attributes.status}</dd>
                  </div>
                )}
                {attributes.planningStage && (
                  <div>
                    <dt className='font-medium inline'>Planning Stage:</dt>
                    <dd className='inline ml-2'>
                      {STAGE_LABELS[attributes.planningStage]} (Stage {attributes.planningStage})
                    </dd>
                  </div>
                )}
                {attributes.archetype && (
                  <div>
                    <dt className='font-medium inline'>Archetype:</dt>
                    <dd className='inline ml-2'>{ARCHETYPE_LABELS[attributes.archetype]}</dd>
                  </div>
                )}
                {attributes.objectives && (
                  <div>
                    <dt className='font-medium block mb-1'>Objectives:</dt>
                    <dd className='ml-4'>{attributes.objectives}</dd>
                  </div>
                )}
                {attributes.deadline && (
                  <div>
                    <dt className='font-medium inline'>Deadline:</dt>
                    <dd className='inline ml-2'>{formatDate(attributes.deadline)}</dd>
                  </div>
                )}
                {attributes.estimatedDuration && (
                  <div>
                    <dt className='font-medium inline'>Estimated Duration:</dt>
                    <dd className='inline ml-2'>{formatDuration(attributes.estimatedDuration)}</dd>
                  </div>
                )}
                {attributes.urgency && (
                  <div>
                    <dt className='font-medium inline'>Urgency:</dt>
                    <dd className='inline ml-2 capitalize'>{attributes.urgency}</dd>
                  </div>
                )}
                {attributes.importance && (
                  <div>
                    <dt className='font-medium inline'>Importance:</dt>
                    <dd className='inline ml-2 capitalize'>{attributes.importance}</dd>
                  </div>
                )}
                {attributes.complexity && (
                  <div>
                    <dt className='font-medium inline'>Complexity:</dt>
                    <dd className='inline ml-2 capitalize'>{attributes.complexity}</dd>
                  </div>
                )}
                {attributes.scale && (
                  <div>
                    <dt className='font-medium inline'>Scale:</dt>
                    <dd className='inline ml-2 capitalize'>{attributes.scale}</dd>
                  </div>
                )}
                {attributes.priority !== undefined && (
                  <div>
                    <dt className='font-medium inline'>Priority:</dt>
                    <dd className='inline ml-2'>{attributes.priority}</dd>
                  </div>
                )}
                {attributes.activatedAt && (
                  <div>
                    <dt className='font-medium inline'>Activated At:</dt>
                    <dd className='inline ml-2'>{formatDate(attributes.activatedAt)}</dd>
                  </div>
                )}
                {attributes.lastActivityAt && (
                  <div>
                    <dt className='font-medium inline'>Last Activity:</dt>
                    <dd className='inline ml-2'>{formatDate(attributes.lastActivityAt)}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          <section className='mt-6'>
            <h2 className='text-lg font-semibold mb-4'>Tasks</h2>
            {tasks.length === 0 ? (
              <p>No tasks in this project</p>
            ) : (
              <ul>
                {tasks.map(task => (
                  <TaskListItem key={task.id} task={task} usersById={usersById} />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
