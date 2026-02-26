import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useQuery } from '../../livestore-compat.js'
import { events, type SystemTaskTemplate } from '@lifebuild/shared/schema'
import { getSystemById$, getSystemTaskTemplates$ } from '@lifebuild/shared/queries'
import { type ProjectCategory, getCategoryInfo, computeNextGenerateAt } from '@lifebuild/shared'
import { useAuth } from '../../contexts/AuthContext.js'
import { generateRoute } from '../../constants/routes.js'
import { SystemStageWizard } from './SystemStageWizard.js'
import { usePostHog } from '../../lib/analytics.js'

/**
 * System Stage 3 (Detail) form.
 *
 * This is the final step before planting a system. It provides two optional
 * freeform note fields (health notes and delegation notes) and the primary
 * "Plant System" action.
 *
 * Notes are stored by appending structured sections to the system's description
 * field via systemUpdated. This avoids adding new schema columns for what are
 * essentially lightweight annotations.
 */

/** Section markers used to persist notes inside the description field. */
const HEALTH_NOTES_MARKER = '## Health Notes'
const DELEGATION_NOTES_MARKER = '## Delegation Notes'

/**
 * Extract a section's content from a description string using a marker.
 * Returns the text between the marker and the next marker (or end of string).
 */
function extractSection(description: string, marker: string): string {
  const idx = description.indexOf(marker)
  if (idx === -1) return ''

  const start = idx + marker.length
  // Find the next section marker (## prefix on its own line)
  const rest = description.slice(start)
  const nextMarker = rest.search(/\n## /)
  const content = nextMarker === -1 ? rest : rest.slice(0, nextMarker)
  return content.trim()
}

/**
 * Build the updated description by combining the original user description
 * (everything before our markers) with the optional note sections.
 */
function buildDescription(
  originalDescription: string | null,
  healthNotes: string,
  delegationNotes: string
): string | undefined {
  // Strip any existing note sections from the original description
  let base = originalDescription ?? ''
  const healthIdx = base.indexOf(HEALTH_NOTES_MARKER)
  const delegationIdx = base.indexOf(DELEGATION_NOTES_MARKER)
  const firstMarker = Math.min(
    healthIdx === -1 ? Infinity : healthIdx,
    delegationIdx === -1 ? Infinity : delegationIdx
  )
  if (firstMarker !== Infinity) {
    base = base.slice(0, firstMarker).trimEnd()
  }

  const sections: string[] = []
  if (base) sections.push(base)
  if (healthNotes.trim()) {
    sections.push(`${HEALTH_NOTES_MARKER}\n${healthNotes.trim()}`)
  }
  if (delegationNotes.trim()) {
    sections.push(`${DELEGATION_NOTES_MARKER}\n${delegationNotes.trim()}`)
  }

  return sections.length > 0 ? sections.join('\n\n') : undefined
}

export const SystemStage3Form: React.FC = () => {
  const navigate = useNavigate()
  const { systemId } = useParams<{ systemId: string }>()
  const { store } = useStore()
  const { user } = useAuth()
  const posthog = usePostHog()

  // Load existing system
  const systemQuery = useMemo(() => getSystemById$(systemId ?? ''), [systemId])
  const systemResults = useQuery(systemQuery)
  const system = systemResults?.[0] ?? null

  // Load existing task templates
  const templatesQuery = useMemo(() => getSystemTaskTemplates$(systemId ?? ''), [systemId])
  const existingTemplates = useQuery(templatesQuery) as SystemTaskTemplate[]

  // Form state
  const [healthNotes, setHealthNotes] = useState('')
  const [delegationNotes, setDelegationNotes] = useState('')
  const [initialized, setInitialized] = useState(false)

  // Track last saved values to avoid unnecessary auto-saves
  const lastSavedHealth = useRef('')
  const lastSavedDelegation = useRef('')

  // Load existing notes from system description
  useEffect(() => {
    if (system && !initialized) {
      const desc = system.description ?? ''
      const health = extractSection(desc, HEALTH_NOTES_MARKER)
      const delegation = extractSection(desc, DELEGATION_NOTES_MARKER)
      setHealthNotes(health)
      setDelegationNotes(delegation)
      lastSavedHealth.current = health
      lastSavedDelegation.current = delegation
      setInitialized(true)
    }
  }, [system, initialized])

  /**
   * Save notes to the system's description field.
   * Called on blur and before planting.
   */
  const saveNotes = useCallback(
    (overrideHealth?: string, overrideDelegation?: string) => {
      if (!systemId || !system) return

      const currentHealth = overrideHealth ?? healthNotes
      const currentDelegation = overrideDelegation ?? delegationNotes

      // Skip if nothing changed
      if (
        currentHealth.trim() === lastSavedHealth.current &&
        currentDelegation.trim() === lastSavedDelegation.current
      ) {
        return
      }

      const newDescription = buildDescription(system.description, currentHealth, currentDelegation)

      store.commit(
        events.systemUpdated({
          id: systemId,
          updates: { description: newDescription ?? null },
          updatedAt: new Date(),
          actorId: user?.id,
        })
      )

      lastSavedHealth.current = currentHealth.trim()
      lastSavedDelegation.current = currentDelegation.trim()
    },
    [systemId, system, healthNotes, delegationNotes, store, user?.id]
  )

  /**
   * Plant the system.
   * 1. Save any notes to the description
   * 2. Commit systemPlanted
   * 3. Set nextGenerateAt on templates that don't have one
   * 4. Navigate to the Life Map
   */
  const handlePlant = () => {
    if (!systemId) return

    const now = new Date()

    // 1. Save notes
    saveNotes()

    // 2. Plant the system
    store.commit(
      events.systemPlanted({
        id: systemId,
        plantedAt: now,
        actorId: user?.id,
      })
    )

    // 3. Set nextGenerateAt on templates that don't have one yet
    if (existingTemplates && existingTemplates.length > 0) {
      const templatesNeedingSchedule = existingTemplates.filter(t => !t.nextGenerateAt)
      if (templatesNeedingSchedule.length > 0) {
        const overrides = templatesNeedingSchedule.map(t => ({
          templateId: t.id,
          lastGeneratedAt: now,
          nextGenerateAt: computeNextGenerateAt(
            t.cadence as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually',
            now
          ),
        }))

        store.commit(
          events.systemMidCycleUpdated({
            id: systemId,
            templateOverrides: overrides,
            midCycleUpdatedAt: now,
            actorId: user?.id,
          })
        )
      }
    }

    posthog?.capture('system_planted', { systemId })

    // 4. Navigate to the Life Map
    navigate(generateRoute.lifeMap())
  }

  /**
   * Save & Exit -- save notes without planting, return to Drafting Room.
   */
  const handleExit = () => {
    saveNotes()
    navigate(generateRoute.draftingRoom())
  }

  if (!system) {
    return (
      <div className='flex items-start justify-center min-h-[calc(100vh-200px)] py-8'>
        <div className='bg-white rounded-2xl border border-[#e8e4de] shadow-sm p-6 w-full max-w-2xl'>
          <p>System not found</p>
        </div>
      </div>
    )
  }

  // Summary of templates for display
  const templateSummary = existingTemplates ?? []

  return (
    <div className='flex items-start justify-center min-h-[calc(100vh-200px)] py-8'>
      <div className='bg-white rounded-2xl border border-[#e8e4de] shadow-sm p-6 w-full max-w-2xl'>
        {/* Wizard Navigation */}
        {systemId && (
          <SystemStageWizard systemId={systemId} currentStage={3} maxAccessibleStage={3} />
        )}

        {/* Header */}
        <div className='mb-4'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-xs font-semibold text-[#8b8680] bg-[#f1efe9] px-2 py-0.5 rounded'>
              System
            </span>
          </div>
          <h1 className="font-['Source_Serif_4',Georgia,serif] text-2xl font-bold text-[#2f2b27]">
            Stage 3: Detail
          </h1>
        </div>

        {/* System Title and Category */}
        <div className='flex items-center justify-between gap-2 pb-4 mb-4 border-b border-[#e8e4de]'>
          <div className='font-semibold text-lg text-[#2f2b27]'>
            {system.name || 'Untitled System'}
          </div>
          {system.category && getCategoryInfo(system.category as ProjectCategory) && (
            <span
              className='text-[10px] font-semibold tracking-wide text-white py-0.5 px-1.5 rounded'
              style={{
                backgroundColor: getCategoryInfo(system.category as ProjectCategory)!.colorHex,
              }}
            >
              {getCategoryInfo(system.category as ProjectCategory)!.name}
            </span>
          )}
        </div>

        {/* Template Summary (read-only) */}
        {templateSummary.length > 0 && (
          <div className='mb-5'>
            <h3 className='text-sm font-semibold text-[#2f2b27] mb-2'>Task Templates</h3>
            <div className='flex flex-col gap-1.5'>
              {templateSummary.map(t => (
                <div
                  key={t.id}
                  className='flex items-center gap-2 py-1.5 px-3 bg-[#faf9f7] rounded-lg border border-[#e8e4de]'
                >
                  <span className='flex-1 text-sm text-[#2f2b27]'>{t.title}</span>
                  <span className='text-xs text-[#8b8680] capitalize'>{t.cadence}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className='flex flex-col gap-5'>
          {/* Health Notes */}
          <div>
            <label className='block text-sm font-semibold text-[#2f2b27] mb-1.5'>
              What does smooth operation look like for this system?{' '}
              <span className='font-normal text-[#8b8680]'>(Optional)</span>
            </label>
            <textarea
              className='w-full border border-[#e8e4de] rounded-lg py-2.5 px-3 text-sm text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] placeholder:text-[#8b8680] resize-y min-h-[80px]'
              placeholder='e.g., Groceries are bought by Sunday, meals are planned for the week, spending stays under $150'
              value={healthNotes}
              onChange={e => setHealthNotes(e.target.value)}
              onBlur={() => saveNotes()}
              rows={3}
            />
          </div>

          {/* Delegation Notes */}
          <div>
            <label className='block text-sm font-semibold text-[#2f2b27] mb-1.5'>
              Could someone else run this system? Any notes for them?{' '}
              <span className='font-normal text-[#8b8680]'>(Optional)</span>
            </label>
            <textarea
              className='w-full border border-[#e8e4de] rounded-lg py-2.5 px-3 text-sm text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] placeholder:text-[#8b8680] resize-y min-h-[80px]'
              placeholder='e.g., Partner handles the shopping list, kids help with prep on weekends'
              value={delegationNotes}
              onChange={e => setDelegationNotes(e.target.value)}
              onBlur={() => saveNotes()}
              rows={3}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className='flex gap-3 mt-6 pt-4 border-t border-[#e8e4de]'>
          <button
            type='button'
            className='flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-200 hover:border-[#d0ccc5] hover:text-[#2f2b27]'
            onClick={handleExit}
          >
            Save & Exit
          </button>
          <button
            type='button'
            className='flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold text-[#faf9f7] cursor-pointer border-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
            style={{ backgroundColor: '#16a34a' }}
            onMouseEnter={e => {
              if (!(e.currentTarget as HTMLButtonElement).disabled) {
                e.currentTarget.style.backgroundColor = '#15803d'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#16a34a'
            }}
            onClick={handlePlant}
          >
            Plant System
          </button>
        </div>
      </div>
    </div>
  )
}
