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
import { ROUTES } from '../../../constants/routes.js'
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
  const assigneeNames = useMemo(() => {
    const assignees = parseAssigneeIds(task.assigneeIds)
      .map(id => usersById.get(id))
      .filter((user): user is User => Boolean(user))
    return assignees.map(user => user.name || user.email || user.id).join(', ')
  }, [task.assigneeIds, usersById])
  const hasDescription = Boolean(task.description && task.description.trim().length > 0)
  const hasComments = comments.length > 0

  return (
    <li className='new-ui-list-item'>
      <div>
        <strong className='font-semibold'>{task.title || 'Untitled task'}</strong>
        <span> [{task.status}]</span>
      </div>
      <div>
        <span>Assignees: {assigneeNames || 'Unassigned'}</span>
        {hasDescription && <span> 📝</span>}
        {hasComments && <span> 💬</span>}
      </div>
    </li>
  )
}

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const resolvedProjectId = projectId ?? '__invalid__'
  const projectRows = useQuery(getProjectById$(resolvedProjectId))
  const project = (projectRows?.[0] ?? undefined) as Project | undefined
  const tasks = useQuery(getProjectTasks$(resolvedProjectId)) ?? []
  const users = useQuery(getUsers$) ?? []
  const usersById = useMemo(() => new Map(users.map(user => [user.id, user])), [users])

  if (!projectId) {
    return (
      <div className='space-y-4'>
        <Link to={preserveStoreIdInUrl(ROUTES.NEW_PROJECTS)}>← Back to projects</Link>
        <p>Invalid project ID</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className='space-y-4'>
        <Link to={preserveStoreIdInUrl(ROUTES.NEW_PROJECTS)}>← Back to projects</Link>
        <div>
          <h1 className='new-ui-heading'>Project not found</h1>
          <p>The requested project ({projectId}) does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <Link to={preserveStoreIdInUrl(ROUTES.NEW_PROJECTS)}>← Back to projects</Link>

      <header className='space-y-2'>
        <h1 className='new-ui-heading-lg'>{project.name || 'Untitled project'}</h1>
        {project.description && <p>{project.description}</p>}
      </header>

      <section className='space-y-3'>
        <h2 className='new-ui-subheading'>Tasks</h2>
        {tasks.length === 0 ? (
          <p>No tasks in this project</p>
        ) : (
          <ul className='new-ui-list'>
            {tasks.map(task => (
              <TaskListItem key={task.id} task={task} usersById={usersById} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
