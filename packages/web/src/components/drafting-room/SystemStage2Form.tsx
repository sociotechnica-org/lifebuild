import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useQuery } from '../../livestore-compat.js'
import { events, type SystemCadence, type SystemTaskTemplate } from '@lifebuild/shared/schema'
import { getSystemById$, getSystemTaskTemplates$ } from '@lifebuild/shared/queries'
import { type ProjectCategory, getCategoryInfo, computeNextGenerateAt } from '@lifebuild/shared'
import { useAuth } from '../../contexts/AuthContext.js'
import { generateRoute } from '../../constants/routes.js'
import { SystemStageWizard, type SystemWizardStage } from './SystemStageWizard.js'
import { usePostHog } from '../../lib/analytics.js'

/**
 * Cadence options for task templates
 */
const CADENCE_OPTIONS: { value: SystemCadence; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
]

/**
 * Local template state for editing before committing
 */
interface LocalTemplate {
  /** Unique local key for React rendering */
  localKey: string
  /** DB id if this template already exists in the store */
  dbId: string | null
  title: string
  description: string
  cadence: SystemCadence
  /** Whether this template has been modified from its DB state */
  isDirty: boolean
  /** Whether this template was marked for deletion */
  isDeleted: boolean
}

/**
 * Mid-cycle override entry for a template
 */
interface MidCycleOverride {
  localKey: string
  templateTitle: string
  cadence: SystemCadence
  lastDate: string // ISO date string for date input
}

function createEmptyTemplate(): LocalTemplate {
  return {
    localKey: crypto.randomUUID(),
    dbId: null,
    title: '',
    description: '',
    cadence: 'weekly',
    isDirty: false,
    isDeleted: false,
  }
}

function dbTemplateToLocal(t: SystemTaskTemplate): LocalTemplate {
  return {
    localKey: t.id,
    dbId: t.id,
    title: t.title,
    description: t.description ?? '',
    cadence: t.cadence as SystemCadence,
    isDirty: false,
    isDeleted: false,
  }
}

export const SystemStage2Form: React.FC = () => {
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
  const [purposeStatement, setPurposeStatement] = useState('')
  const [templates, setTemplates] = useState<LocalTemplate[]>([createEmptyTemplate()])
  const [initialized, setInitialized] = useState(false)
  const [showMidCycle, setShowMidCycle] = useState(false)
  const [midCycleOverrides, setMidCycleOverrides] = useState<MidCycleOverride[]>([])

  // Track the last saved purpose statement to avoid unnecessary auto-saves
  const lastSavedPurpose = useRef<string>('')

  // Load existing data from system when available
  useEffect(() => {
    if (system && !initialized) {
      setPurposeStatement(system.purposeStatement ?? '')
      lastSavedPurpose.current = system.purposeStatement ?? ''
      setInitialized(true)
    }
  }, [system, initialized])

  // Load existing templates from DB when available
  useEffect(() => {
    if (existingTemplates && existingTemplates.length > 0 && initialized) {
      // Only re-initialize if we haven't loaded them yet
      setTemplates(prev => {
        // Check if we've already loaded these templates (avoid re-initialization)
        const existingDbIds = new Set(prev.filter(t => t.dbId).map(t => t.dbId))
        const newDbIds = new Set(existingTemplates.map(t => t.id))

        // If the sets match, don't reinitialize
        if (
          existingDbIds.size === newDbIds.size &&
          [...existingDbIds].every(id => newDbIds.has(id!))
        ) {
          return prev
        }

        const loaded = existingTemplates.map(dbTemplateToLocal)
        return loaded.length > 0 ? loaded : [createEmptyTemplate()]
      })
    }
  }, [existingTemplates, initialized])

  // Determine max accessible stage (Stage 2 is the current form)
  const maxAccessibleStage: SystemWizardStage = 2

  // Validation
  const activeTemplates = templates.filter(t => !t.isDeleted)
  const hasPurpose = purposeStatement.trim().length > 0
  const hasValidTemplate = activeTemplates.some(t => t.title.trim().length > 0 && t.cadence)
  const isComplete = hasPurpose && hasValidTemplate

  /**
   * Auto-save purpose statement on blur via systemUpdated event
   */
  const savePurposeStatement = useCallback(() => {
    if (!systemId) return
    const trimmed = purposeStatement.trim()
    if (trimmed === lastSavedPurpose.current) return

    store.commit(
      events.systemUpdated({
        id: systemId,
        updates: { purposeStatement: trimmed || undefined },
        updatedAt: new Date(),
        actorId: user?.id,
      })
    )
    lastSavedPurpose.current = trimmed
  }, [systemId, purposeStatement, store, user?.id])

  /**
   * Template CRUD operations (local state only -- committed on Continue)
   */
  const addTemplate = () => {
    setTemplates(prev => [...prev, createEmptyTemplate()])
  }

  const updateTemplate = (localKey: string, updates: Partial<LocalTemplate>) => {
    setTemplates(prev =>
      prev.map(t => (t.localKey === localKey ? { ...t, ...updates, isDirty: true } : t))
    )
  }

  const deleteTemplate = (localKey: string) => {
    const template = templates.find(t => t.localKey === localKey)
    if (!template) return

    // If only one active template remains, confirm before deleting
    if (activeTemplates.length <= 1) {
      if (!window.confirm('This is the last template. Remove it?')) return
    }

    if (template.dbId) {
      // Mark as deleted (will be committed on Continue)
      setTemplates(prev => prev.map(t => (t.localKey === localKey ? { ...t, isDeleted: true } : t)))
    } else {
      // Remove local-only template immediately
      setTemplates(prev => {
        const filtered = prev.filter(t => t.localKey !== localKey)
        return filtered.length > 0 ? filtered : [createEmptyTemplate()]
      })
    }
  }

  /**
   * Mid-cycle flow
   */
  const openMidCycle = () => {
    // Initialize overrides from active templates that have a DB id
    const overrides: MidCycleOverride[] = activeTemplates
      .filter(t => t.dbId || t.title.trim().length > 0)
      .map(t => ({
        localKey: t.localKey,
        templateTitle: t.title || 'Untitled template',
        cadence: t.cadence,
        lastDate: '',
      }))
    setMidCycleOverrides(overrides)
    setShowMidCycle(true)
  }

  const updateMidCycleDate = (localKey: string, date: string) => {
    setMidCycleOverrides(prev =>
      prev.map(o => (o.localKey === localKey ? { ...o, lastDate: date } : o))
    )
  }

  const confirmMidCycle = () => {
    if (!systemId) return

    // Only include overrides that have a date set and a matching DB template
    const validOverrides = midCycleOverrides
      .filter(o => o.lastDate)
      .map(o => {
        const template = templates.find(t => t.localKey === o.localKey)
        const templateId = template?.dbId
        if (!templateId) return null
        const lastDate = new Date(o.lastDate)
        return {
          templateId,
          lastGeneratedAt: lastDate,
          nextGenerateAt: computeNextGenerateAt(o.cadence, lastDate),
        }
      })
      .filter(Boolean) as Array<{
      templateId: string
      lastGeneratedAt: Date
      nextGenerateAt: Date
    }>

    if (validOverrides.length > 0) {
      store.commit(
        events.systemMidCycleUpdated({
          id: systemId,
          templateOverrides: validOverrides,
          midCycleUpdatedAt: new Date(),
          actorId: user?.id,
        })
      )
    }

    setShowMidCycle(false)
  }

  /**
   * Handle "Save & Exit" -- save purpose statement only, return to Drafting Room
   */
  const handleExit = () => {
    savePurposeStatement()
    navigate(generateRoute.draftingRoom())
  }

  /**
   * Handle "Continue to Stage 3" -- validate, commit templates, advance
   */
  const handleContinue = () => {
    if (!isComplete || !systemId) return

    const now = new Date()

    // 1. Save purpose statement
    savePurposeStatement()

    // 2. Process templates
    for (const template of templates) {
      if (template.isDeleted && template.dbId) {
        // Remove deleted DB templates
        store.commit(
          events.systemTaskTemplateRemoved({
            id: template.dbId,
            removedAt: now,
            actorId: user?.id,
          })
        )
      } else if (!template.isDeleted && template.title.trim()) {
        if (!template.dbId) {
          // Add new template
          store.commit(
            events.systemTaskTemplateAdded({
              id: crypto.randomUUID(),
              systemId,
              title: template.title.trim(),
              description: template.description.trim() || undefined,
              cadence: template.cadence,
              position: activeTemplates.indexOf(template),
              createdAt: now,
              actorId: user?.id,
            })
          )
        } else if (template.isDirty) {
          // Update modified existing template
          store.commit(
            events.systemTaskTemplateUpdated({
              id: template.dbId,
              updates: {
                title: template.title.trim(),
                description: template.description.trim() || undefined,
                cadence: template.cadence,
                position: activeTemplates.indexOf(template),
              },
              updatedAt: now,
              actorId: user?.id,
            })
          )
        }
      }
    }

    posthog?.capture('system_stage_completed', { stage: 2, systemId })

    // 3. Navigate to Stage 3
    navigate(generateRoute.systemStage3(systemId))
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

  return (
    <div className='flex items-start justify-center min-h-[calc(100vh-200px)] py-8'>
      <div className='bg-white rounded-2xl border border-[#e8e4de] shadow-sm p-6 w-full max-w-2xl'>
        {/* Wizard Navigation */}
        {systemId && (
          <SystemStageWizard
            systemId={systemId}
            currentStage={2}
            maxAccessibleStage={maxAccessibleStage}
          />
        )}

        {/* Header */}
        <div className='mb-4'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-xs font-semibold text-[#8b8680] bg-[#f1efe9] px-2 py-0.5 rounded'>
              System
            </span>
          </div>
          <h1 className="font-['Source_Serif_4',Georgia,serif] text-2xl font-bold text-[#2f2b27]">
            Stage 2: Scope
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

        {/* Form Fields */}
        <div className='flex flex-col gap-5'>
          {/* Purpose Statement */}
          <div>
            <label className='block text-sm font-semibold text-[#2f2b27] mb-1.5'>
              What does this system maintain or enable?
              <span className='text-red-500 ml-0.5'>*</span>
            </label>
            <textarea
              className='w-full border border-[#e8e4de] rounded-lg py-2.5 px-3 text-sm text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] placeholder:text-[#8b8680] resize-y min-h-[80px]'
              placeholder='e.g., Keeps the household fed and grocery spending predictable'
              value={purposeStatement}
              onChange={e => setPurposeStatement(e.target.value)}
              onBlur={savePurposeStatement}
              rows={3}
            />
          </div>

          {/* Recurring Task Templates */}
          <div>
            <label className='block text-sm font-semibold text-[#2f2b27] mb-1.5'>
              Recurring Task Templates
              <span className='text-red-500 ml-0.5'>*</span>
              <span className='font-normal text-[#8b8680] ml-1'>(at least one)</span>
            </label>

            <div className='flex flex-col gap-3'>
              {activeTemplates.map((template, index) => (
                <div
                  key={template.localKey}
                  className='border border-[#e8e4de] rounded-lg p-3 bg-[#faf9f7]'
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='text-xs font-semibold text-[#8b8680]'>
                      Template {index + 1}
                    </span>
                  </div>

                  {/* Title and Cadence on same row */}
                  <div className='flex gap-2 mb-2'>
                    <input
                      type='text'
                      className='flex-1 border border-[#e8e4de] rounded-lg py-2 px-3 text-sm text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] placeholder:text-[#8b8680] bg-white'
                      placeholder='Task title'
                      value={template.title}
                      onChange={e => updateTemplate(template.localKey, { title: e.target.value })}
                    />
                    <select
                      className='border border-[#e8e4de] rounded-lg py-2 px-3 text-sm text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] bg-white min-w-[120px]'
                      value={template.cadence}
                      onChange={e =>
                        updateTemplate(template.localKey, {
                          cadence: e.target.value as SystemCadence,
                        })
                      }
                    >
                      {CADENCE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className='flex gap-2'>
                    <input
                      type='text'
                      className='flex-1 border border-[#e8e4de] rounded-lg py-2 px-3 text-sm text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] placeholder:text-[#8b8680] bg-white'
                      placeholder='Description (optional)'
                      value={template.description}
                      onChange={e =>
                        updateTemplate(template.localKey, {
                          description: e.target.value,
                        })
                      }
                    />
                    <button
                      type='button'
                      className='p-2 text-[#8b8680] hover:text-red-500 transition-colors cursor-pointer'
                      onClick={() => deleteTemplate(template.localKey)}
                      title='Delete template'
                      aria-label={`Delete template ${index + 1}`}
                    >
                      <svg
                        className='w-4 h-4'
                        viewBox='0 0 16 16'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='1.5'
                      >
                        <path d='M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9' />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* Add template button */}
              <button
                type='button'
                className='w-full py-2 px-4 rounded-lg text-sm font-medium border border-dashed border-[#d0ccc5] text-[#8b8680] cursor-pointer transition-all duration-200 hover:border-[#2f2b27] hover:text-[#2f2b27] bg-transparent'
                onClick={addTemplate}
              >
                + Add task template
              </button>
            </div>
          </div>

          {/* Mid-cycle button */}
          {!showMidCycle && (
            <button
              type='button'
              className='text-left text-xs text-[#8b8680] underline cursor-pointer hover:text-[#2f2b27] transition-colors bg-transparent border-none p-0'
              onClick={openMidCycle}
            >
              I'm already doing this -- update the start date
            </button>
          )}

          {/* Mid-cycle panel */}
          {showMidCycle && (
            <div className='border border-[#e8e4de] rounded-lg p-4 bg-[#faf9f7]'>
              <h3 className='text-sm font-semibold text-[#2f2b27] mb-1'>Update Start Dates</h3>
              <p className='text-xs text-[#8b8680] mb-3'>
                When did you last do each of these tasks? This will set the next due date based on
                the cadence.
              </p>

              <div className='flex flex-col gap-2'>
                {midCycleOverrides.map(override => (
                  <div key={override.localKey} className='flex items-center gap-2'>
                    <span className='flex-1 text-sm text-[#2f2b27] truncate'>
                      {override.templateTitle}
                    </span>
                    <span className='text-xs text-[#8b8680]'>{override.cadence}</span>
                    <input
                      type='date'
                      className='border border-[#e8e4de] rounded-lg py-1.5 px-2 text-sm text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] bg-white'
                      value={override.lastDate}
                      onChange={e => updateMidCycleDate(override.localKey, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className='flex gap-2 mt-3'>
                <button
                  type='button'
                  className='py-1.5 px-3 rounded-lg text-xs font-medium border border-[#e8e4de] text-[#8b8680] cursor-pointer hover:border-[#d0ccc5] hover:text-[#2f2b27] bg-transparent transition-colors'
                  onClick={() => setShowMidCycle(false)}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className='py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#2f2b27] text-[#faf9f7] cursor-pointer border-none hover:bg-[#4a4540] transition-colors'
                  onClick={confirmMidCycle}
                >
                  Confirm Dates
                </button>
              </div>
            </div>
          )}
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
            className='flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold bg-[#2f2b27] text-[#faf9f7] cursor-pointer border-none transition-all duration-200 hover:bg-[#4a4540] disabled:opacity-50 disabled:cursor-not-allowed'
            onClick={handleContinue}
            disabled={!isComplete}
          >
            Continue to Stage 3
          </button>
        </div>
      </div>
    </div>
  )
}
