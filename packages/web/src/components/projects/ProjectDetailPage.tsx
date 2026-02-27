import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '../../livestore-compat.js'
import { getProjectById$, getProjectTasks$ } from '@lifebuild/shared/queries'
import type { Project, Task } from '@lifebuild/shared/schema'
import { type PlanningAttributes, resolveLifecycleState } from '@lifebuild/shared'
import { createProjectRoomDefinition } from '@lifebuild/shared/rooms'
import { useProjectChatLifecycle } from '../../hooks/useProjectChatLifecycle.js'
import { ProjectHeader } from '../project-room/ProjectHeader.js'
import { TaskList } from '../project-room/TaskList.js'
import { TaskDetailModal } from '../project-room/TaskDetailModal.js'
import { usePostHog } from '../../lib/analytics.js'

type ProjectDetailPageProps = {
  onCloseOverlay?: () => void
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ onCloseOverlay }) => {
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
    return <p className='p-6 text-[#7f6952]'>Invalid project ID</p>
  }

  if (!projectQueryReady) {
    return <p className='p-6 text-[#7f6952]'>Loading project...</p>
  }

  if (!project) {
    return (
      <div className='p-6'>
        <h1 className='text-xl font-semibold text-[#2f2b27]'>Project not found</h1>
        <p className='mt-2 text-[#7f6952]'>The requested project ({projectId}) does not exist.</p>
      </div>
    )
  }

  if (!room) {
    return <p className='p-6 text-[#7f6952]'>Preparing project room...</p>
  }

  return (
    <div className='flex h-full flex-col overflow-hidden rounded-2xl border border-[#e5e2dc] bg-[#f5f3f0]'>
      <ProjectHeader project={project} onClose={onCloseOverlay} />

      <div className='min-h-0 flex-1'>
        <TaskList tasks={tasks} projectId={resolvedProjectId} onTaskClick={handleTaskClick} />
      </div>

      <TaskDetailModal task={selectedTask ?? null} allTasks={tasks} onClose={handleModalClose} />
    </div>
  )
}
