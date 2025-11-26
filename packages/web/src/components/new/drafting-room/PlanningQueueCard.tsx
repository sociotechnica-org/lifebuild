import React from 'react'
import { getCategoryInfo, type ProjectCategory } from '@work-squared/shared'
import type { Project } from '@work-squared/shared/schema'
import type { ProjectTier } from './DraftingRoom.js'

/**
 * Format a date as compact relative time (e.g., "2w ago", "5 min ago", "1d ago")
 */
function formatCompactRelativeTime(date: Date): string {
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 4) return `${diffWeeks}w ago`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths}mo ago`

  return '1y+ ago'
}

interface PlanningQueueCardProps {
  project: Project
  tier: ProjectTier
  objectivesCount: number
  taskCount: number
  isStale: boolean
  onResume: () => void
  onAbandon: () => void
}

const TIER_LABELS: Record<ProjectTier, string> = {
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
}

export const PlanningQueueCard: React.FC<PlanningQueueCardProps> = ({
  project,
  tier,
  objectivesCount,
  taskCount,
  isStale,
  onResume,
  onAbandon,
}) => {
  const categoryInfo = getCategoryInfo(project.category as ProjectCategory | null)
  const categoryColor = categoryInfo?.colorHex ?? '#888'
  const categoryLabel = categoryInfo?.name?.toUpperCase() ?? 'UNCATEGORIZED'

  // Build the tier/stats line
  const statsLine = [
    TIER_LABELS[tier],
    objectivesCount > 0 ? `${objectivesCount} obj` : null,
    taskCount > 0 ? `${taskCount} tasks` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className='planning-queue-card' style={{ borderLeftColor: categoryColor }}>
      <div className='planning-queue-card-header'>
        <span className='planning-queue-card-category' style={{ backgroundColor: categoryColor }}>
          {categoryLabel}
        </span>
        <span className='planning-queue-card-time'>
          <span className='planning-queue-card-time-icon'>⏱</span>
          {formatCompactRelativeTime(project.updatedAt)}
        </span>
      </div>

      <h3 className='planning-queue-card-title'>{project.name}</h3>

      <div className='planning-queue-card-stats'>
        <span className={`planning-queue-card-tier tier-${tier}`}>{statsLine}</span>
        {isStale && <span className='planning-queue-card-stale'>⚠️</span>}
      </div>

      <div className='planning-queue-card-actions'>
        <button type='button' className='planning-queue-card-btn primary' onClick={onResume}>
          Resume
        </button>
        <button type='button' className='planning-queue-card-btn secondary' onClick={onAbandon}>
          Abandon
        </button>
      </div>
    </div>
  )
}
