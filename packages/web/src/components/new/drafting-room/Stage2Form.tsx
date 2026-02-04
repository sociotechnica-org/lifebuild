import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useQuery } from '../../../livestore-compat.js'
import { events } from '@lifebuild/shared/schema'
import { getProjectById$ } from '@lifebuild/shared/queries'
import {
  type ProjectArchetype,
  type ProjectCategory,
  type ProjectLifecycleState,
  type ScaleLevel,
  getCategoryInfo,
  resolveLifecycleState,
} from '@lifebuild/shared'
import { useAuth } from '../../../contexts/AuthContext.js'
import { generateRoute } from '../../../constants/routes.js'
import { type ProjectTier } from './DraftingRoom.js'
import { StageWizard, type WizardStage } from './StageWizard.js'
import { usePostHog } from '../../../lib/analytics.js'

const TIERS: {
  value: ProjectTier
  label: string
  description: string
  secondLine: string
  color: string
}[] = [
  {
    value: 'gold',
    label: 'Initiative',
    description: 'Move your life forward.',
    secondLine: "That project you've been meaning to do.",
    color: '#d8a650',
  },
  {
    value: 'silver',
    label: 'Optimization',
    description: "Improve how you're doing something.",
    secondLine: 'Organization, automation, delegation and/or deletion.',
    color: '#9ca3af',
  },
  {
    value: 'bronze',
    label: 'To-Do',
    description: 'Get it done!',
    secondLine: 'The simple stewardship of daily life.',
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
  const posthog = usePostHog()

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
  const isComplete = hasObjective && tier !== null

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
   * Save and advance to Stage 3 (Detailing)
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
      archetype: archetype ?? undefined,
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

  // Handle tier selection with auto-save
  const handleTierSelect = (value: ProjectTier) => {
    setTier(value)
    autoSave(undefined, undefined, undefined, value)
  }

  const handleExit = () => {
    // Auto-save already handles saving on blur, just navigate
    navigate(generateRoute.draftingRoom())
  }

  const handleContinue = () => {
    if (!isComplete || !projectId) return
    // Save and advance to Stage 3
    saveAndAdvance()
    posthog?.capture('project_stage_completed', { stage: 2, projectId })
    // Navigate to Stage 3
    navigate(generateRoute.projectStage3(projectId))
  }

  if (!project) {
    return (
      <div className='flex items-start justify-center min-h-[calc(100vh-200px)] py-8'>
        <div className='bg-white rounded-2xl border border-[#e8e4de] shadow-sm p-6 w-full max-w-2xl'>
          <p>Project not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex items-start justify-center min-h-[calc(100vh-200px)] py-8'>
      <div className='bg-white rounded-2xl border border-[#e8e4de] shadow-sm p-6 w-full max-w-2xl'>
        {/* Wizard Navigation */}
        {projectId && (
          <StageWizard
            projectId={projectId}
            currentStage={2}
            maxAccessibleStage={maxAccessibleStage}
          />
        )}

        {/* Header */}
        <div className='mb-4'>
          <h1 className="font-['Source_Serif_4',Georgia,serif] text-2xl font-bold text-[#2f2b27]">
            Stage 2: Scope
          </h1>
        </div>

        {/* Project Title and Category */}
        {project && (
          <div className='flex items-center justify-between gap-2 pb-4 mb-4 border-b border-[#e8e4de]'>
            <div className='font-semibold text-lg text-[#2f2b27]'>
              {project.name || 'Untitled Project'}
            </div>
            {project.category && getCategoryInfo(project.category as ProjectCategory) && (
              <span
                className='text-[10px] font-semibold tracking-wide text-white py-0.5 px-1.5 rounded'
                style={{
                  backgroundColor: getCategoryInfo(project.category as ProjectCategory)!.colorHex,
                }}
              >
                {getCategoryInfo(project.category as ProjectCategory)!.name}
              </span>
            )}
          </div>
        )}

        {/* Form Fields */}
        <div className='flex flex-col gap-5'>
          {/* Objectives */}
          <div>
            <label className='block text-sm font-semibold text-[#2f2b27] mb-1.5'>
              Objectives<span className='text-red-500 ml-0.5'>*</span>
            </label>
            <textarea
              className='w-full border border-[#e8e4de] rounded-lg py-2.5 px-3 text-sm text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] placeholder:text-[#8b8680] resize-y min-h-[80px]'
              placeholder='What specific outcomes would mean this project succeeded?'
              value={objectives}
              onChange={e => setObjectives(e.target.value)}
              onBlur={() => autoSave()}
              rows={3}
            />
          </div>

          {/* Deadline */}
          <div>
            <label className='block text-sm font-semibold text-[#2f2b27] mb-1.5'>
              Deadline (Optional)
            </label>
            <input
              type='date'
              className='w-full border border-[#e8e4de] rounded-lg py-2.5 px-3 text-sm text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5]'
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              onBlur={() => autoSave()}
            />
          </div>

          {/* Project Type */}
          <div>
            <label className='block text-sm font-semibold text-[#2f2b27] mb-1.5'>
              Project Type<span className='text-red-500 ml-0.5'>*</span>
            </label>
            <div className='grid grid-cols-3 gap-2'>
              {TIERS.map(t => (
                <button
                  key={t.value}
                  type='button'
                  className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    tier === t.value
                      ? 'border-2'
                      : 'bg-white border-[#e8e4de] hover:border-[#d0ccc5]'
                  }`}
                  style={
                    tier === t.value
                      ? { borderColor: t.color, backgroundColor: `${t.color}15` }
                      : undefined
                  }
                  onClick={() => handleTierSelect(t.value)}
                >
                  <span
                    className='block text-sm font-semibold'
                    style={tier === t.value ? { color: t.color } : { color: '#2f2b27' }}
                  >
                    {t.label}
                  </span>
                  <span className='block text-xs text-[#8b8680]'>{t.description}</span>
                  <span className='block text-xs text-[#8b8680]'>{t.secondLine}</span>
                </button>
              ))}
            </div>
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
