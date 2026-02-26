import React from 'react'
import { getCategoryInfo } from '@lifebuild/shared'
import type { SystemTaskTemplate } from '@lifebuild/shared/schema'

/**
 * Format a date as relative time (e.g., "Today", "In 3 days", "2 days overdue")
 */
export function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Not scheduled'

  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return '1 day overdue'
  if (diffDays > 1) return `In ${diffDays} days`
  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`

  return 'Today'
}

/**
 * Format a date as a human-readable string or "Never"
 */
export function formatLastGenerated(date: Date | null): string {
  if (!date) return 'Never'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays} days ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Lifecycle state badge component
 */
export const LifecycleStateBadge: React.FC<{ state: string }> = ({ state }) => {
  const defaultStyle = { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Planning' }
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    planted: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Planted' },
    hibernating: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Hibernating' },
    uprooted: { bg: 'bg-stone-200', text: 'text-stone-500', label: 'Uprooted' },
    planning: defaultStyle,
  }

  const style = styles[state] ?? defaultStyle
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  )
}

/**
 * Category badge component (colored pill)
 */
export const CategoryBadge: React.FC<{ category: string | null }> = ({ category }) => {
  const info = getCategoryInfo(category as Parameters<typeof getCategoryInfo>[0])
  if (!info) return <span className='text-xs text-[#8b8680]'>No category</span>

  return (
    <span
      className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white'
      style={{ backgroundColor: info.colorHex }}
    >
      {info.name}
    </span>
  )
}

export type HealthColor = 'green' | 'yellow' | 'red' | 'neutral'

export interface HealthStatus {
  color: HealthColor
  detail: string
}

function getCycleDurationMs(cadence: string): number {
  const DAY = 24 * 60 * 60 * 1000
  switch (cadence) {
    case 'daily':
      return DAY
    case 'weekly':
      return 7 * DAY
    case 'monthly':
      return 30 * DAY
    case 'quarterly':
      return 90 * DAY
    case 'annually':
      return 365 * DAY
    default:
      return 7 * DAY
  }
}

/**
 * Compute snapshot-based health status for a system.
 * Health reflects current obligations, not historical performance.
 */
export function computeSystemHealth(
  templates: readonly SystemTaskTemplate[],
  lifecycleState: string
): HealthStatus {
  if (lifecycleState === 'hibernating') {
    return { color: 'neutral', detail: 'System is hibernating' }
  }
  if (lifecycleState === 'uprooted') {
    return { color: 'neutral', detail: 'System is uprooted' }
  }
  if (lifecycleState === 'planning') {
    return { color: 'neutral', detail: 'System is still being planned' }
  }

  if (templates.length === 0) {
    return { color: 'green', detail: 'No templates configured' }
  }

  const now = Date.now()
  let overdueCount = 0
  let significantlyOverdueCount = 0

  for (const template of templates) {
    if (template.nextGenerateAt === null) continue
    const dueTime = template.nextGenerateAt.getTime()
    if (dueTime >= now) continue

    overdueCount++
    const cycleDuration = getCycleDurationMs(template.cadence)
    if (now - dueTime > cycleDuration) {
      significantlyOverdueCount++
    }
  }

  if (significantlyOverdueCount > 0) {
    const plural = significantlyOverdueCount === 1 ? 'template' : 'templates'
    return {
      color: 'red',
      detail: `${significantlyOverdueCount} ${plural} significantly overdue`,
    }
  }

  if (overdueCount > 0) {
    const plural = overdueCount === 1 ? 'template' : 'templates'
    return { color: 'yellow', detail: `${overdueCount} ${plural} overdue` }
  }

  return { color: 'green', detail: 'All obligations met' }
}

export const CADENCE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
] as const
