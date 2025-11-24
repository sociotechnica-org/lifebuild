import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import { getProjectsByCategory$, getAllWorkerProjects$ } from '@work-squared/shared/queries'
import { PROJECT_CATEGORIES } from '@work-squared/shared'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'

export const LifeMap: React.FC = () => {
  const allWorkerProjects = useQuery(getAllWorkerProjects$) ?? []

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

  return (
    <div>
      <ul>
        {PROJECT_CATEGORIES.map(category => {
          const projects =
            categoryProjectsMap[category.value as keyof typeof categoryProjectsMap] || []
          const workers = categoryWorkersMap[category.value] || 0
          return (
            <li key={category.value} className='mb-2'>
              <Link to={preserveStoreIdInUrl(generateRoute.newCategory(category.value))}>
                <strong>
                  {category.icon && <span>{category.icon}</span>} {category.name}
                </strong>
              </Link>
              <div>
                <div>Projects: {projects.length}</div>
                <div>Workers: {workers}</div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
