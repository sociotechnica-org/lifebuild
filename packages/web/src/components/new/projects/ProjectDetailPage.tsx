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
  type ProjectCategory,
  type ProjectLifecycleState,
  PROJECT_CATEGORIES,
  getCategoryInfo,
  resolveLifecycleState,
} from '@work-squared/shared'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'
import { RoomLayout } from '../layout/RoomLayout.js'
import { createProjectRoomDefinition } from '@work-squared/shared/rooms'
import { NewUiShell } from '../layout/NewUiShell.js'
import { useProjectChatLifecycle } from '../../../hooks/useProjectChatLifecycle.js'

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
  const projectResult = useQuery(getProjectById$(resolvedProjectId))
  const projectRows = projectResult ?? []
  const projectQueryReady = projectResult !== undefined
  const tasks = useQuery(getProjectTasks$(resolvedProjectId)) ?? []
  const users = useQuery(getUsers$) ?? []
  const usersById = useMemo(() => new Map(users.map(user => [user.id, user])), [users])
  const project = (projectRows[0] ?? undefined) as Project | undefined

  // Parse project attributes (for legacy support and room definition)
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

  // Get lifecycle state (source of truth for display)
  const lifecycleState = useMemo<ProjectLifecycleState | null>(() => {
    if (!project) return null
    return resolveLifecycleState(project.projectLifecycleState, attributes)
  }, [project, attributes])

  const projectCategory = useMemo<ProjectCategory | null>(() => {
    const category = project?.category
    if (!category) return null
    return PROJECT_CATEGORIES.some(({ value }) => value === category)
      ? (category as ProjectCategory)
      : null
  }, [project?.category])

  // Determine back link and label based on project category
  const backLink = useMemo(() => {
    if (projectCategory) {
      return preserveStoreIdInUrl(generateRoute.category(projectCategory))
    }
    return preserveStoreIdInUrl('/')
  }, [projectCategory])

  const backLabel = useMemo(() => {
    if (projectCategory) {
      const categoryInfo = getCategoryInfo(projectCategory)
      return categoryInfo ? `← Back to ${categoryInfo.name}` : `← Back to ${projectCategory}`
    }
    return '← Back to Life Map'
  }, [projectCategory])

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

  const room = useMemo(
    () =>
      project
        ? createProjectRoomDefinition({
            projectId: resolvedProjectId,
            name: project.name,
            description: project.description,
            objectives: lifecycleState?.objectives,
            archivedAt: project.archivedAt ? project.archivedAt.getTime() : null,
            deletedAt: project.deletedAt ? project.deletedAt.getTime() : null,
            attributes,
          })
        : null,
    [attributes, lifecycleState?.objectives, project, resolvedProjectId]
  )

  useProjectChatLifecycle(project ?? null, room)

  if (!projectId) {
    return (
      <NewUiShell>
        <p>Invalid project ID</p>
      </NewUiShell>
    )
  }

  if (!projectQueryReady) {
    return (
      <NewUiShell>
        <p>Loading project...</p>
      </NewUiShell>
    )
  }

  if (!project) {
    return (
      <NewUiShell>
        <div>
          <h1>Project not found</h1>
          <p>The requested project ({projectId}) does not exist.</p>
        </div>
      </NewUiShell>
    )
  }

  if (!room) {
    return (
      <NewUiShell>
        <p>Preparing project room...</p>
      </NewUiShell>
    )
  }

  return (
    <RoomLayout room={room}>
      <div>
        <Link to={backLink}>{backLabel}</Link>

        <div>
          <header>
            <h1 className='text-2xl font-bold'>{project.name || 'Untitled project'}</h1>
            {project.description && <p>{project.description}</p>}
          </header>

          {lifecycleState && (
            <section className='mt-6'>
              <h2 className='text-lg font-semibold mb-4'>Project Details</h2>
              <dl className='space-y-2'>
                {lifecycleState.status && (
                  <div>
                    <dt className='font-medium inline'>Status:</dt>
                    <dd className='inline ml-2 capitalize'>{lifecycleState.status}</dd>
                  </div>
                )}
                {lifecycleState.stage && (
                  <div>
                    <dt className='font-medium inline'>Planning Stage:</dt>
                    <dd className='inline ml-2'>
                      {STAGE_LABELS[lifecycleState.stage]} (Stage {lifecycleState.stage})
                    </dd>
                  </div>
                )}
                {lifecycleState.archetype && (
                  <div>
                    <dt className='font-medium inline'>Archetype:</dt>
                    <dd className='inline ml-2'>{ARCHETYPE_LABELS[lifecycleState.archetype]}</dd>
                  </div>
                )}
                {lifecycleState.objectives && (
                  <div>
                    <dt className='font-medium block mb-1'>Objectives:</dt>
                    <dd className='ml-4'>{lifecycleState.objectives}</dd>
                  </div>
                )}
                {lifecycleState.deadline && (
                  <div>
                    <dt className='font-medium inline'>Deadline:</dt>
                    <dd className='inline ml-2'>{formatDate(lifecycleState.deadline)}</dd>
                  </div>
                )}
                {lifecycleState.estimatedDuration && (
                  <div>
                    <dt className='font-medium inline'>Estimated Duration:</dt>
                    <dd className='inline ml-2'>
                      {formatDuration(lifecycleState.estimatedDuration)}
                    </dd>
                  </div>
                )}
                {lifecycleState.urgency && (
                  <div>
                    <dt className='font-medium inline'>Urgency:</dt>
                    <dd className='inline ml-2 capitalize'>{lifecycleState.urgency}</dd>
                  </div>
                )}
                {lifecycleState.importance && (
                  <div>
                    <dt className='font-medium inline'>Importance:</dt>
                    <dd className='inline ml-2 capitalize'>{lifecycleState.importance}</dd>
                  </div>
                )}
                {lifecycleState.complexity && (
                  <div>
                    <dt className='font-medium inline'>Complexity:</dt>
                    <dd className='inline ml-2 capitalize'>{lifecycleState.complexity}</dd>
                  </div>
                )}
                {lifecycleState.scale && (
                  <div>
                    <dt className='font-medium inline'>Scale:</dt>
                    <dd className='inline ml-2 capitalize'>{lifecycleState.scale}</dd>
                  </div>
                )}
                {lifecycleState.priority !== undefined && (
                  <div>
                    <dt className='font-medium inline'>Priority:</dt>
                    <dd className='inline ml-2'>{lifecycleState.priority}</dd>
                  </div>
                )}
                {lifecycleState.activatedAt && (
                  <div>
                    <dt className='font-medium inline'>Activated At:</dt>
                    <dd className='inline ml-2'>{formatDate(lifecycleState.activatedAt)}</dd>
                  </div>
                )}
                {lifecycleState.completedAt && (
                  <div>
                    <dt className='font-medium inline'>Completed At:</dt>
                    <dd className='inline ml-2'>{formatDate(lifecycleState.completedAt)}</dd>
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
      </div>
    </RoomLayout>
  )
}
