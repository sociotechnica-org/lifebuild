import React, { useState, useMemo } from 'react'
import { useQuery } from '@livestore/react'
import { getProjects$ } from '@work-squared/shared/queries'
import {
  PROJECT_CATEGORIES,
  type ProjectCategory,
  type PlanningAttributes,
  type PlanningStage,
} from '@work-squared/shared'
import type { Project } from '@work-squared/shared/schema'
import { StageColumn } from './StageColumn.js'
import { PlanningQueueCard } from './PlanningQueueCard.js'
import './drafting-room.css'

export type ProjectTier = 'gold' | 'silver' | 'bronze'

/**
 * Derive tier from project attributes (archetype + scale)
 * Gold: Initiative + Major/Epic scale
 * Silver: System Build or Discovery Mission
 * Bronze: Everything else
 */
export function deriveTier(attributes: PlanningAttributes | null): ProjectTier {
  if (!attributes) return 'bronze'

  const { archetype, scale } = attributes

  // Gold: Initiative + Major/Epic scale
  if (archetype === 'initiative' && (scale === 'major' || scale === 'epic')) {
    return 'gold'
  }

  // Silver: System Build or Discovery Mission
  if (archetype === 'systembuild' || archetype === 'discovery') {
    return 'silver'
  }

  // Bronze: Everything else
  return 'bronze'
}

/**
 * Parse objectives string and return count
 */
function getObjectivesCount(attributes: PlanningAttributes | null): number {
  if (!attributes?.objectives) return 0
  // Objectives might be newline or semicolon separated
  const objectives = attributes.objectives
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

// Stage configuration
const STAGES: { stage: PlanningStage; name: string; emptyMessage: string }[] = [
  { stage: 1, name: 'Identified', emptyMessage: "Click 'Start New Project' to begin" },
  { stage: 2, name: 'Scoped', emptyMessage: 'Complete Stage 1 projects to move them here' },
  { stage: 3, name: 'Drafted', emptyMessage: 'Define objectives to advance projects' },
  { stage: 4, name: 'Prioritized', emptyMessage: 'Draft task lists to advance projects' },
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
  const allProjects = useQuery(getProjects$) ?? []

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all')
  const [tierFilter, setTierFilter] = useState<ProjectTier | 'all'>('all')

  // Get projects in planning queue (have planningStage 1-4, not archived, not active)
  const planningProjects = useMemo(() => {
    return allProjects.filter(project => {
      const attrs = project.attributes as PlanningAttributes | null
      const stage = attrs?.planningStage
      const status = attrs?.status

      // Must have a planning stage and be in planning status
      if (!stage || stage < 1 || stage > 4) return false
      if (status && status !== 'planning' && status !== 'backlog') return false
      if (project.archivedAt) return false

      return true
    })
  }, [allProjects])

  // Apply filters
  const filteredProjects = useMemo(() => {
    return planningProjects.filter(project => {
      const attrs = project.attributes as PlanningAttributes | null

      // Category filter
      if (categoryFilter !== 'all' && project.category !== categoryFilter) {
        return false
      }

      // Tier filter
      if (tierFilter !== 'all') {
        const tier = deriveTier(attrs)
        if (tier !== tierFilter) return false
      }

      return true
    })
  }, [planningProjects, categoryFilter, tierFilter])

  // Group projects by stage
  const projectsByStage = useMemo(() => {
    const grouped: Record<PlanningStage, Project[]> = { 1: [], 2: [], 3: [], 4: [] }

    filteredProjects.forEach(project => {
      const attrs = project.attributes as PlanningAttributes | null
      const stage = attrs?.planningStage
      if (stage && stage >= 1 && stage <= 4) {
        grouped[stage as PlanningStage].push(project)
      }
    })

    return grouped
  }, [filteredProjects])

  // Count stale projects
  const staleCount = useMemo(() => {
    return planningProjects.filter(p => isStale(p.updatedAt)).length
  }, [planningProjects])

  const hasActiveFilters = categoryFilter !== 'all' || tierFilter !== 'all'

  const clearFilters = () => {
    setCategoryFilter('all')
    setTierFilter('all')
  }

  const handleResume = (projectId: string) => {
    // TODO: Navigate to stage-specific form
    console.log('Resume project:', projectId)
  }

  const handleAbandon = (projectId: string) => {
    // TODO: Show confirmation dialog, then archive
    console.log('Abandon project:', projectId)
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
                const attrs = project.attributes as PlanningAttributes | null
                return (
                  <PlanningQueueCard
                    key={project.id}
                    project={project}
                    tier={deriveTier(attrs)}
                    objectivesCount={getObjectivesCount(attrs)}
                    taskCount={0} // TODO: Query tasks for this project
                    isStale={isStale(project.updatedAt)}
                    onResume={() => handleResume(project.id)}
                    onAbandon={() => handleAbandon(project.id)}
                  />
                )
              })}
            </StageColumn>
          )
        })}
      </div>

      {/* Start New Project Button */}
      <div className='drafting-room-footer'>
        <button type='button' className='drafting-room-new-project-btn'>
          + Start New Project
        </button>
      </div>
    </div>
  )
}
