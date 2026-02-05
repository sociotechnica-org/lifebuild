import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useQuery } from '../../../livestore-compat.js'
import { events } from '@lifebuild/shared/schema'
import { getProjectById$ } from '@lifebuild/shared/queries'
import {
  PROJECT_CATEGORIES,
  type ProjectCategory,
  type ProjectLifecycleState,
  resolveLifecycleState,
} from '@lifebuild/shared'
import { useAuth } from '../../../contexts/AuthContext.js'
import { generateRoute } from '../../../constants/routes.js'
import { StageWizard, type WizardStage } from './StageWizard.js'
import { Tooltip } from '../../ui/Tooltip/Tooltip.js'
import { usePostHog } from '../../../lib/analytics.js'

export const Stage1Form: React.FC = () => {
  const navigate = useNavigate()
  const { projectId: urlProjectId } = useParams<{ projectId: string }>()
  const { store } = useStore()
  const { user } = useAuth()
  const posthog = usePostHog()

  // Load existing project if editing
  const projectQuery = useMemo(() => getProjectById$(urlProjectId ?? ''), [urlProjectId])
  const projectResults = useQuery(projectQuery)
  const existingProject = urlProjectId ? (projectResults?.[0] ?? null) : null

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ProjectCategory | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Load existing data from project when it becomes available
  useEffect(() => {
    if (existingProject && !initialized) {
      setTitle(existingProject.name ?? '')
      setDescription(existingProject.description ?? '')
      setCategory((existingProject.category as ProjectCategory) ?? null)
      setInitialized(true)
    }
  }, [existingProject, initialized])

  const canAdvance = title.trim().length > 0 && category !== null
  const isEditing = !!urlProjectId && !!existingProject

  // Get lifecycle state for max accessible stage calculation
  const lifecycleState: ProjectLifecycleState | null = existingProject
    ? resolveLifecycleState(existingProject.projectLifecycleState, null)
    : null

  // User can only navigate back to stages they've already completed (current stage or earlier)
  const maxAccessibleStage: WizardStage = (() => {
    if (!lifecycleState) return 1
    const stage = lifecycleState.stage ?? 1
    return Math.min(3, Math.max(1, stage)) as WizardStage
  })()

  // Track the project ID for auto-save (created on first save)
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
  const effectiveProjectId = urlProjectId ?? createdProjectId

  /**
   * Auto-save current form state
   * Called on blur of any field or category selection
   */
  const autoSave = (
    overrideTitle?: string,
    overrideDescription?: string,
    overrideCategory?: ProjectCategory | null
  ) => {
    const currentTitle = overrideTitle ?? title
    const currentDescription = overrideDescription ?? description
    const currentCategory = overrideCategory !== undefined ? overrideCategory : category

    // Need at least a title to save
    if (!currentTitle.trim()) return null

    const projectId = effectiveProjectId ?? crypto.randomUUID()
    const now = new Date()

    if (isEditing && lifecycleState) {
      // Update existing project - preserve lifecycle state and just update name/description/category
      store.commit(
        events.projectUpdated({
          id: projectId,
          updates: {
            name: currentTitle.trim(),
            description: currentDescription.trim() || undefined,
            category: currentCategory ?? undefined,
          },
          updatedAt: now,
          actorId: user?.id,
        })
      )
    } else if (effectiveProjectId) {
      // Update already-created project
      store.commit(
        events.projectUpdated({
          id: projectId,
          updates: {
            name: currentTitle.trim(),
            description: currentDescription.trim() || undefined,
            category: currentCategory ?? undefined,
          },
          updatedAt: now,
          actorId: user?.id,
        })
      )
    } else {
      // Create new project with stage 1 lifecycle state
      const newLifecycleState: ProjectLifecycleState = {
        status: 'planning',
        stage: 1,
      }

      store.commit(
        events.projectCreatedV2({
          id: projectId,
          name: currentTitle.trim(),
          description: currentDescription.trim() || undefined,
          category: currentCategory ?? undefined,
          lifecycleState: newLifecycleState,
          createdAt: now,
          actorId: user?.id,
        })
      )
      posthog?.capture('project_created', { category: currentCategory, projectId })
      setCreatedProjectId(projectId)

      // Navigate to the project-specific URL so browser back button works correctly
      // This prevents creating duplicate projects when using browser back button
      navigate(generateRoute.projectStage1(projectId), { replace: true })
    }

    return projectId
  }

  // Handle category selection with auto-save
  const handleCategorySelect = (value: ProjectCategory) => {
    setCategory(value)
    autoSave(undefined, undefined, value)
  }

  const handleExit = () => {
    // Auto-save already handles saving on blur, just navigate
    navigate(generateRoute.draftingRoom())
  }

  const handleContinue = () => {
    if (!canAdvance) return

    // Ensure we have a project ID (auto-save should have created one, but fallback just in case)
    const projectId = effectiveProjectId ?? autoSave()
    if (projectId) {
      // Update lifecycle to stage 2 before navigating, preserving any existing lifecycle data
      const now = new Date()
      const updatedLifecycle: ProjectLifecycleState = {
        ...(lifecycleState ?? {}),
        status: 'planning',
        stage: 2,
      }
      store.commit(
        events.projectLifecycleUpdated({
          projectId,
          lifecycleState: updatedLifecycle,
          updatedAt: now,
          actorId: user?.id,
        })
      )
      posthog?.capture('project_stage_completed', { stage: 1, projectId })
      navigate(generateRoute.projectStage2(projectId))
    }
  }

  return (
    <div className='flex items-start justify-center min-h-[calc(100vh-200px)] py-8'>
      <div className='bg-white rounded-2xl border border-[#e8e4de] shadow-sm p-6 w-full max-w-md'>
        {/* Wizard Navigation (always show for visual consistency) */}
        <StageWizard
          projectId={effectiveProjectId ?? ''}
          currentStage={1}
          maxAccessibleStage={maxAccessibleStage}
        />

        {/* Header */}
        <div className='mb-6'>
          <h1 className="font-['Source_Serif_4',Georgia,serif] text-2xl font-bold text-[#2f2b27]">
            Stage 1: Identify
          </h1>
        </div>

        {/* Form Fields */}
        <div className='flex flex-col gap-5'>
          {/* Project Title */}
          <div>
            <label className='block text-sm font-semibold text-[#2f2b27] mb-1.5'>
              Project Title<span className='text-red-500 ml-0.5'>*</span>
            </label>
            <input
              type='text'
              className='w-full border border-[#e8e4de] rounded-lg py-2.5 px-3 text-sm text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] placeholder:text-[#8b8680]'
              placeholder="What's this project called?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => autoSave()}
              autoFocus
            />
          </div>

          {/* Brief Description */}
          <div>
            <label className='block text-sm font-semibold text-[#2f2b27] mb-1.5'>
              Brief Description <span className='font-normal text-[#8b8680]'>(optional)</span>
            </label>
            <textarea
              className='w-full border border-[#e8e4de] rounded-lg py-2.5 px-3 text-sm text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] placeholder:text-[#8b8680] resize-y min-h-[80px]'
              placeholder='1-2 sentences about what you are trying to do'
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={() => autoSave()}
              rows={3}
            />
          </div>

          {/* Category */}
          <CategorySection category={category} onCategorySelect={handleCategorySelect} />
        </div>

        {/* Footer Actions */}
        <div className='flex gap-3 mt-6 pt-4 border-t border-[#e8e4de]'>
          <button
            type='button'
            className='flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-200 hover:border-[#d0ccc5] hover:text-[#2f2b27]'
            onClick={handleExit}
          >
            Exit
          </button>
          <button
            type='button'
            className='flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold bg-[#2f2b27] text-[#faf9f7] cursor-pointer border-none transition-all duration-200 hover:bg-[#4a4540] disabled:opacity-50 disabled:cursor-not-allowed'
            onClick={handleContinue}
            disabled={!canAdvance}
          >
            Continue to Stage 2
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Category section with tooltips and info popover
 */
interface CategorySectionProps {
  category: ProjectCategory | null
  onCategorySelect: (value: ProjectCategory) => void
}

const CategorySection: React.FC<CategorySectionProps> = ({ category, onCategorySelect }) => {
  const [showInfoPopover, setShowInfoPopover] = useState(false)

  return (
    <div>
      <div className='flex items-center gap-1.5 mb-1.5'>
        <label className='text-sm font-semibold text-[#2f2b27]'>
          Category<span className='text-red-500 ml-0.5'>*</span>
        </label>
        <div className='relative'>
          <button
            type='button'
            className='flex items-center justify-center w-4 h-4 rounded-full border border-[#d0ccc5] text-[#8b8680] text-[10px] font-medium cursor-pointer hover:border-[#2f2b27] hover:text-[#2f2b27] transition-colors'
            onClick={() => setShowInfoPopover(!showInfoPopover)}
            aria-label='Learn about categories'
          >
            i
          </button>
          {showInfoPopover && (
            <>
              {/* Backdrop */}
              <div className='fixed inset-0 z-40' onClick={() => setShowInfoPopover(false)} />
              {/* Popover */}
              <div className='absolute left-0 top-full mt-2 z-50 w-96 bg-white rounded-lg border border-[#e8e4de] shadow-lg p-4'>
                <div className='mb-3'>
                  <h4 className='text-sm font-semibold text-[#2f2b27] mb-1'>Life Categories</h4>
                  <p className='text-xs text-[#8b8680]'>
                    Categories help organize your projects across different areas of life.
                  </p>
                </div>
                <div className='space-y-2'>
                  {PROJECT_CATEGORIES.map(cat => (
                    <div key={cat.value} className='flex items-start gap-2'>
                      <span
                        className='flex-shrink-0 w-2 h-2 rounded-full mt-[10px]'
                        style={{ backgroundColor: cat.colorHex }}
                      />
                      <div>
                        <span className='text-xs font-semibold text-[#2f2b27]'>{cat.name}</span>
                        <span className='text-xs text-[#8b8680]'> — {cat.shortDescription}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className='flex flex-wrap gap-1.5'>
        {PROJECT_CATEGORIES.map(cat => (
          <Tooltip key={cat.value} content={cat.shortDescription}>
            <button
              type='button'
              className={`py-1 px-2.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                category === cat.value
                  ? 'text-white'
                  : 'bg-transparent border-[#e8e4de] text-[#8b8680] hover:border-[#d0ccc5] hover:text-[#2f2b27]'
              }`}
              style={
                category === cat.value
                  ? { backgroundColor: cat.colorHex, borderColor: cat.colorHex, color: '#fff' }
                  : undefined
              }
              onClick={() => onCategorySelect(cat.value)}
            >
              {cat.name}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
