import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useStore } from '@livestore/react'
import { getProjects$ } from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import {
  PROJECT_CATEGORIES,
  type ProjectCategory,
  type PlanningStage,
  type ProjectLifecycleState,
  resolveLifecycleState,
} from '@work-squared/shared'
import type { Project } from '@work-squared/shared/schema'
import { generateRoute } from '../../../constants/routes.js'
import { useAuth } from '../../../contexts/AuthContext.js'
import { StageColumn } from './StageColumn.js'
import { PlanningQueueCard } from './PlanningQueueCard.js'
import './drafting-room.css'

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
 * Parse objectives string and return count
 */
function getObjectivesCount(lifecycle: ProjectLifecycleState | null): number {
  if (!lifecycle?.objectives) return 0
  // Objectives might be newline or semicolon separated
  const objectives = lifecycle.objectives
    .split(/[;\n]/)
    .map((o: string) => o.trim())
    .filter((o: string) => o.length > 0)
  return objectives.length
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
  { stage: 1, name: 'Identifying', emptyMessage: "Click 'Start New Project' to begin" },
  { stage: 2, name: 'Scoping', emptyMessage: 'Complete Stage 1 projects to move them here' },
  { stage: 3, name: 'Drafting', emptyMessage: 'Define objectives to advance projects' },
]

// Category filter options (All + categories)
const CATEGORY_FILTERS: { value: ProjectCategory | 'all'; label: string; colorHex?: string }[] = [
  { value: 'all', label: 'All' },
  ...PROJECT_CATEGORIES.map(c => ({ value: c.value, label: c.name, colorHex: c.colorHex })),
]

// Tier filter options
const TIER_FILTERS: { value: ProjectTier | 'all'; label: string }[] = [
  { value: 'all', label: 'All Tiers' },
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'bronze', label: 'Bronze' },
]

export const DraftingRoom: React.FC = () => {
  const navigate = useNavigate()
  const { store } = useStore()
  const { user } = useAuth()
  const allProjects = useQuery(getProjects$) ?? []

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all')
  const [tierFilter, setTierFilter] = useState<ProjectTier | 'all'>('all')

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
    setCategoryFilter('all')
    setTierFilter('all')
  }

  const handleResume = (projectId: string, stage: PlanningStage) => {
    // Navigate to the current stage form to continue working on it
    switch (stage) {
      case 1:
        navigate(generateRoute.newProjectStage1(projectId))
        break
      case 2:
        navigate(generateRoute.newProjectStage2(projectId))
        break
      case 3:
        navigate(generateRoute.newProjectStage3(projectId))
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

  return (
    <div className='drafting-room'>
      {/* Filter Bar */}
      <div className='drafting-room-filters'>
        {/* Category Pills */}
        <div className='drafting-room-category-filters'>
          <span className='drafting-room-filter-label'>Category:</span>
          {CATEGORY_FILTERS.map(cat => (
            <button
              key={cat.value}
              type='button'
              className={`drafting-room-category-pill ${categoryFilter === cat.value ? 'active' : ''}`}
              style={
                categoryFilter === cat.value && cat.colorHex
                  ? { backgroundColor: cat.colorHex, borderColor: cat.colorHex, color: '#fff' }
                  : undefined
              }
              onClick={() => setCategoryFilter(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tier Dropdown + Clear Filters */}
        <div className='drafting-room-tier-filters'>
          <span className='drafting-room-filter-label'>Tier:</span>
          <select
            className='drafting-room-tier-select'
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value as ProjectTier | 'all')}
          >
            {TIER_FILTERS.map(tier => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <>
              <span className='drafting-room-filter-count'>
                {filteredProjects.length} of {planningProjects.length} projects
              </span>
              <button type='button' className='drafting-room-clear-filters' onClick={clearFilters}>
                Clear Filters
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stale Projects Banner */}
      {staleCount > 0 && (
        <div className='drafting-room-stale-banner'>
          ⚠️ {staleCount} project{staleCount !== 1 ? 's' : ''} haven't been touched in 2+ weeks
        </div>
      )}

      {/* Stage Columns */}
      <div className='drafting-room-stages'>
        {STAGES.map(({ stage, name, emptyMessage }) => {
          const stageProjects = projectsByStage[stage] ?? []
          return (
            <StageColumn
              key={stage}
              stage={stage}
              stageName={name}
              projectCount={stageProjects.length}
              emptyMessage={emptyMessage}
            >
              {stageProjects.map(project => {
                const lifecycle = getLifecycleState(project)
                return (
                  <PlanningQueueCard
                    key={project.id}
                    project={project}
                    stage={stage}
                    tier={deriveTier(lifecycle)}
                    objectivesCount={getObjectivesCount(lifecycle)}
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

      {/* Start New Project Button */}
      <div className='drafting-room-footer'>
        <button
          type='button'
          className='drafting-room-new-project-btn'
          onClick={() => navigate(generateRoute.newProjectCreate())}
        >
          + Start New Project
        </button>
      </div>
    </div>
  )
}
