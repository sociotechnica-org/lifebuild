import React, { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useStore } from '../../../livestore-compat.js'
import { getProjects$ } from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import {
  PROJECT_CATEGORIES,
  type ProjectCategory,
  type PlanningStage,
  type ProjectLifecycleState,
  resolveLifecycleState,
} from '@lifebuild/shared'
import type { Project } from '@lifebuild/shared/schema'
import { generateRoute } from '../../../constants/routes.js'
import { useAuth } from '../../../contexts/AuthContext.js'
import { StageColumn } from './StageColumn.js'
import { PlanningQueueCard } from './PlanningQueueCard.js'

export type ProjectTier = 'gold' | 'silver' | 'bronze'

/**
 * Derive tier from project lifecycle state
 * First checks if tier is explicitly stored in `stream` field.
 * Falls back to deriving from archetype + scale:
 *   Gold: Initiative + Major/Epic scale
 *   Silver: System Build or Discovery Mission
 *   Bronze: Quick Task or explicitly micro scale
 * Returns null if tier cannot be determined (e.g., Stage 1 projects with no archetype)
 */
export function deriveTier(lifecycle: ProjectLifecycleState | null): ProjectTier | null {
  if (!lifecycle) return null

  // If tier is explicitly stored in stream field, use that
  if (lifecycle.stream) {
    return lifecycle.stream as ProjectTier
  }

  const { archetype, scale } = lifecycle

  // No archetype set yet - can't determine tier
  if (!archetype) return null

  // Gold: Initiative + Major/Epic scale
  if (archetype === 'initiative' && (scale === 'major' || scale === 'epic')) {
    return 'gold'
  }

  // Silver: System Build or Discovery Mission
  if (archetype === 'systembuild' || archetype === 'discovery') {
    return 'silver'
  }

  // Bronze: Quick Task, maintenance, or micro scale
  if (archetype === 'quicktask' || archetype === 'maintenance' || scale === 'micro') {
    return 'bronze'
  }

  // Default to null if we can't determine (e.g., initiative without scale)
  return null
}

/**
 * Check if project is stale (not updated in 14+ days)
 */
function isStale(updatedAt: Date): boolean {
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  return updatedAt < fourteenDaysAgo
}

/**
 * Get lifecycle state from project, handling both old and new formats
 */
function getLifecycleState(project: Project): ProjectLifecycleState {
  return resolveLifecycleState(project.projectLifecycleState, null)
}

// Stage configuration (3 stages - Stage 4 happens in the Sorting Room)
const STAGES: { stage: PlanningStage; name: string; emptyMessage: string }[] = [
  { stage: 1, name: 'Identify', emptyMessage: "Click 'Start New Project' to begin" },
  { stage: 2, name: 'Scope', emptyMessage: 'Complete Stage 1 projects to move them here' },
  { stage: 3, name: 'Detail', emptyMessage: 'Define objectives to advance projects' },
]

// Category filter options (All + categories)
const CATEGORY_FILTERS: { value: ProjectCategory | 'all'; label: string; colorHex?: string }[] = [
  { value: 'all', label: 'All' },
  ...PROJECT_CATEGORIES.map(c => ({ value: c.value, label: c.name, colorHex: c.colorHex })),
]

// Tier filter options
const TIER_FILTERS: { value: ProjectTier | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'gold', label: 'Initiative' },
  { value: 'silver', label: 'Optimization' },
  { value: 'bronze', label: 'To-Do' },
]

export const DraftingRoom: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { store } = useStore()
  const { user } = useAuth()
  const allProjects = useQuery(getProjects$) ?? []

  // Valid tier values for validation
  const validTiers: (ProjectTier | 'all')[] = ['all', 'gold', 'silver', 'bronze']

  // Derive filter values directly from URL (single source of truth)
  const categoryFromUrl = searchParams.get('category') as ProjectCategory | null
  const categoryFilter: ProjectCategory | 'all' =
    categoryFromUrl && PROJECT_CATEGORIES.some(c => c.value === categoryFromUrl)
      ? categoryFromUrl
      : 'all'

  const tierFromUrl = searchParams.get('tier') as ProjectTier | null
  const tierFilter: ProjectTier | 'all' =
    tierFromUrl && validTiers.includes(tierFromUrl) ? tierFromUrl : 'all'

  // Update URL when filters change (called by UI handlers)
  const setCategoryFilter = (value: ProjectCategory | 'all') => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'all') {
      newParams.delete('category')
    } else {
      newParams.set('category', value)
    }
    setSearchParams(newParams, { replace: true })
  }

  const setTierFilter = (value: ProjectTier | 'all') => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'all') {
      newParams.delete('tier')
    } else {
      newParams.set('tier', value)
    }
    setSearchParams(newParams, { replace: true })
  }

  // Get projects in planning queue (status = planning or backlog, not archived)
  const planningProjects = useMemo(() => {
    return allProjects.filter(project => {
      if (project.archivedAt) return false

      const lifecycle = getLifecycleState(project)

      // Must be in planning or backlog status
      if (lifecycle.status !== 'planning' && lifecycle.status !== 'backlog') return false

      // Must have a valid stage 1-3 (Stage 4 projects go to Sorting Room)
      if (lifecycle.stage < 1 || lifecycle.stage > 3) return false

      return true
    })
  }, [allProjects])

  // Apply filters
  const filteredProjects = useMemo(() => {
    return planningProjects.filter(project => {
      const lifecycle = getLifecycleState(project)

      // Category filter
      if (categoryFilter !== 'all' && project.category !== categoryFilter) {
        return false
      }

      // Tier filter
      if (tierFilter !== 'all') {
        const tier = deriveTier(lifecycle)
        if (tier !== tierFilter) return false
      }

      return true
    })
  }, [planningProjects, categoryFilter, tierFilter])

  // Group projects by stage
  const projectsByStage = useMemo(() => {
    const grouped: Record<PlanningStage, Project[]> = { 1: [], 2: [], 3: [], 4: [] }

    filteredProjects.forEach(project => {
      const lifecycle = getLifecycleState(project)
      const stage = lifecycle.stage
      if (stage >= 1 && stage <= 4) {
        grouped[stage as PlanningStage].push(project)
      }
    })

    return grouped
  }, [filteredProjects])

  // Count stale projects (from filtered view so it matches what's visible)
  const staleCount = useMemo(() => {
    return filteredProjects.filter(p => isStale(p.updatedAt)).length
  }, [filteredProjects])

  const hasActiveFilters = categoryFilter !== 'all' || tierFilter !== 'all'

  const clearFilters = () => {
    // Clear both filters in a single setSearchParams call to avoid race condition
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('category')
    newParams.delete('tier')
    setSearchParams(newParams, { replace: true })
  }

  const handleResume = (projectId: string, stage: PlanningStage) => {
    // Navigate to the current stage form to continue working on it
    switch (stage) {
      case 1:
        navigate(generateRoute.projectStage1(projectId))
        break
      case 2:
        navigate(generateRoute.projectStage2(projectId))
        break
      case 3:
        navigate(generateRoute.projectStage3(projectId))
        break
      default:
        // Stage 4+ projects should be in the Sorting Room, not here
        break
    }
  }

  const handleAbandon = (projectId: string, projectName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to abandon "${projectName}"?\n\nThis will archive the project and remove it from the planning queue.`
    )

    if (confirmed) {
      store.commit(
        events.projectArchived({
          id: projectId,
          archivedAt: new Date(),
          actorId: user?.id,
        })
      )
    }
  }

  const stage1Projects = projectsByStage[1] ?? []
  const isIdentifyingEmpty = stage1Projects.length === 0

  return (
    <div className='py-4'>
      {/* Filter Bar */}
      <div className='mb-4 flex flex-col gap-3'>
        {/* Category Pills + Tier Dropdown + New Project on same row */}
        <div className='flex flex-wrap items-center gap-2'>
          <div className='flex flex-wrap items-center gap-1.5'>
            {CATEGORY_FILTERS.map(cat => (
              <button
                key={cat.value}
                type='button'
                className={`py-1 px-2.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                  categoryFilter === cat.value
                    ? 'text-white'
                    : 'bg-transparent border-[#e8e4de] text-[#8b8680] hover:border-[#d0ccc5] hover:text-[#2f2b27]'
                }`}
                style={
                  categoryFilter === cat.value && cat.colorHex
                    ? { backgroundColor: cat.colorHex, borderColor: cat.colorHex, color: '#fff' }
                    : categoryFilter === cat.value
                      ? { backgroundColor: '#2f2b27', borderColor: '#2f2b27', color: '#fff' }
                      : undefined
                }
                onClick={() => setCategoryFilter(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <select
            className='py-1 px-2.5 rounded-lg text-xs border border-[#e8e4de] bg-white text-[#2f2b27] cursor-pointer font-medium focus:outline-none focus:border-[#d0ccc5]'
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value as ProjectTier | 'all')}
          >
            {TIER_FILTERS.map(tier => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </select>

          {/* New Project button - always right-aligned */}
          <button
            type='button'
            className='ml-auto py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#2f2b27] text-[#faf9f7] cursor-pointer border-none transition-all duration-200 hover:bg-[#4a4540]'
            onClick={() => navigate(generateRoute.projectCreate())}
          >
            + New Project
          </button>
        </div>

        {/* Filter status on separate line */}
        {hasActiveFilters && (
          <div className='flex items-center gap-2 text-xs text-[#8b8680]'>
            <span>
              Showing {filteredProjects.length} of {planningProjects.length} projects
            </span>
            <button
              type='button'
              className='text-[#8b8680] bg-transparent border-none cursor-pointer underline hover:text-[#2f2b27]'
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Stale Projects Banner */}
      {staleCount > 0 && (
        <div className='bg-[#fef3cd] border border-[#f5e6a3] text-[#856404] py-2 px-3 rounded-lg text-sm mb-4'>
          ⚠️ {staleCount} project{staleCount !== 1 ? 's' : ''} haven't been touched in 2+ weeks
        </div>
      )}

      {/* Stage Columns */}
      <div className='grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 items-start'>
        {STAGES.map(({ stage, name, emptyMessage }) => {
          const stageProjects = projectsByStage[stage] ?? []
          const showNewProjectLink = stage === 1 && isIdentifyingEmpty
          return (
            <StageColumn
              key={stage}
              stage={stage}
              stageName={name}
              projectCount={stageProjects.length}
              emptyMessage={showNewProjectLink ? undefined : emptyMessage}
              emptyAction={
                showNewProjectLink ? (
                  <button
                    type='button'
                    className='bg-transparent border border-dashed border-[#d0ccc5] text-[#8b8680] py-2 px-4 rounded-lg text-sm cursor-pointer transition-all duration-200 w-full hover:border-[#2f2b27] hover:text-[#2f2b27] hover:bg-[rgba(47,43,39,0.03)]'
                    onClick={() => navigate(generateRoute.projectCreate())}
                  >
                    + Start a new project
                  </button>
                ) : undefined
              }
            >
              {stageProjects.map(project => {
                const lifecycle = getLifecycleState(project)
                return (
                  <PlanningQueueCard
                    key={project.id}
                    project={project}
                    stage={stage}
                    tier={deriveTier(lifecycle)}
                    taskCount={0} // TODO: Query tasks for this project
                    isStale={isStale(project.updatedAt)}
                    onResume={() => handleResume(project.id, stage)}
                    onAbandon={() => handleAbandon(project.id, project.name)}
                  />
                )
              })}
            </StageColumn>
          )
        })}
      </div>
    </div>
  )
}
