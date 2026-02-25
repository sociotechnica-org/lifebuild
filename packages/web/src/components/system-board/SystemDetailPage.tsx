import React, { useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useStore } from '../../livestore-compat.js'
import {
  getSystemById$,
  getSystemTaskTemplates$,
  getSystemHexPositions$,
} from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import type {
  System,
  SystemTaskTemplate,
  HexPosition,
  SystemCadence,
} from '@lifebuild/shared/schema'
import { computeNextGenerateAt } from '@lifebuild/shared'
import { useAuth } from '../../contexts/AuthContext.js'
import { generateRoute } from '../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'
import { NewUiShell } from '../layout/NewUiShell.js'
import { usePostHog } from '../../lib/analytics.js'
import {
  formatRelativeTime,
  formatLastGenerated,
  LifecycleStateBadge,
  CategoryBadge,
  computeSystemHealth,
  CADENCE_OPTIONS,
  type HealthStatus,
} from './system-utils.js'

const HEALTH_NOTES_MARKER = '## Health Notes'
const DELEGATION_NOTES_MARKER = '## Delegation Notes'

function extractSection(description: string, marker: string): string {
  const idx = description.indexOf(marker)
  if (idx === -1) return ''
  const start = idx + marker.length
  const rest = description.slice(start)
  const nextMarker = rest.search(/\n## /)
  const content = nextMarker === -1 ? rest : rest.slice(0, nextMarker)
  return content.trim()
}

function getBaseDescription(description: string | null): string {
  if (!description) return ''
  const healthIdx = description.indexOf(HEALTH_NOTES_MARKER)
  const delegationIdx = description.indexOf(DELEGATION_NOTES_MARKER)
  const firstMarker = Math.min(
    healthIdx === -1 ? Infinity : healthIdx,
    delegationIdx === -1 ? Infinity : delegationIdx
  )
  if (firstMarker === Infinity) return description.trim()
  return description.slice(0, firstMarker).trimEnd()
}

const HEALTH_COLORS = {
  green: { bg: 'bg-emerald-500', ring: 'ring-emerald-200' },
  yellow: { bg: 'bg-amber-500', ring: 'ring-amber-200' },
  red: { bg: 'bg-red-500', ring: 'ring-red-200' },
  neutral: { bg: 'bg-gray-400', ring: 'ring-gray-200' },
} as const

const HealthIndicator: React.FC<{ health: HealthStatus }> = ({ health }) => {
  const entry = HEALTH_COLORS[health.color]
  return (
    <span className='inline-flex items-center gap-1.5 text-xs text-[#8b8680]'>
      <span className={`w-2.5 h-2.5 rounded-full ${entry.bg} ring-2 ${entry.ring}`} />
      {health.detail}
    </span>
  )
}

const TemplateCard: React.FC<{
  template: SystemTaskTemplate
  onCadenceChange: (templateId: string, newCadence: SystemCadence) => void
}> = ({ template, onCadenceChange }) => {
  const isOverdue =
    template.nextGenerateAt !== null && template.nextGenerateAt.getTime() < Date.now()

  return (
    <div className='flex items-center gap-4 p-4 bg-white rounded-xl border border-[#e8e4de]'>
      <div className='flex-1 min-w-0'>
        <div className='font-semibold text-sm text-[#2f2b27]'>{template.title}</div>
        {template.description && (
          <div className='text-xs text-[#8b8680] mt-0.5'>{template.description}</div>
        )}
      </div>
      <select
        value={template.cadence}
        onChange={e => onCadenceChange(template.id, e.target.value as SystemCadence)}
        className='border border-[#e8e4de] rounded-lg py-1.5 px-2 text-sm bg-white text-[#2f2b27] focus:outline-none focus:ring-2 focus:ring-[#2f2b27]/20'
      >
        {CADENCE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className='text-center min-w-[100px]'>
        <div className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-[#2f2b27]'}`}>
          {formatRelativeTime(template.nextGenerateAt)}
        </div>
        <div className='text-[10px] text-[#8b8680] uppercase tracking-wide'>Next Due</div>
      </div>
      <div className='text-center min-w-[100px]'>
        <div className='text-sm font-semibold text-[#2f2b27]'>
          {formatLastGenerated(template.lastGeneratedAt)}
        </div>
        <div className='text-[10px] text-[#8b8680] uppercase tracking-wide'>Last Generated</div>
      </div>
    </div>
  )
}

export const SystemDetailPage: React.FC = () => {
  const { systemId } = useParams<{ systemId: string }>()
  const resolvedSystemId = systemId ?? '__invalid__'
  const navigate = useNavigate()
  const { store } = useStore()
  const { user } = useAuth()
  const posthog = usePostHog()

  const systemResult = useQuery(getSystemById$(resolvedSystemId))
  const systemRows = systemResult ?? []
  const systemQueryReady = systemResult !== undefined
  const system = (systemRows[0] ?? undefined) as System | undefined

  const templates = (useQuery(getSystemTaskTemplates$(resolvedSystemId)) ??
    []) as SystemTaskTemplate[]
  const systemHexPositions = (useQuery(getSystemHexPositions$) ?? []) as HexPosition[]

  const actorId = user?.id

  useEffect(() => {
    if (system) {
      posthog?.capture('system_viewed', { systemId: resolvedSystemId })
    }
  }, [system?.id])

  const health = useMemo(
    () => computeSystemHealth(templates, system?.lifecycleState ?? 'planning'),
    [templates, system?.lifecycleState]
  )

  const baseDescription = useMemo(
    () => getBaseDescription(system?.description ?? null),
    [system?.description]
  )
  const healthNotes = useMemo(
    () => (system?.description ? extractSection(system.description, HEALTH_NOTES_MARKER) : ''),
    [system?.description]
  )
  const delegationNotes = useMemo(
    () => (system?.description ? extractSection(system.description, DELEGATION_NOTES_MARKER) : ''),
    [system?.description]
  )

  const handleCadenceChange = useCallback(
    (templateId: string, newCadence: SystemCadence) => {
      const template = templates.find(t => t.id === templateId)
      if (!template) return

      const now = new Date()

      store.commit(
        events.systemTaskTemplateUpdated({
          id: templateId,
          updates: { cadence: newCadence },
          updatedAt: now,
          actorId,
        })
      )

      const anchor = template.lastGeneratedAt ?? now
      const newNextGenerateAt = computeNextGenerateAt(newCadence, anchor)

      store.commit(
        events.systemMidCycleUpdated({
          id: resolvedSystemId,
          templateOverrides: [
            {
              templateId,
              lastGeneratedAt: anchor,
              nextGenerateAt: newNextGenerateAt,
            },
          ],
          midCycleUpdatedAt: now,
          actorId,
        })
      )
    },
    [store, templates, resolvedSystemId, actorId]
  )

  const handleHibernate = useCallback(() => {
    if (!system) return
    if (!window.confirm(`Hibernate ${system.name}? Tasks will stop generating until you resume.`))
      return

    store.commit(
      events.systemHibernated({
        id: system.id,
        hibernatedAt: new Date(),
        actorId,
      })
    )
  }, [store, system, actorId])

  const handleResume = useCallback(() => {
    if (!system) return
    const now = new Date()

    store.commit(
      events.systemResumed({
        id: system.id,
        resumedAt: now,
        actorId,
      })
    )

    if (templates.length > 0) {
      store.commit(
        events.systemMidCycleUpdated({
          id: system.id,
          templateOverrides: templates.map(t => ({
            templateId: t.id,
            lastGeneratedAt: now,
            nextGenerateAt: computeNextGenerateAt(t.cadence, now),
          })),
          midCycleUpdatedAt: now,
          actorId,
        })
      )
    }
  }, [store, system, templates, actorId])

  const handleUproot = useCallback(() => {
    if (!system) return
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

    navigate(preserveStoreIdInUrl(generateRoute.systemBoard()))
  }, [store, system, systemHexPositions, actorId, navigate])

  const handleBack = useCallback(() => {
    navigate(preserveStoreIdInUrl(generateRoute.systemBoard()))
  }, [navigate])

  // Loading / error states
  if (!systemId) {
    return (
      <NewUiShell>
        <p className='p-6 text-gray-500'>Invalid system ID</p>
      </NewUiShell>
    )
  }

  if (!systemQueryReady) {
    return (
      <NewUiShell>
        <p className='p-6 text-gray-500'>Loading system...</p>
      </NewUiShell>
    )
  }

  if (!system) {
    return (
      <NewUiShell>
        <div className='p-6'>
          <h1 className='text-xl font-semibold text-gray-900'>System not found</h1>
          <p className='text-gray-500 mt-2'>The requested system ({systemId}) does not exist.</p>
        </div>
      </NewUiShell>
    )
  }

  return (
    <NewUiShell>
      <div className='max-w-4xl mx-auto py-6 px-4'>
        {/* Back button */}
        <button
          type='button'
          onClick={handleBack}
          className='flex items-center gap-1 text-sm text-[#8b8680] bg-transparent border-none cursor-pointer hover:text-[#2f2b27] transition-colors duration-200 p-0 mb-4'
        >
          &#x2190; System Board
        </button>

        {/* Header card */}
        <div className='bg-white rounded-2xl border border-[#e5e2dc] p-6 mb-6'>
          <div className='flex items-start justify-between'>
            <div className='flex-1 min-w-0'>
              <h1 className="font-['Source_Serif_4',Georgia,serif] text-2xl font-bold text-[#2f2b27] truncate">
                {system.name}
              </h1>
              <div className='flex items-center gap-3 mt-2'>
                <CategoryBadge category={system.category} />
                <LifecycleStateBadge state={system.lifecycleState} />
                <HealthIndicator health={health} />
              </div>
              {system.purposeStatement && (
                <p className='mt-3 text-sm text-[#6b6560] leading-relaxed'>
                  {system.purposeStatement}
                </p>
              )}
              {baseDescription && <p className='mt-2 text-sm text-[#8b8680]'>{baseDescription}</p>}
            </div>

            {/* Lifecycle action buttons */}
            <div className='flex items-center gap-2 flex-shrink-0 ml-4'>
              {system.lifecycleState === 'planted' && (
                <button
                  type='button'
                  onClick={handleHibernate}
                  className='text-xs py-1.5 px-3 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors duration-200'
                >
                  Hibernate
                </button>
              )}
              {system.lifecycleState === 'hibernating' && (
                <button
                  type='button'
                  onClick={handleResume}
                  className='text-xs py-1.5 px-3 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors duration-200'
                >
                  Resume
                </button>
              )}
              {(system.lifecycleState === 'planted' || system.lifecycleState === 'hibernating') && (
                <button
                  type='button'
                  onClick={handleUproot}
                  className='text-xs py-1.5 px-3 rounded-lg border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 transition-colors duration-200'
                >
                  Uproot
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Task Templates */}
        <div className='bg-white rounded-2xl border border-[#e5e2dc] p-6 mb-6'>
          <h2 className="font-['Source_Serif_4',Georgia,serif] text-lg font-semibold text-[#2f2b27] mb-4">
            Task Templates
          </h2>
          {templates.length > 0 ? (
            <div className='space-y-3'>
              {templates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onCadenceChange={handleCadenceChange}
                />
              ))}
            </div>
          ) : (
            <p className='text-sm text-[#8b8680]'>
              No task templates configured. Edit this system in the Drafting Room to add templates.
            </p>
          )}
        </div>

        {/* Notes sections */}
        {(healthNotes || delegationNotes) && (
          <div className='bg-white rounded-2xl border border-[#e5e2dc] p-6'>
            {healthNotes && (
              <div className={delegationNotes ? 'mb-6' : ''}>
                <h2 className="font-['Source_Serif_4',Georgia,serif] text-lg font-semibold text-[#2f2b27] mb-2">
                  Health Notes
                </h2>
                <p className='text-sm text-[#6b6560] leading-relaxed whitespace-pre-wrap'>
                  {healthNotes}
                </p>
              </div>
            )}
            {delegationNotes && (
              <div>
                <h2 className="font-['Source_Serif_4',Georgia,serif] text-lg font-semibold text-[#2f2b27] mb-2">
                  Delegation Notes
                </h2>
                <p className='text-sm text-[#6b6560] leading-relaxed whitespace-pre-wrap'>
                  {delegationNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </NewUiShell>
  )
}
