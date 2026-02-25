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
import { computeNextGenerateAt } from '@lifebuild/shared'
import { generateRoute } from '../../constants/routes.js'
import { useAuth } from '../../contexts/AuthContext.js'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'
import type { System, SystemTaskTemplate, HexPosition } from '@lifebuild/shared/schema'
import {
  formatRelativeTime,
  formatLastGenerated,
  LifecycleStateBadge,
  CategoryBadge,
} from './system-utils.js'

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
          <Link
            to={preserveStoreIdInUrl(generateRoute.system(system.id))}
            className="font-['Source_Serif_4',Georgia,serif] font-semibold text-base text-[#2f2b27] truncate no-underline hover:text-[#4a4540]"
          >
            {system.name}
          </Link>
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
/**
 * Embeddable system board section (no page-level header)
 * Used inside the Sorting Room.
 */
export const SystemBoardSection: React.FC = () => {
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
    return <EmptyState />
  }

  return (
    <>
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
    </>
  )
}

/**
 * SystemBoard - Standalone page wrapper (kept for backward compat / stories)
 */
export const SystemBoard: React.FC = () => (
  <div className='py-4'>
    <div className='mb-4'>
      <h1 className="font-['Source_Serif_4',Georgia,serif] text-2xl font-semibold text-[#2f2b27]">
        System Board
      </h1>
      <p className='text-sm text-[#8b8680] mt-1'>Monitor and manage your planted systems</p>
    </div>
    <SystemBoardSection />
  </div>
)
