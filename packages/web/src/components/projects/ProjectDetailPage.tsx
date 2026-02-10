import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '../../livestore-compat.js'
import { getProjectById$, getProjectTasks$ } from '@lifebuild/shared/queries'
import type { Project, Task } from '@lifebuild/shared/schema'
import { type PlanningAttributes, resolveLifecycleState } from '@lifebuild/shared'
import { RoomLayout } from '../layout/RoomLayout.js'
import { createProjectRoomDefinition } from '@lifebuild/shared/rooms'
import { NewUiShell } from '../layout/NewUiShell.js'
import { useProjectChatLifecycle } from '../../hooks/useProjectChatLifecycle.js'
import { ProjectHeader } from '../project-room/ProjectHeader.js'
import { ProjectKanban } from '../project-room/ProjectKanban.js'
import { TaskDetailModal } from '../project-room/TaskDetailModal.js'
import { usePostHog } from '../../lib/analytics.js'

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const resolvedProjectId = projectId ?? '__invalid__'

  // Query project and tasks
  const projectResult = useQuery(getProjectById$(resolvedProjectId))
  const projectRows = projectResult ?? []
  const projectQueryReady = projectResult !== undefined
  const tasks = useQuery(getProjectTasks$(resolvedProjectId)) ?? []
  const project = (projectRows[0] ?? undefined) as Project | undefined

  const posthog = usePostHog()

  // Track project viewed
  useEffect(() => {
    if (project) {
      posthog?.capture('project_viewed', { projectId: resolvedProjectId })
    }
  }, [project?.id])

  // Task modal state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Find selected task from the already-fetched tasks list
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null
    return (tasks as Task[]).find(t => t.id === selectedTaskId) ?? null
  }, [selectedTaskId, tasks])

  // Parse project attributes (for room definition)
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

  // Get lifecycle state for room definition
  const lifecycleState = useMemo(() => {
    if (!project) return null
    return resolveLifecycleState(project.projectLifecycleState, attributes)
  }, [project, attributes])

  // Create room definition for chat
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

  // Handle task click - open modal
  const handleTaskClick = (taskId: string) => {
    posthog?.capture('task_detail_opened', { taskId, projectId: resolvedProjectId })
    setSelectedTaskId(taskId)
  }

  // Handle modal close
  const handleModalClose = () => {
    setSelectedTaskId(null)
  }

  // Loading and error states
  if (!projectId) {
    return (
      <NewUiShell>
        <p className='p-6 text-gray-500'>Invalid project ID</p>
      </NewUiShell>
    )
  }

  if (!projectQueryReady) {
    return (
      <NewUiShell>
        <p className='p-6 text-gray-500'>Loading project...</p>
      </NewUiShell>
    )
  }

  if (!project) {
    return (
      <NewUiShell>
        <div className='p-6'>
          <h1 className='text-xl font-semibold text-gray-900'>Project not found</h1>
          <p className='text-gray-500 mt-2'>The requested project ({projectId}) does not exist.</p>
        </div>
      </NewUiShell>
    )
  }

  if (!room) {
    return (
      <NewUiShell>
        <p className='p-6 text-gray-500'>Preparing project room...</p>
      </NewUiShell>
    )
  }

  return (
    <RoomLayout room={room} noScroll>
      <div className='h-full flex flex-col bg-[#f5f3f0] rounded-2xl border border-[#e5e2dc] overflow-hidden'>
        {/* Project Header */}
        <ProjectHeader project={project} />

        {/* Kanban Board - fills remaining space */}
        <div className='flex-1 min-h-0'>
          <ProjectKanban
            tasks={tasks}
            projectId={resolvedProjectId}
            onTaskClick={handleTaskClick}
          />
        </div>

        {/* Task Detail Modal */}
        <TaskDetailModal task={selectedTask ?? null} allTasks={tasks} onClose={handleModalClose} />
      </div>
    </RoomLayout>
  )
}
