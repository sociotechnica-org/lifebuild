import React, { useEffect, useMemo, useState } from 'react'
import { useQuery, useStore } from '../../livestore-compat.js'
import { Link, useNavigate } from 'react-router-dom'
import {
  getProjectsByCategory$,
  getAllWorkerProjects$,
  getActiveBronzeStack$,
  getTabledBronzeProjects$,
  getAllTasks$,
  getTableConfiguration$,
  getProjects$,
  getAllProjectsIncludingArchived$,
} from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import { PROJECT_CATEGORIES, resolveLifecycleState } from '@lifebuild/shared'
import { CategoryCard } from './CategoryCard.js'
import { generateRoute } from '../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'
import { useAuth } from '../../contexts/AuthContext.js'
import { usePostHog } from '../../lib/analytics.js'

/**
 * Life Map - The overview of all eight life categories
 * Displays categories in a responsive grid with project/worker stats.
 *
 * Grid layout (2x4 on desktop):
 * Row 1: Health, Relationships, Finances, Growth
 * Row 2: Leisure, Spirituality, Home, Contribution
 */
export const LifeMap: React.FC = () => {
  const navigate = useNavigate()
  const { store } = useStore()
  const { user } = useAuth()
  const posthog = usePostHog()
  const actorId = user?.id
  const [completedExpanded, setCompletedExpanded] = useState(false)
  const [archivedExpanded, setArchivedExpanded] = useState(false)

  useEffect(() => {
    posthog?.capture('life_map_viewed')
  }, [])

  const allWorkerProjects = useQuery(getAllWorkerProjects$) ?? []
  const activeBronzeStack = useQuery(getActiveBronzeStack$) ?? []
  const tabledBronzeProjects = useQuery(getTabledBronzeProjects$) ?? []
  const allTasks = useQuery(getAllTasks$) ?? []
  const tableConfiguration = useQuery(getTableConfiguration$) ?? []
  const tableConfig = tableConfiguration[0]
  const allProjects = useQuery(getProjects$) ?? []
  const allProjectsIncludingArchived = useQuery(getAllProjectsIncludingArchived$) ?? []

  // Query projects for each category
  const healthProjects = useQuery(getProjectsByCategory$('health')) ?? []
  const relationshipsProjects = useQuery(getProjectsByCategory$('relationships')) ?? []
  const financesProjects = useQuery(getProjectsByCategory$('finances')) ?? []
  const growthProjects = useQuery(getProjectsByCategory$('growth')) ?? []
  const leisureProjects = useQuery(getProjectsByCategory$('leisure')) ?? []
  const spiritualityProjects = useQuery(getProjectsByCategory$('spirituality')) ?? []
  const homeProjects = useQuery(getProjectsByCategory$('home')) ?? []
  const contributionProjects = useQuery(getProjectsByCategory$('contribution')) ?? []

  // Create a map of category to projects
  const categoryProjectsMap = useMemo(() => {
    return {
      health: healthProjects,
      relationships: relationshipsProjects,
      finances: financesProjects,
      growth: growthProjects,
      leisure: leisureProjects,
      spirituality: spiritualityProjects,
      home: homeProjects,
      contribution: contributionProjects,
    }
  }, [
    healthProjects,
    relationshipsProjects,
    financesProjects,
    growthProjects,
    leisureProjects,
    spiritualityProjects,
    homeProjects,
    contributionProjects,
  ])

  // Build a set of project IDs that are "active" (on the table)
  const activeProjectIds = useMemo(() => {
    const projectIds = new Set<string>()

    // Gold and Silver projects are active (they're "on the table")
    if (tableConfig?.goldProjectId) {
      projectIds.add(tableConfig.goldProjectId)
    }
    if (tableConfig?.silverProjectId) {
      projectIds.add(tableConfig.silverProjectId)
    }

    // PR1 Task Queue Redesign: Bronze projects that are tabled are active
    tabledBronzeProjects.forEach(entry => {
      projectIds.add(entry.projectId)
    })

    // Legacy: Projects with tasks in the bronze stack are also active
    // (will be removed in PR2 when Task Queue is implemented)
    const taskIdToProjectId = new Map<string, string | null>()
    allTasks.forEach(task => {
      taskIdToProjectId.set(task.id, task.projectId)
    })

    activeBronzeStack.forEach(entry => {
      const projectId = taskIdToProjectId.get(entry.taskId)
      if (projectId) {
        projectIds.add(projectId)
      }
    })

    return projectIds
  }, [activeBronzeStack, tabledBronzeProjects, allTasks, tableConfig])

  // Calculate workers for each category
  const categoryWorkersMap = useMemo(() => {
    const workersMap: Record<string, number> = {}
    PROJECT_CATEGORIES.forEach(category => {
      const projects = categoryProjectsMap[category.value as keyof typeof categoryProjectsMap] || []
      const projectIds = projects.map(p => p.id)
      const workerIds = new Set<string>()
      projectIds.forEach(projectId => {
        const projectWorkers = allWorkerProjects.filter(wp => wp.projectId === projectId)
        projectWorkers.forEach(wp => workerIds.add(wp.workerId))
      })
      workersMap[category.value] = workerIds.size
    })
    return workersMap
  }, [categoryProjectsMap, allWorkerProjects])

  // Build a map of projectId -> task completion percentage
  const projectCompletionMap = useMemo(() => {
    const completionMap = new Map<string, number>()

    // Group tasks by project (excluding archived tasks for consistency with SortingRoom)
    const tasksByProject = new Map<string, (typeof allTasks)[number][]>()
    allTasks.forEach(task => {
      if (task.projectId && task.archivedAt === null) {
        const existing = tasksByProject.get(task.projectId) ?? []
        tasksByProject.set(task.projectId, [...existing, task])
      }
    })

    // Calculate completion for each project
    tasksByProject.forEach((tasks, projectId) => {
      const totalTasks = tasks.length
      if (totalTasks === 0) {
        completionMap.set(projectId, 0)
        return
      }
      const completedTasks = tasks.filter(t => t.status === 'done').length
      const percentage = Math.round((completedTasks / totalTasks) * 100)
      completionMap.set(projectId, percentage)
    })

    return completionMap
  }, [allTasks])

  // Get completed projects
  const completedProjects = useMemo(() => {
    return allProjects
      .filter(p => {
        const lifecycle = resolveLifecycleState(p.projectLifecycleState, null)
        return lifecycle.status === 'completed'
      })
      .sort((a, b) => {
        // Sort by completion date, most recent first
        const aLifecycle = resolveLifecycleState(a.projectLifecycleState, null)
        const bLifecycle = resolveLifecycleState(b.projectLifecycleState, null)
        return (bLifecycle.completedAt ?? 0) - (aLifecycle.completedAt ?? 0)
      })
  }, [allProjects])

  // Get archived projects (filter from all projects including archived)
  const archivedProjects = useMemo(() => {
    return allProjectsIncludingArchived
      .filter(p => p.archivedAt !== null)
      .sort((a, b) => {
        // Sort by archive date, most recent first
        const aDate = a.archivedAt ? new Date(a.archivedAt).getTime() : 0
        const bDate = b.archivedAt ? new Date(b.archivedAt).getTime() : 0
        return bDate - aDate
      })
  }, [allProjectsIncludingArchived])

  // Handler for unarchiving a project
  const handleUnarchive = (projectId: string) => {
    store.commit(
      events.projectUnarchived({
        id: projectId,
        unarchivedAt: new Date(),
        actorId,
      })
    )
  }

  // Check if there are any categories with projects
  const categoriesWithProjects = PROJECT_CATEGORIES.filter(category => {
    const projects = categoryProjectsMap[category.value as keyof typeof categoryProjectsMap] || []
    return projects.length > 0
  })

  const hasNoProjects = categoriesWithProjects.length === 0

  if (hasNoProjects) {
    return (
      <div className='flex min-h-[calc(100vh-300px)] items-center justify-center'>
        <div className='text-center'>
          <p className='mb-4 text-lg text-gray-500'>No projects yet</p>
          <Link
            to={generateRoute.draftingRoom()}
            className='py-2.5 px-4 rounded-lg text-sm font-semibold bg-[#2f2b27] text-[#faf9f7] no-underline inline-block'
          >
            Go to Drafting Room to create projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-white rounded-2xl p-4 border border-[#e8e4de]'>
      <div className='grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4'>
        {categoriesWithProjects.map(category => {
          const projects =
            categoryProjectsMap[category.value as keyof typeof categoryProjectsMap] || []
          const workers = categoryWorkersMap[category.value] || 0

          // Split projects based on lifecycle status:
          // - Active: projects that are on the table OR have bronze tasks (already filtered by activeProjectIds)
          // - Ongoing: projects with status='active' but NOT currently on the table
          // - Backlog: projects with status='backlog'
          const activeProjects = projects.filter(p => activeProjectIds.has(p.id))

          // For ongoing, show active-status projects that aren't currently on the table
          const ongoingProjects = projects.filter(p => {
            if (activeProjectIds.has(p.id)) return false // Already shown as "Active"
            const lifecycle = resolveLifecycleState(p.projectLifecycleState, null)
            return lifecycle.status === 'active'
          })

          // Count backlog projects (status='backlog', stage 4, gold/silver stream only - matches SortingRoom)
          // Bronze-stream projects don't appear as projects in SortingRoom (only their tasks show)
          const backlogProjects = projects.filter(p => {
            const lifecycle = resolveLifecycleState(p.projectLifecycleState, null)
            return (
              lifecycle.status === 'backlog' &&
              lifecycle.stage === 4 &&
              (lifecycle.stream === 'gold' || lifecycle.stream === 'silver')
            )
          })

          // Count planning projects (status='planning' OR 'backlog' in stages 1-3 - matches DraftingRoom filter)
          const planningProjects = projects.filter(p => {
            const lifecycle = resolveLifecycleState(p.projectLifecycleState, null)
            return (
              (lifecycle.status === 'planning' || lifecycle.status === 'backlog') &&
              lifecycle.stage >= 1 &&
              lifecycle.stage <= 3
            )
          })

          return (
            <CategoryCard
              key={category.value}
              categoryValue={category.value}
              categoryName={category.name}
              categoryIcon={category.icon}
              categoryColor={category.colorHex}
              projectCount={projects.length}
              workerCount={workers}
              activeProjects={activeProjects}
              ongoingProjects={ongoingProjects}
              backlogCount={backlogProjects.length}
              planningCount={planningProjects.length}
              projectCompletionMap={projectCompletionMap}
            />
          )
        })}
      </div>

      {/* Completed Projects Section */}
      {completedProjects.length > 0 && (
        <div className='mt-4 border border-[#e8e4de] rounded-xl overflow-hidden'>
          <button
            type='button'
            className='w-full flex items-center justify-between p-4 bg-[#faf9f7] hover:bg-[#f5f3f0] transition-colors cursor-pointer border-none text-left'
            onClick={() => setCompletedExpanded(!completedExpanded)}
          >
            <div className='flex items-center gap-2'>
              <span className='text-sm font-semibold text-[#2f2b27]'>
                Completed ({completedProjects.length})
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-[#8b8680] transition-transform ${completedExpanded ? 'rotate-180' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>

          {completedExpanded && (
            <div className='bg-white divide-y divide-[#e8e4de]'>
              {completedProjects.map(project => {
                const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)
                const completedDate = lifecycle.completedAt
                  ? new Date(lifecycle.completedAt).toLocaleDateString()
                  : null
                const category = PROJECT_CATEGORIES.find(c => c.value === project.category)

                return (
                  <div
                    key={project.id}
                    className='flex items-center justify-between p-4 hover:bg-[#faf9f7] cursor-pointer transition-colors'
                    onClick={() =>
                      navigate(preserveStoreIdInUrl(generateRoute.project(project.id)))
                    }
                  >
                    <div className='flex items-center gap-3'>
                      {category && (
                        <span
                          className='w-2 h-2 rounded-full flex-shrink-0'
                          style={{ backgroundColor: category.colorHex }}
                        />
                      )}
                      <div>
                        <div className='text-sm font-medium text-[#2f2b27]'>{project.name}</div>
                        <div className='text-xs text-[#8b8680]'>
                          {category?.name}
                          {completedDate && ` · Completed ${completedDate}`}
                        </div>
                      </div>
                    </div>
                    <svg
                      className='w-5 h-5 text-green-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Archived Projects Section */}
      {archivedProjects.length > 0 && (
        <div className='mt-4 border border-[#e8e4de] rounded-xl overflow-hidden'>
          <button
            type='button'
            className='w-full flex items-center justify-between p-4 bg-[#faf9f7] hover:bg-[#f5f3f0] transition-colors cursor-pointer border-none text-left'
            onClick={() => setArchivedExpanded(!archivedExpanded)}
          >
            <div className='flex items-center gap-2'>
              <span className='text-sm font-semibold text-[#2f2b27]'>
                Archived ({archivedProjects.length})
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-[#8b8680] transition-transform ${archivedExpanded ? 'rotate-180' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>

          {archivedExpanded && (
            <div className='bg-white divide-y divide-[#e8e4de]'>
              {archivedProjects.map(project => {
                const archivedDate = project.archivedAt
                  ? new Date(project.archivedAt).toLocaleDateString()
                  : null
                const category = PROJECT_CATEGORIES.find(c => c.value === project.category)

                return (
                  <div
                    key={project.id}
                    className='flex items-center justify-between p-4 hover:bg-[#faf9f7] cursor-pointer transition-colors'
                    onClick={() =>
                      navigate(preserveStoreIdInUrl(generateRoute.project(project.id)))
                    }
                  >
                    <div className='flex items-center gap-3'>
                      {category && (
                        <span
                          className='w-2 h-2 rounded-full flex-shrink-0'
                          style={{ backgroundColor: category.colorHex }}
                        />
                      )}
                      <div>
                        <div className='text-sm font-medium text-[#2f2b27]'>{project.name}</div>
                        <div className='text-xs text-[#8b8680]'>
                          {category?.name}
                          {archivedDate && ` · Archived ${archivedDate}`}
                        </div>
                      </div>
                    </div>
                    <button
                      type='button'
                      className='text-xs py-1.5 px-3 rounded-lg bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27]'
                      onClick={e => {
                        e.stopPropagation()
                        handleUnarchive(project.id)
                      }}
                    >
                      Unarchive
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
