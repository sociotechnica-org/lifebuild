import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useStore } from '../../livestore-compat.js'
import type { Project } from '@lifebuild/shared/schema'
import { events } from '@lifebuild/shared/schema'
import { getAllTasks$ } from '@lifebuild/shared/queries'
import {
  resolveLifecycleState,
  describeProjectLifecycleState,
  type ProjectLifecycleState,
  type PlanningAttributes,
} from '@lifebuild/shared'
import { generateRoute } from '../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'
import { useAuth } from '../../contexts/AuthContext.js'
import { usePostHog } from '../../lib/analytics.js'

interface ProjectHeaderProps {
  project: Project
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const navigate = useNavigate()
  const { store } = useStore()
  const { user } = useAuth()
  const actorId = user?.id
  const posthog = usePostHog()
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [showUncompleteConfirm, setShowUncompleteConfirm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  const allTasks = useQuery(getAllTasks$) ?? []

  // Parse project attributes for legacy lifecycle data
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

  // Get lifecycle state, passing legacy attributes as fallback
  const lifecycleState: ProjectLifecycleState = resolveLifecycleState(
    project.projectLifecycleState,
    attributes
  )

  // Check if all tasks are done (vacuously true for projects with no tasks)
  const allTasksDone = useMemo(() => {
    const projectTasks = allTasks.filter(
      task => task.projectId === project.id && task.archivedAt === null
    )
    return projectTasks.every(task => task.status === 'done')
  }, [allTasks, project.id])

  // Get lifecycle description
  const lifecycleDescription = describeProjectLifecycleState(lifecycleState)

  const draftingStageUrl = useMemo(() => {
    if (lifecycleState.status !== 'planning') return null
    if (lifecycleState.stage === 1)
      return preserveStoreIdInUrl(generateRoute.projectStage1(project.id))
    if (lifecycleState.stage === 2)
      return preserveStoreIdInUrl(generateRoute.projectStage2(project.id))
    if (lifecycleState.stage === 3)
      return preserveStoreIdInUrl(generateRoute.projectStage3(project.id))
    return null
  }, [lifecycleState.stage, lifecycleState.status, project.id])

  const handleClose = () => {
    // Use browser history if available, otherwise navigate to Life Map
    // This handles deep-linking scenarios where there's no history to go back to
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(preserveStoreIdInUrl(generateRoute.lifeMap()))
    }
  }

  const handleCompleteProject = () => {
    // Update lifecycle to completed
    store.commit(
      events.projectLifecycleUpdated({
        projectId: project.id,
        lifecycleState: {
          ...lifecycleState,
          status: 'completed',
          completedAt: Date.now(),
        },
        updatedAt: new Date(),
        actorId,
      })
    )
    posthog?.capture('project_completed', { projectId: project.id })

    setShowCompleteConfirm(false)
    navigate(preserveStoreIdInUrl(generateRoute.lifeMap()))
  }

  const handleUncompleteProject = () => {
    // Update lifecycle back to active
    store.commit(
      events.projectLifecycleUpdated({
        projectId: project.id,
        lifecycleState: {
          ...lifecycleState,
          status: 'active',
          completedAt: undefined,
        },
        updatedAt: new Date(),
        actorId,
      })
    )
    setShowUncompleteConfirm(false)
  }

  const handleArchiveProject = () => {
    // Archive the project before navigation to ensure consistent state
    store.commit(
      events.projectArchived({
        id: project.id,
        archivedAt: new Date(),
        actorId,
      })
    )
    posthog?.capture('project_archived', { projectId: project.id })

    setShowArchiveConfirm(false)
    navigate(preserveStoreIdInUrl(generateRoute.lifeMap()))
  }

  return (
    <div className='bg-white border-b border-[#e5e2dc] px-6 py-4 rounded-t-2xl'>
      <div className='flex items-start justify-between'>
        <div className='flex-1 min-w-0'>
          {/* Project name */}
          <h1 className='text-2xl font-bold text-gray-900 truncate'>{project.name}</h1>

          {/* Status badges */}
          <div className='flex items-center gap-2 mt-2'>
            {/* Lifecycle status badge */}
            {draftingStageUrl ? (
              <button
                type='button'
                onClick={() => navigate(draftingStageUrl)}
                className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer'
                aria-label={`Open Drafting Stage ${lifecycleState.stage}`}
              >
                {lifecycleDescription}
              </button>
            ) : (
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                {lifecycleDescription}
              </span>
            )}
          </div>

          {/* Objectives */}
          {lifecycleState.objectives && (
            <p className='mt-3 text-sm text-gray-600'>{lifecycleState.objectives}</p>
          )}
        </div>

        {/* Actions */}
        <div className='flex items-center gap-2 flex-shrink-0'>
          {/* Mark as Completed button - only show when all tasks are done */}
          {allTasksDone && lifecycleState.status !== 'completed' && (
            <button
              onClick={() => setShowCompleteConfirm(true)}
              className='px-3 py-1.5 text-sm font-medium text-white bg-[#2f2b27] hover:bg-black rounded-md transition-colors'
            >
              Mark as Completed
            </button>
          )}

          {/* Mark as not completed button - only show when project is completed */}
          {lifecycleState.status === 'completed' && (
            <button
              onClick={() => setShowUncompleteConfirm(true)}
              className='px-3 py-1.5 text-sm font-medium text-[#8b8680] bg-transparent border border-[#e8e4de] hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27] rounded-md transition-colors'
            >
              Mark as not completed
            </button>
          )}

          {/* Archive button - show for non-completed, non-archived projects */}
          {lifecycleState.status !== 'completed' && !project.archivedAt && (
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className='px-3 py-1.5 text-sm font-medium text-[#8b8680] bg-transparent border border-[#e8e4de] hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27] rounded-md transition-colors'
            >
              Archive
            </button>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors'
            aria-label='Close and go back'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Completion Confirmation Dialog */}
      {showCompleteConfirm && (
        <div
          className='fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]'
          onClick={() => setShowCompleteConfirm(false)}
        >
          <div
            className='bg-white rounded-xl p-6 max-w-[400px] w-[90%] shadow-[0_8px_32px_rgba(0,0,0,0.2)]'
            onClick={e => e.stopPropagation()}
          >
            <h3 className='m-0 mb-4 text-lg font-semibold text-[#2f2b27]'>Complete Project</h3>
            <p className='m-0 mb-6 text-sm text-[#2f2b27] leading-relaxed'>
              Are you sure you want to mark <strong>{project.name}</strong> as completed? This will
              move it to your completed projects.
            </p>
            <div className='flex gap-3 justify-end'>
              <button
                type='button'
                className='py-2 px-5 rounded-lg text-sm font-medium bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27]'
                onClick={() => setShowCompleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type='button'
                className='py-2 px-5 rounded-lg text-sm font-medium bg-[#2f2b27] text-white border-none cursor-pointer transition-all duration-150 hover:bg-black'
                onClick={handleCompleteProject}
              >
                Complete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uncomplete Confirmation Dialog */}
      {showUncompleteConfirm && (
        <div
          className='fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]'
          onClick={() => setShowUncompleteConfirm(false)}
        >
          <div
            className='bg-white rounded-xl p-6 max-w-[400px] w-[90%] shadow-[0_8px_32px_rgba(0,0,0,0.2)]'
            onClick={e => e.stopPropagation()}
          >
            <h3 className='m-0 mb-4 text-lg font-semibold text-[#2f2b27]'>
              Mark Project as Not Completed
            </h3>
            <p className='m-0 mb-6 text-sm text-[#2f2b27] leading-relaxed'>
              Are you sure you want to mark <strong>{project.name}</strong> as not completed? This
              will move it back to your active projects.
            </p>
            <div className='flex gap-3 justify-end'>
              <button
                type='button'
                className='py-2 px-5 rounded-lg text-sm font-medium bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27]'
                onClick={() => setShowUncompleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type='button'
                className='py-2 px-5 rounded-lg text-sm font-medium bg-[#2f2b27] text-white border-none cursor-pointer transition-all duration-150 hover:bg-black'
                onClick={handleUncompleteProject}
              >
                Mark as Not Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      {showArchiveConfirm && (
        <div
          className='fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]'
          onClick={() => setShowArchiveConfirm(false)}
        >
          <div
            className='bg-white rounded-xl p-6 max-w-[400px] w-[90%] shadow-[0_8px_32px_rgba(0,0,0,0.2)]'
            onClick={e => e.stopPropagation()}
          >
            <h3 className='m-0 mb-4 text-lg font-semibold text-[#2f2b27]'>Archive Project</h3>
            <p className='m-0 mb-6 text-sm text-[#2f2b27] leading-relaxed'>
              Are you sure you want to archive <strong>{project.name}</strong>? This will remove it
              from your active projects. You can unarchive it later from the Life Map.
            </p>
            <div className='flex gap-3 justify-end'>
              <button
                type='button'
                className='py-2 px-5 rounded-lg text-sm font-medium bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27]'
                onClick={() => setShowArchiveConfirm(false)}
              >
                Cancel
              </button>
              <button
                type='button'
                className='py-2 px-5 rounded-lg text-sm font-medium bg-[#2f2b27] text-white border-none cursor-pointer transition-all duration-150 hover:bg-black'
                onClick={handleArchiveProject}
              >
                Archive Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
