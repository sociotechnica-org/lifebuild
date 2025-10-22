import { useQuery, useStore } from '@livestore/react'
import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { getProjects$ } from '@work-squared/shared/queries'
import type { Project } from '@work-squared/shared/schema'
import { events } from '@work-squared/shared/schema'
import { getCategoryInfo } from '@work-squared/shared'
import type { PlanningAttributes, ProjectCategory } from '@work-squared/shared'
import {
  LifeCategoryPresenter,
  type CategoryTab,
  type PlanningSubTab,
} from './LifeCategoryPresenter.js'
import { generateRoute } from '../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../util/navigation.js'
import { useCategoryAdvisorConversation } from '../../hooks/useCategoryAdvisor.js'
import type { DragEndEvent } from '@dnd-kit/core'
import { useSnackbar } from '../ui/Snackbar/Snackbar.js'

// Life category definitions - using colors from local design
// Icons come from shared PROJECT_CATEGORIES via getCategoryInfo
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
  const { store } = useStore()
  const { showSnackbar } = useSnackbar()
  const allProjects = useQuery(getProjects$) ?? []

  // Validate categoryId before using it
  const isValidCategory = categoryId && categoryId in LIFE_CATEGORIES

  // Auto-create/select category advisor conversation (Story 3.8)
  // Only call hook if category is valid to prevent runtime errors
  const { conversationId, isReady } = useCategoryAdvisorConversation(
    isValidCategory ? (categoryId as ProjectCategory) : null
  )

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
  const backlogProjects = planningProjects
    .filter((p: Project) => {
      const attributes = p.attributes as { planningStage?: number } | null
      return attributes?.planningStage === 4
    })
    .sort((a: Project, b: Project) => {
      const aAttrs = a.attributes as { priority?: number } | null
      const bAttrs = b.attributes as { priority?: number } | null
      const aPriority = aAttrs?.priority ?? Number.MAX_SAFE_INTEGER
      const bPriority = bAttrs?.priority ?? Number.MAX_SAFE_INTEGER
      return aPriority - bPriority // Lower number = higher priority
    })

  // Determine initial tab from URL or smart default
  const getInitialTab = (): CategoryTab => {
    const urlTab = searchParams.get('tab') as CategoryTab | null
    if (urlTab && ['planning', 'active', 'completed'].includes(urlTab)) {
      return urlTab
    }
    // Smart default priority: Active > Planning (never Completed)
    if (activeProjects.length > 0) return 'active'
    if (planningProjects.length > 0) return 'planning'
    return 'planning' // Default to planning if no projects
  }

  // Determine initial sub-tab with smart defaults
  const getInitialSubTab = (): PlanningSubTab => {
    const urlSubTab = searchParams.get('subtab') as PlanningSubTab | null
    if (urlSubTab && ['project-creation', 'project-plans', 'backlog'].includes(urlSubTab)) {
      return urlSubTab
    }
    // Smart default priority: Backlog > Project Plans > Project Creation
    if (backlogProjects.length > 0) return 'backlog'
    if (inProgressPlans.length > 0) return 'project-plans'
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

  // Auto-select category advisor conversation when ready (Story 3.8)
  useEffect(() => {
    if (!conversationId || !isReady) return

    const currentConversationId = searchParams.get('conversationId')

    // Only auto-select if no conversation is currently selected
    // This prevents overriding user's manual conversation selection
    if (!currentConversationId) {
      const newParams = new URLSearchParams(searchParams)
      newParams.set('conversationId', conversationId)
      setSearchParams(newParams, { replace: true })
    }
  }, [conversationId, isReady, searchParams, setSearchParams])

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
  const categoryInfo = getCategoryInfo(categoryId as ProjectCategory)

  const handleProjectClick = (project: Project) => {
    const attrs = project.attributes as { planningStage?: number; status?: string } | null

    // Route based on planning stage:
    // - Stages undefined, 0, 1-2: Project Creation form (to continue editing details/objectives)
    // - Stages 3-4: Project workspace (task planning done, work on project)
    if (attrs?.status === 'planning') {
      const stage = attrs.planningStage ?? 1 // Default to stage 1 if undefined

      if (stage < 3) {
        // Stages 0, 1, 2: Navigate to Project Creation form to continue planning
        navigate(
          preserveStoreIdInUrl(
            `/category/${categoryId}?tab=planning&subtab=project-creation&projectId=${project.id}`
          )
        )
        return
      }
    }

    // Stages 3-4, active, or completed projects: Navigate to project workspace
    navigate(preserveStoreIdInUrl(generateRoute.project(project.id)))
  }

  const handleBacklogReorder = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = backlogProjects.findIndex(p => p.id === active.id)
    const newIndex = backlogProjects.findIndex(p => p.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Reorder the array
    const reorderedProjects = [...backlogProjects]
    const [movedProject] = reorderedProjects.splice(oldIndex, 1)
    if (!movedProject) {
      return
    }
    reorderedProjects.splice(newIndex, 0, movedProject)

    // Update priorities for all affected projects
    // Priority values are just sequential numbers (0, 1, 2, 3, ...)
    const updates = reorderedProjects.map((project, index) => ({
      project,
      priority: index,
    }))

    // Commit all priority updates
    updates.forEach(({ project, priority }) => {
      const currentAttrs = (project.attributes as Record<string, any>) || {}
      store.commit(
        events.projectAttributesUpdated({
          id: project.id,
          attributes: {
            ...currentAttrs,
            priority,
          },
          updatedAt: new Date(),
          actorId: undefined,
        })
      )
    })

    // Show success notification
    showSnackbar({
      message: `${movedProject.name} moved to position #${newIndex + 1}`,
      type: 'success',
      duration: 3000,
    })
  }

  const handleActivateProject = async (project: Project) => {
    if (!store) {
      throw new Error('Store is unavailable')
    }

    const now = new Date()
    const currentAttrs = (project.attributes as PlanningAttributes | null) || {}
    const { priority: _priority, ...restAttrs } = currentAttrs
    void _priority

    const updatedAttributes: PlanningAttributes = {
      ...restAttrs,
      status: 'active',
      planningStage: restAttrs.planningStage ?? 4,
      activatedAt: now.getTime(),
      lastActivityAt: now.getTime(),
    }

    try {
      await store.commit(
        events.projectAttributesUpdated({
          id: project.id,
          attributes: updatedAttributes as Record<string, unknown>,
          updatedAt: now,
          actorId: undefined,
        })
      )

      showSnackbar({
        message: `${project.name} is now active!`,
        type: 'success',
        duration: 3000,
      })

      handleTabChange('active')
    } catch (error) {
      console.error('Failed to activate project', error)
      showSnackbar({
        message: `Couldn't activate ${project.name}. Please try again.`,
        type: 'error',
        duration: 4000,
      })
      throw error
    }
  }

  return (
    <LifeCategoryPresenter
      categoryId={categoryId}
      categoryName={category.name}
      categoryColor={category.color}
      categoryIcon={categoryInfo?.icon}
      selectedTab={selectedTab}
      selectedSubTab={selectedTab === 'planning' ? selectedSubTab : null}
      activeProjects={activeProjects}
      completedProjects={completedProjects}
      inProgressPlans={inProgressPlans}
      backlogProjects={backlogProjects}
      onTabChange={handleTabChange}
      onSubTabChange={handleSubTabChange}
      onProjectClick={handleProjectClick}
      onBacklogReorder={handleBacklogReorder}
      onActivateProject={handleActivateProject}
    />
  )
}
