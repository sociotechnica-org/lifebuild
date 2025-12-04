import React, { useMemo } from 'react'
import { useQuery } from '@livestore/react'
import { Link } from 'react-router-dom'
import {
  getProjectsByCategory$,
  getAllWorkerProjects$,
  getActiveBronzeStack$,
  getAllTasks$,
  getTableConfiguration$,
} from '@work-squared/shared/queries'
import { PROJECT_CATEGORIES, resolveLifecycleState } from '@work-squared/shared'
import { CategoryCard } from './CategoryCard.js'
import { generateRoute } from '../../../constants/routes.js'

/**
 * Life Map - The overview of all eight life categories
 * Displays categories in a responsive grid with project/worker stats.
 *
 * Grid layout (2x4 on desktop):
 * Row 1: Health, Relationships, Finances, Growth
 * Row 2: Leisure, Spirituality, Home, Contribution
 */
export const LifeMap: React.FC = () => {
  const allWorkerProjects = useQuery(getAllWorkerProjects$) ?? []
  const activeBronzeStack = useQuery(getActiveBronzeStack$) ?? []
  const allTasks = useQuery(getAllTasks$) ?? []
  const tableConfiguration = useQuery(getTableConfiguration$) ?? []
  const tableConfig = tableConfiguration[0]

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

  // Build a set of project IDs that are "active" (on the table or have bronze tasks)
  const activeProjectIds = useMemo(() => {
    const projectIds = new Set<string>()

    // Gold and Silver projects are active (they're "on the table")
    if (tableConfig?.goldProjectId) {
      projectIds.add(tableConfig.goldProjectId)
    }
    if (tableConfig?.silverProjectId) {
      projectIds.add(tableConfig.silverProjectId)
    }

    // Projects with tasks in the bronze stack are also active
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
  }, [activeBronzeStack, allTasks, tableConfig])

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
          <Link to={generateRoute.draftingRoom()} className='new-ui-btn'>
            Go to Drafting Room to create projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='new-ui-card'>
      <div className='new-ui-category-grid'>
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
    </div>
  )
}
