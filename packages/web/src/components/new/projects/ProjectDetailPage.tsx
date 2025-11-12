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
  const assigneeIds = parseAssigneeIds(task.assigneeIds)
  const assignees = assigneeIds
    .map(id => usersById.get(id))
    .filter((user): user is User => Boolean(user))
  const assigneeNames = assignees.map(user => user.name || user.email || user.id)
  const hasDescription = Boolean(task.description && task.description.trim().length > 0)
  const hasComments = comments.length > 0

  return (
    <li>
      <div>
        <strong>{task.title || 'Untitled task'}</strong>
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

  return (
    <div>
      <Link to={preserveStoreIdInUrl(ROUTES.NEW_PROJECTS)}>← Back to projects</Link>

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
            <h1>{project.name || 'Untitled project'}</h1>
            {project.description && <p>{project.description}</p>}
          </header>

          <section>
            <h2>Tasks</h2>
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
