import React, { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useStore } from '../../livestore-compat.js'
import {
  getSystems$,
  getUprootedSystems$,
  getAllSystemTaskTemplates$,
  getSystemHexPositions$,
} from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import { getCategoryInfo, computeNextGenerateAt } from '@lifebuild/shared'
import { generateRoute } from '../../constants/routes.js'
import { useAuth } from '../../contexts/AuthContext.js'
import type { System, SystemTaskTemplate, HexPosition } from '@lifebuild/shared/schema'

/**
 * Format a date as relative time (e.g., "Today", "In 3 days", "2 days overdue")
 */
function formatRelativeTime(date: Date | null): string {
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
function formatLastGenerated(date: Date | null): string {
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
const LifecycleStateBadge: React.FC<{ state: string }> = ({ state }) => {
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
const CategoryBadge: React.FC<{ category: string | null }> = ({ category }) => {
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

/**
 * Single system row in the System Board list
 */
const SystemRow: React.FC<{
  system: System
  templates: readonly SystemTaskTemplate[]
  onHibernate: (system: System) => void
  onResume: (system: System) => void
  onUproot: (system: System) => void
}> = ({ system, templates, onHibernate, onResume, onUproot }) => {
  const templateCount = templates.length

  // Find the earliest nextGenerateAt across all templates
  const nextDue = useMemo(() => {
    const dates = templates.map(t => t.nextGenerateAt).filter((d): d is Date => d !== null)
    if (dates.length === 0) return null
    return new Date(Math.min(...dates.map(d => d.getTime())))
  }, [templates])

  // Find the most recent lastGeneratedAt across all templates
  const lastGenerated = useMemo(() => {
    const dates = templates.map(t => t.lastGeneratedAt).filter((d): d is Date => d !== null)
    if (dates.length === 0) return null
    return new Date(Math.max(...dates.map(d => d.getTime())))
  }, [templates])

  const isOverdue = nextDue !== null && nextDue.getTime() < Date.now()

  return (
    <div className='flex items-center gap-4 p-4 bg-white rounded-xl border border-[#e8e4de] hover:border-[#d0ccc5] transition-all duration-200'>
      {/* System name and badges */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2 mb-1'>
          <h3 className="font-['Source_Serif_4',Georgia,serif] font-semibold text-base text-[#2f2b27] truncate">
            {system.name}
          </h3>
          <LifecycleStateBadge state={system.lifecycleState} />
        </div>
        <div className='flex items-center gap-2'>
          <CategoryBadge category={system.category} />
          {system.purposeStatement && (
            <span className='text-xs text-[#8b8680] truncate max-w-[300px]'>
              {system.purposeStatement}
            </span>
          )}
        </div>
      </div>

      {/* Template count */}
      <div className='text-center min-w-[80px]'>
        <div className='text-sm font-semibold text-[#2f2b27]'>{templateCount}</div>
        <div className='text-[10px] text-[#8b8680] uppercase tracking-wide'>
          {templateCount === 1 ? 'Template' : 'Templates'}
        </div>
      </div>

      {/* Next due */}
      <div className='text-center min-w-[100px]'>
        <div className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-[#2f2b27]'}`}>
          {formatRelativeTime(nextDue)}
        </div>
        <div className='text-[10px] text-[#8b8680] uppercase tracking-wide'>Next Due</div>
      </div>

      {/* Last generated */}
      <div className='text-center min-w-[100px]'>
        <div className='text-sm font-semibold text-[#2f2b27]'>
          {formatLastGenerated(lastGenerated)}
        </div>
        <div className='text-[10px] text-[#8b8680] uppercase tracking-wide'>Last Generated</div>
      </div>

      {/* Action buttons */}
      <div className='flex items-center gap-1'>
        {system.lifecycleState === 'planted' && (
          <>
            <button
              type='button'
              onClick={() => onHibernate(system)}
              className='text-xs py-1 px-2 rounded border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors duration-200'
              title='Pause task generation until you resume'
            >
              Hibernate
            </button>
            <button
              type='button'
              disabled
              className='text-xs py-1 px-2 rounded border border-[#e8e4de] text-[#8b8680] bg-transparent cursor-not-allowed opacity-60'
              title='Coming soon — spawn a Silver optimization project'
            >
              Upgrade
            </button>
          </>
        )}
        {system.lifecycleState === 'hibernating' && (
          <button
            type='button'
            onClick={() => onResume(system)}
            className='text-xs py-1 px-2 rounded border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors duration-200'
            title='Resume task generation with fresh schedule'
          >
            Resume
          </button>
        )}
        {(system.lifecycleState === 'planted' || system.lifecycleState === 'hibernating') && (
          <button
            type='button'
            onClick={() => onUproot(system)}
            className='text-xs py-1 px-2 rounded border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 transition-colors duration-200'
            title='Permanently decommission this system'
          >
            Uproot
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Empty state component shown when no systems are planted
 */
const EmptyState: React.FC = () => (
  <div className='flex flex-col items-center justify-center py-16 text-center'>
    <div className='text-4xl mb-4'>&#x1f331;</div>
    <h2 className="font-['Source_Serif_4',Georgia,serif] text-xl font-semibold text-[#2f2b27] mb-2">
      No systems planted yet
    </h2>
    <p className='text-sm text-[#8b8680] mb-6 max-w-md'>
      Systems are infrastructure that runs indefinitely, generating recurring tasks on a cadence. Go
      to the Drafting Room to plant your first system.
    </p>
    <Link
      to={generateRoute.draftingRoom()}
      className='inline-flex items-center px-4 py-2 rounded-xl bg-[#2f2b27] text-white text-sm font-semibold no-underline hover:bg-[#3f3b37] transition-colors duration-200'
    >
      Go to Drafting Room
    </Link>
  </div>
)

/**
 * SystemBoard - The main System Board room component
 *
 * Displays a list of planted systems with health snapshot, template counts,
 * next-due dates, and last-generated dates. Uprooted systems appear in a
 * collapsible section at the bottom.
 *
 * Lifecycle actions:
 * - Hibernate: planted -> hibernating (pauses task generation)
 * - Resume: hibernating -> planted (resets template schedules from now)
 * - Uproot: planted|hibernating -> uprooted (permanent decommission)
 */
export const SystemBoard: React.FC = () => {
  const { store } = useStore()
  const { user } = useAuth()
  const nonUprootedSystems = (useQuery(getSystems$) ?? []) as System[]
  const uprootedSystems = (useQuery(getUprootedSystems$) ?? []) as System[]
  const allTemplates = (useQuery(getAllSystemTaskTemplates$) ?? []) as SystemTaskTemplate[]
  const systemHexPositions = (useQuery(getSystemHexPositions$) ?? []) as HexPosition[]
  const [showUprooted, setShowUprooted] = useState(false)

  // Filter to only show planted and hibernating systems (not planning)
  const activeSystems = useMemo(
    () =>
      nonUprootedSystems.filter(
        s => s.lifecycleState === 'planted' || s.lifecycleState === 'hibernating'
      ),
    [nonUprootedSystems]
  )

  // Group templates by systemId for efficient lookup
  const templatesBySystem = useMemo(() => {
    const map = new Map<string, SystemTaskTemplate[]>()
    for (const template of allTemplates) {
      const existing = map.get(template.systemId) ?? []
      existing.push(template)
      map.set(template.systemId, existing)
    }
    return map
  }, [allTemplates])

  const actorId = user?.id

  /**
   * Hibernate: planted -> hibernating
   * Pauses task generation until the system is resumed.
   */
  const handleHibernate = useCallback(
    (system: System) => {
      if (!window.confirm(`Hibernate ${system.name}? Tasks will stop generating until you resume.`))
        return

      store.commit(
        events.systemHibernated({
          id: system.id,
          hibernatedAt: new Date(),
          actorId,
        })
      )
    },
    [store, actorId]
  )

  /**
   * Resume: hibernating -> planted
   * Resets all template schedules from now based on their cadence.
   */
  const handleResume = useCallback(
    (system: System) => {
      const now = new Date()
      const systemTemplates = templatesBySystem.get(system.id) ?? []

      // Resume the system
      store.commit(
        events.systemResumed({
          id: system.id,
          resumedAt: now,
          actorId,
        })
      )

      // Reset template schedules via mid-cycle update if there are templates
      if (systemTemplates.length > 0) {
        store.commit(
          events.systemMidCycleUpdated({
            id: system.id,
            templateOverrides: systemTemplates.map(t => ({
              templateId: t.id,
              lastGeneratedAt: now,
              nextGenerateAt: computeNextGenerateAt(t.cadence, now),
            })),
            midCycleUpdatedAt: now,
            actorId,
          })
        )
      }
    },
    [store, actorId, templatesBySystem]
  )

  /**
   * Uproot: planted|hibernating -> uprooted
   * Permanently decommissions the system. Also removes hex position if placed on the map.
   * Already-generated tasks are unaffected.
   */
  const handleUproot = useCallback(
    (system: System) => {
      if (
        !window.confirm(
          `Uproot ${system.name}? This permanently decommissions the system. Tasks already generated are unaffected.`
        )
      )
        return

      const now = new Date()

      store.commit(
        events.systemUprooted({
          id: system.id,
          uprootedAt: now,
          actorId,
        })
      )

      // Remove hex position if one exists for this system
      const hexPosition = systemHexPositions.find(hp => hp.entityId === system.id)
      if (hexPosition) {
        store.commit(
          events.hexPositionRemoved({
            id: hexPosition.id,
            removedAt: now,
            actorId,
          })
        )
      }
    },
    [store, actorId, systemHexPositions]
  )

  const hasAnySystems = activeSystems.length > 0 || uprootedSystems.length > 0

  // Show empty state if no systems exist at all
  if (!hasAnySystems) {
    return (
      <div className='py-4'>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className='py-4'>
      {/* Header */}
      <div className='mb-4'>
        <h1 className="font-['Source_Serif_4',Georgia,serif] text-2xl font-semibold text-[#2f2b27]">
          System Board
        </h1>
        <p className='text-sm text-[#8b8680] mt-1'>Monitor and manage your planted systems</p>
      </div>

      {/* Active systems list (planted + hibernating) */}
      {activeSystems.length > 0 ? (
        <div className='space-y-3'>
          {activeSystems.map(system => (
            <SystemRow
              key={system.id}
              system={system}
              templates={templatesBySystem.get(system.id) ?? []}
              onHibernate={handleHibernate}
              onResume={handleResume}
              onUproot={handleUproot}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Uprooted systems (collapsible) */}
      {uprootedSystems.length > 0 && (
        <div className='mt-8'>
          <button
            type='button'
            onClick={() => setShowUprooted(!showUprooted)}
            className='flex items-center gap-2 text-sm text-[#8b8680] bg-transparent border-none cursor-pointer hover:text-[#2f2b27] transition-colors duration-200 p-0'
          >
            <span
              className='inline-block transition-transform duration-200'
              style={{ transform: showUprooted ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              &#x25B6;
            </span>
            Uprooted ({uprootedSystems.length})
          </button>
          {showUprooted && (
            <div className='mt-3 space-y-3 opacity-60'>
              {uprootedSystems.map(system => (
                <SystemRow
                  key={system.id}
                  system={system}
                  templates={templatesBySystem.get(system.id) ?? []}
                  onHibernate={handleHibernate}
                  onResume={handleResume}
                  onUproot={handleUproot}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
