import React from 'react'
import { getCategoryInfo, type ProjectCategory, type PlanningStage } from '@lifebuild/shared'
import type { System } from '@lifebuild/shared/schema'

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
  if (diffWeeks < 5) return `${diffWeeks}w ago`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths}mo ago`

  return '1y+ ago'
}

/**
 * Get the action button label based on the current stage (imperative verbs)
 */
function getActionLabel(stage: PlanningStage): string {
  switch (stage) {
    case 1:
      return 'Identify'
    case 2:
      return 'Scope'
    case 3:
      return 'Detail'
    default:
      return 'Resume'
  }
}

interface SystemQueueCardProps {
  system: System
  stage: PlanningStage
  isStale: boolean
  onResume: () => void
  onAbandon: () => void
}

export const SystemQueueCard: React.FC<SystemQueueCardProps> = ({
  system,
  stage,
  isStale,
  onResume,
  onAbandon,
}) => {
  const categoryInfo = getCategoryInfo(system.category as ProjectCategory | null)
  const categoryColor = categoryInfo?.colorHex ?? '#888'
  const categoryLabel = categoryInfo?.name?.toUpperCase() ?? 'UNCATEGORIZED'

  return (
    <div
      className='border border-[#e8e4de] rounded-xl p-3 bg-white border-l-[3px]'
      style={{ borderLeftColor: categoryColor }}
    >
      <div className='flex items-center justify-between mb-1.5'>
        <div className='flex items-center gap-1.5'>
          <span
            className='text-[10px] font-semibold tracking-wide text-white py-0.5 px-1.5 rounded'
            style={{ backgroundColor: categoryColor }}
          >
            {categoryLabel}
          </span>
          <span className='text-[10px] font-semibold tracking-wide text-[#8b8680] bg-[#f1efe9] py-0.5 px-1.5 rounded'>
            System
          </span>
        </div>
        <span className='text-[11px] text-[#8b8680] flex items-center gap-1'>
          <span className='text-[10px]'>&#9201;</span>
          {formatCompactRelativeTime(system.updatedAt)}
        </span>
      </div>

      <h3 className='font-semibold text-[#2f2b27] text-sm mb-2 leading-snug'>{system.name}</h3>

      {isStale && (
        <div className='flex items-center gap-2 mb-2 text-xs'>
          <span>&#9888;&#65039;</span>
        </div>
      )}

      <div className='flex gap-2'>
        <button
          type='button'
          className='flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#2f2b27] text-[#faf9f7] cursor-pointer border-none transition-all duration-200 hover:bg-[#4a4540]'
          onClick={onResume}
        >
          {getActionLabel(stage)}
        </button>
        <button
          type='button'
          className='flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-200 hover:border-[#d0ccc5] hover:text-[#2f2b27]'
          onClick={onAbandon}
        >
          Uproot
        </button>
      </div>
    </div>
  )
}
