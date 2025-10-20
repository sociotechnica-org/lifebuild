import { useQuery } from '@livestore/react'
import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { getProjects$ } from '@work-squared/shared/queries'
import type { Project } from '@work-squared/shared/schema'
import {
  LifeCategoryPresenter,
  type CategoryTab,
  type PlanningSubTab,
} from './LifeCategoryPresenter.js'
import { generateRoute } from '../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../util/navigation.js'

// Life category definitions (will be moved to a constants file later)
const LIFE_CATEGORIES = {
  health: { name: 'Health & Well-Being', color: '#E57373' },
  relationships: { name: 'Relationships', color: '#F06292' },
  finances: { name: 'Finances', color: '#BA68C8' },
  growth: { name: 'Personal Growth & Learning', color: '#64B5F6' },
  leisure: { name: 'Leisure & Lifestyle', color: '#4DB6AC' },
  spirituality: { name: 'Spirituality & Meaning', color: '#FFD54F' },
  home: { name: 'Home & Environment', color: '#FFB74D' },
  contribution: { name: 'Contribution & Service', color: '#A1887F' },
} as const

export const LifeCategoryView: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const allProjects = useQuery(getProjects$) ?? []

  // Filter projects for this category
  const categoryProjects = allProjects.filter(
    (p: Project) => p.category === categoryId && !p.archivedAt && !p.deletedAt
  )

  // Separate projects by status
  const activeProjects = categoryProjects.filter((p: Project) => {
    const attributes = p.attributes as { status?: string } | null
    const status = attributes?.status
    return status === 'active' || (!status && !p.archivedAt && !p.deletedAt)
  })

  const completedProjects = categoryProjects.filter((p: Project) => {
    const attributes = p.attributes as { status?: string } | null
    return attributes?.status === 'completed'
  })

  // Separate planning projects by stage
  const planningProjects = categoryProjects.filter((p: Project) => {
    const attributes = p.attributes as { status?: string; planningStage?: number } | null
    return attributes?.status === 'planning'
  })

  // Projects in stages 1-3 (in progress)
  const inProgressPlans = planningProjects.filter((p: Project) => {
    const attributes = p.attributes as { planningStage?: number } | null
    const stage = attributes?.planningStage ?? 1
    return stage < 4
  })

  // Projects in stage 4 (ready for backlog - awaiting priority)
  const backlogProjects = planningProjects.filter((p: Project) => {
    const attributes = p.attributes as { planningStage?: number } | null
    return attributes?.planningStage === 4
  })

  // Get active project count for smart default tab selection
  const activeProjectCount = activeProjects.length

  // Determine initial tab from URL or smart default
  const getInitialTab = (): CategoryTab => {
    const urlTab = searchParams.get('tab') as CategoryTab | null
    if (urlTab && ['planning', 'active', 'completed'].includes(urlTab)) {
      return urlTab
    }
    // Smart default: Active if there are active projects, otherwise Planning
    return activeProjectCount > 0 ? 'active' : 'planning'
  }

  // Determine initial sub-tab (default to 'project-creation')
  const getInitialSubTab = (): PlanningSubTab => {
    const urlSubTab = searchParams.get('subtab') as PlanningSubTab | null
    if (urlSubTab && ['project-creation', 'project-plans', 'backlog'].includes(urlSubTab)) {
      return urlSubTab
    }
    return 'project-creation'
  }

  const [selectedTab, setSelectedTab] = useState<CategoryTab>(getInitialTab())
  const [selectedSubTab, setSelectedSubTab] = useState<PlanningSubTab>(getInitialSubTab())

  // Update URL when tab changes
  const handleTabChange = (tab: CategoryTab) => {
    setSelectedTab(tab)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', tab)
    if (tab === 'planning') {
      newParams.set('subtab', selectedSubTab)
    } else {
      newParams.delete('subtab')
    }
    setSearchParams(newParams)
  }

  // Update URL when sub-tab changes
  const handleSubTabChange = (subTab: PlanningSubTab) => {
    setSelectedSubTab(subTab)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('subtab', subTab)
    setSearchParams(newParams)
  }

  // Sync state with URL on initial load and when URL changes
  useEffect(() => {
    const urlTab = searchParams.get('tab') as CategoryTab | null
    const urlSubTab = searchParams.get('subtab') as PlanningSubTab | null

    if (urlTab && ['planning', 'active', 'completed'].includes(urlTab)) {
      setSelectedTab(urlTab)
    }

    if (urlSubTab && ['project-creation', 'project-plans', 'backlog'].includes(urlSubTab)) {
      setSelectedSubTab(urlSubTab)
    }
  }, [searchParams])

  if (!categoryId || !(categoryId in LIFE_CATEGORIES)) {
    return (
      <div className='h-full bg-white flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-600 mb-2'>Category not found</h2>
          <p className='text-gray-500'>The category you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const category = LIFE_CATEGORIES[categoryId as keyof typeof LIFE_CATEGORIES]

  const handleProjectClick = (project: Project) => {
    const attrs = project.attributes as { planningStage?: number; status?: string } | null

    // Route based on planning stage:
    // - Stages 1-2: Project Creation form (to continue editing details/objectives)
    // - Stages 3-4: Project workspace (task planning done, work on project)
    if (attrs?.status === 'planning' && attrs.planningStage && attrs.planningStage < 3) {
      // Stages 1-2: Navigate to Project Creation form to continue planning
      navigate(
        preserveStoreIdInUrl(
          `/category/${categoryId}?tab=planning&subtab=project-creation&projectId=${project.id}`
        )
      )
    } else {
      // Stages 3-4, active, or completed projects: Navigate to project workspace
      navigate(preserveStoreIdInUrl(generateRoute.project(project.id)))
    }
  }

  return (
    <LifeCategoryPresenter
      categoryId={categoryId}
      categoryName={category.name}
      categoryColor={category.color}
      selectedTab={selectedTab}
      selectedSubTab={selectedTab === 'planning' ? selectedSubTab : null}
      activeProjects={activeProjects}
      completedProjects={completedProjects}
      inProgressPlans={inProgressPlans}
      backlogProjects={backlogProjects}
      onTabChange={handleTabChange}
      onSubTabChange={handleSubTabChange}
      onProjectClick={handleProjectClick}
    />
  )
}
