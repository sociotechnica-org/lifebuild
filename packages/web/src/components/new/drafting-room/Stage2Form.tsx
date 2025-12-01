import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useQuery } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { getProjectById$ } from '@work-squared/shared/queries'
import type { ProjectArchetype, PlanningAttributes } from '@work-squared/shared'
import { useAuth } from '../../../contexts/AuthContext.js'
import { generateRoute } from '../../../constants/routes.js'
import { deriveTier, type ProjectTier } from './DraftingRoom.js'
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
  const [deadline, setDeadline] = useState('')
  const [archetype, setArchetype] = useState<ProjectArchetype | null>(null)
  const [tier, setTier] = useState<ProjectTier | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Load existing data from project when it becomes available
  useEffect(() => {
    if (project && !initialized) {
      const attrs = project.attributes as PlanningAttributes | null
      if (attrs) {
        setObjectives(attrs.objectives ?? '')
        setDeadline(attrs.deadline ? String(attrs.deadline) : '')
        setArchetype(attrs.archetype ?? null)
        // Derive tier from existing attributes
        setTier(deriveTier(attrs))
      }
      setInitialized(true)
    }
  }, [project, initialized])

  // Check if all required fields are filled to advance to Stage 2
  const hasObjective = objectives.trim().length > 0
  const isComplete = hasObjective && archetype !== null && tier !== null

  /**
   * Auto-save current form state (keeps in Stage 1)
   * Called on blur of any field or selection change
   */
  const autoSave = (
    overrideObjectives?: string,
    overrideDeadline?: string,
    overrideArchetype?: ProjectArchetype | null,
    overrideTier?: ProjectTier | null
  ) => {
    if (!projectId) return

    const now = new Date()
    const currentObjectives = overrideObjectives ?? objectives
    const currentDeadline = overrideDeadline ?? deadline
    const currentArchetype = overrideArchetype !== undefined ? overrideArchetype : archetype
    const currentTier = overrideTier !== undefined ? overrideTier : tier

    store.commit(
      events.projectAttributesUpdated({
        id: projectId,
        attributes: {
          planningStage: 1, // Keep in Stage 1 until explicitly advanced
          status: 'planning',
          objectives: currentObjectives.trim() || undefined,
          deadline: currentDeadline || undefined,
          archetype: currentArchetype ?? undefined,
          scale: currentTier === 'gold' ? 'major' : currentTier === 'bronze' ? 'micro' : undefined,
        },
        updatedAt: now,
        actorId: user?.id,
      })
    )
  }

  /**
   * Save and advance to Stage 2 (Scoped)
   * Only called when all required fields are complete
   */
  const saveAndAdvance = () => {
    if (!projectId || !isComplete) return

    const now = new Date()

    store.commit(
      events.projectAttributesUpdated({
        id: projectId,
        attributes: {
          planningStage: 2, // Advance to Stage 2
          status: 'planning',
          objectives: objectives.trim(),
          deadline: deadline || undefined,
          archetype: archetype!,
          scale: tier === 'gold' ? 'major' : tier === 'bronze' ? 'micro' : undefined,
        },
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
    if (!isComplete) return
    // Save and advance to Stage 2
    saveAndAdvance()
    // TODO: Navigate to Stage 3
    navigate(generateRoute.newDraftingRoom())
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
        {/* Header */}
        <div className='stage-form-header'>
          <h1 className='stage-form-title'>Stage 2: Scoped</h1>
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
              type='text'
              className='stage-form-input'
              placeholder="e.g., 'before holidays' or 'by June'"
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
