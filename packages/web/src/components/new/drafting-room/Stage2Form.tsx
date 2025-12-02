import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useQuery } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { getProjectById$ } from '@work-squared/shared/queries'
import {
  type ProjectArchetype,
  type ProjectCategory,
  type ProjectLifecycleState,
  type ScaleLevel,
  getCategoryInfo,
  resolveLifecycleState,
} from '@work-squared/shared'
import { useAuth } from '../../../contexts/AuthContext.js'
import { generateRoute } from '../../../constants/routes.js'
import { type ProjectTier } from './DraftingRoom.js'
import { StageWizard, type WizardStage } from './StageWizard.js'
import './stage-form.css'

const ARCHETYPES: { value: ProjectArchetype; label: string; description: string }[] = [
  { value: 'quicktask', label: 'Quick Task', description: 'One-shot, minimal planning' },
  { value: 'discovery', label: 'Discovery Mission', description: 'Research, reduce uncertainty' },
  { value: 'critical', label: 'Critical Response', description: 'Urgent, time-sensitive' },
  { value: 'maintenance', label: 'Maintenance Loop', description: 'Recurring, perpetual' },
  { value: 'systembuild', label: 'System Build', description: 'Infrastructure, automation' },
  { value: 'initiative', label: 'Initiative', description: 'Move life forward, transformative' },
]

const TIERS: { value: ProjectTier; label: string; description: string; color: string }[] = [
  {
    value: 'gold',
    label: 'Gold',
    description: 'Major life-changing initiatives',
    color: '#d8a650',
  },
  {
    value: 'silver',
    label: 'Silver',
    description: 'System builds and capacity work',
    color: '#9ca3af',
  },
  {
    value: 'bronze',
    label: 'Bronze',
    description: 'Quick tasks and maintenance',
    color: '#c48b5a',
  },
]

/**
 * Convert tier to scale level for lifecycle state
 */
function tierToScale(tier: ProjectTier | null): ScaleLevel | undefined {
  if (tier === 'gold') return 'major'
  if (tier === 'bronze') return 'micro'
  return undefined
}

export const Stage2Form: React.FC = () => {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const { store } = useStore()
  const { user } = useAuth()

  // Load existing project (query returns array, get first item)
  const projectResults = useQuery(getProjectById$(projectId ?? ''))
  const project = projectResults?.[0] ?? null

  // Form state - initialized empty, will be populated from project
  const [objectives, setObjectives] = useState('')
  const [deadline, setDeadline] = useState<string>('') // ISO date string for input[type=date]
  const [archetype, setArchetype] = useState<ProjectArchetype | null>(null)
  const [tier, setTier] = useState<ProjectTier | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Get current lifecycle state
  const lifecycleState: ProjectLifecycleState | null = project
    ? resolveLifecycleState(project.projectLifecycleState, null)
    : null

  // Load existing data from lifecycle state when it becomes available
  useEffect(() => {
    if (lifecycleState && !initialized) {
      setObjectives(lifecycleState.objectives ?? '')
      // Convert timestamp to ISO date string for the date input
      if (lifecycleState.deadline) {
        const date = new Date(lifecycleState.deadline)
        setDeadline(date.toISOString().split('T')[0] ?? '')
      } else {
        setDeadline('')
      }
      setArchetype(lifecycleState.archetype ?? null)
      // Only load tier if explicitly saved (stream field), don't derive from archetype
      // This prevents auto-saving a derived tier the user never explicitly chose
      setTier((lifecycleState.stream as ProjectTier) ?? null)
      setInitialized(true)
    }
  }, [lifecycleState, initialized])

  // User can only navigate back to stages they've already completed (current stage or earlier)
  const maxAccessibleStage: WizardStage = (() => {
    if (!lifecycleState) return 2 // Default to stage 2 since we're on this form
    const stage = lifecycleState.stage ?? 1
    // Allow access to current stage, but at least 2 since we're on this form
    return Math.min(3, Math.max(2, stage)) as WizardStage
  })()

  // Check if all required fields are filled to advance to Stage 3
  const hasObjective = objectives.trim().length > 0
  const isComplete = hasObjective && archetype !== null && tier !== null

  /**
   * Save current form state to lifecycle (keeps current stage)
   * Called on blur of any field or selection change
   */
  const autoSave = (
    overrideObjectives?: string,
    overrideDeadline?: string,
    overrideArchetype?: ProjectArchetype | null,
    overrideTier?: ProjectTier | null
  ) => {
    if (!projectId || !lifecycleState) return

    const now = new Date()
    const currentObjectives = overrideObjectives ?? objectives
    const currentDeadline = overrideDeadline ?? deadline
    const currentArchetype = overrideArchetype !== undefined ? overrideArchetype : archetype
    const currentTier = overrideTier !== undefined ? overrideTier : tier

    // Build updated lifecycle state (preserving current stage)
    // Convert ISO date string to timestamp
    const deadlineTimestamp = currentDeadline ? new Date(currentDeadline).getTime() : undefined
    const updatedLifecycle: ProjectLifecycleState = {
      ...lifecycleState,
      objectives: currentObjectives.trim() || undefined,
      deadline: deadlineTimestamp,
      archetype: currentArchetype ?? undefined,
      scale: tierToScale(currentTier),
      stream: currentTier ?? undefined, // Store tier directly for reliable persistence
    }

    store.commit(
      events.projectLifecycleUpdated({
        projectId,
        lifecycleState: updatedLifecycle,
        updatedAt: now,
        actorId: user?.id,
      })
    )
  }

  /**
   * Save and advance to Stage 3 (Drafting)
   * Only called when all required fields are complete
   */
  const saveAndAdvance = () => {
    if (!projectId || !isComplete || !lifecycleState) return

    const now = new Date()

    // Build updated lifecycle state with stage 3
    // Convert ISO date string to timestamp
    const deadlineTimestamp = deadline ? new Date(deadline).getTime() : undefined
    const updatedLifecycle: ProjectLifecycleState = {
      ...lifecycleState,
      stage: 3, // Advance to Stage 3 (Drafting)
      objectives: objectives.trim(),
      deadline: deadlineTimestamp,
      archetype: archetype!,
      scale: tierToScale(tier),
      stream: tier ?? undefined, // Store tier directly for reliable persistence
    }

    store.commit(
      events.projectLifecycleUpdated({
        projectId,
        lifecycleState: updatedLifecycle,
        updatedAt: now,
        actorId: user?.id,
      })
    )
  }

  // Handle archetype selection with auto-save
  const handleArchetypeSelect = (value: ProjectArchetype) => {
    setArchetype(value)
    autoSave(undefined, undefined, value, undefined)
  }

  // Handle tier selection with auto-save
  const handleTierSelect = (value: ProjectTier) => {
    setTier(value)
    autoSave(undefined, undefined, undefined, value)
  }

  const handleExit = () => {
    // Auto-save already handles saving on blur, just navigate
    navigate(generateRoute.newDraftingRoom())
  }

  const handleContinue = () => {
    if (!isComplete || !projectId) return
    // Save and advance to Stage 2
    saveAndAdvance()
    // Navigate to Stage 3
    navigate(generateRoute.newProjectStage3(projectId))
  }

  if (!project) {
    return (
      <div className='stage-form'>
        <div className='stage-form-card'>
          <p>Project not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className='stage-form'>
      <div className='stage-form-card stage-form-card-wide'>
        {/* Wizard Navigation */}
        {projectId && (
          <StageWizard
            projectId={projectId}
            currentStage={2}
            maxAccessibleStage={maxAccessibleStage}
          />
        )}

        {/* Project Title and Category */}
        {project && (
          <div className='stage-form-project-header'>
            <div className='stage-form-project-title'>{project.name || 'Untitled Project'}</div>
            {project.category && getCategoryInfo(project.category as ProjectCategory) && (
              <span
                className='stage-form-category-badge'
                style={{
                  backgroundColor: getCategoryInfo(project.category as ProjectCategory)!.colorHex,
                }}
              >
                {getCategoryInfo(project.category as ProjectCategory)!.name}
              </span>
            )}
          </div>
        )}

        {/* Header */}
        <div className='stage-form-header'>
          <h1 className='stage-form-title'>Stage 2: Scoping</h1>
          <p className='stage-form-subtitle'>Define what success looks like - 10 minutes</p>
        </div>

        {/* Form Fields */}
        <div className='stage-form-fields'>
          {/* Objectives */}
          <div className='stage-form-field'>
            <label className='stage-form-label'>Objectives</label>
            <p className='stage-form-hint'>
              What specific outcomes would mean this project succeeded?
            </p>
            <textarea
              className='stage-form-textarea'
              placeholder='Describe what success looks like for this project...'
              value={objectives}
              onChange={e => setObjectives(e.target.value)}
              onBlur={() => autoSave()}
              rows={3}
            />
          </div>

          {/* Deadline */}
          <div className='stage-form-field'>
            <label className='stage-form-label'>Deadline (Optional)</label>
            <input
              type='date'
              className='stage-form-input'
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              onBlur={() => autoSave()}
            />
          </div>

          {/* Project Archetype */}
          <div className='stage-form-field'>
            <label className='stage-form-label'>Project Archetype</label>
            <div className='stage-form-archetype-list'>
              {ARCHETYPES.map(arch => (
                <button
                  key={arch.value}
                  type='button'
                  className={`stage-form-archetype-card ${archetype === arch.value ? 'active' : ''}`}
                  onClick={() => handleArchetypeSelect(arch.value)}
                >
                  <span className='stage-form-archetype-label'>{arch.label}</span>
                  <span className='stage-form-archetype-desc'>{arch.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Project Tier */}
          <div className='stage-form-field'>
            <label className='stage-form-label'>Project Tier</label>
            <p className='stage-form-hint'>Select the priority tier for this project</p>
            <div className='stage-form-tier-list'>
              {TIERS.map(t => (
                <button
                  key={t.value}
                  type='button'
                  className={`stage-form-tier-card ${tier === t.value ? 'active' : ''}`}
                  style={
                    tier === t.value
                      ? { borderColor: t.color, backgroundColor: `${t.color}15` }
                      : undefined
                  }
                  onClick={() => handleTierSelect(t.value)}
                >
                  <span
                    className='stage-form-tier-label'
                    style={tier === t.value ? { color: t.color } : undefined}
                  >
                    {t.label}
                  </span>
                  <span className='stage-form-tier-desc'>{t.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className='stage-form-actions'>
          <button type='button' className='stage-form-btn secondary' onClick={handleExit}>
            Save & Exit
          </button>
          <button
            type='button'
            className='stage-form-btn primary'
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
