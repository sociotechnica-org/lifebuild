import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useQuery } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { getProjectById$ } from '@work-squared/shared/queries'
import {
  PROJECT_CATEGORIES,
  type ProjectCategory,
  type ProjectLifecycleState,
  resolveLifecycleState,
} from '@work-squared/shared'
import { useAuth } from '../../../contexts/AuthContext.js'
import { generateRoute } from '../../../constants/routes.js'
import { StageWizard, type WizardStage } from './StageWizard.js'
import './stage-form.css'

export const Stage1Form: React.FC = () => {
  const navigate = useNavigate()
  const { projectId: urlProjectId } = useParams<{ projectId: string }>()
  const { store } = useStore()
  const { user } = useAuth()

  // Load existing project if editing
  const projectResults = useQuery(getProjectById$(urlProjectId ?? ''))
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

  const isValid = title.trim().length > 0 && category !== null
  const isEditing = !!urlProjectId && !!existingProject

  // Get lifecycle state for max accessible stage calculation
  const lifecycleState: ProjectLifecycleState | null = existingProject
    ? resolveLifecycleState(existingProject.projectLifecycleState, null)
    : null

  // If stage is N, user can access stages 1 through N+1 (since they're transitioning to the next stage)
  const maxAccessibleStage: WizardStage = (() => {
    if (!lifecycleState) return 1
    const stage = lifecycleState.stage ?? 1
    return Math.min(3, Math.max(1, stage + 1)) as WizardStage
  })()

  /**
   * Create or update project
   */
  const saveProject = () => {
    if (!title.trim()) return null

    const projectId = urlProjectId ?? crypto.randomUUID()
    const now = new Date()

    if (isEditing && lifecycleState) {
      // Update existing project - preserve lifecycle state and just update name/description/category
      store.commit(
        events.projectUpdated({
          id: projectId,
          updates: {
            name: title.trim(),
            description: description.trim() || undefined,
            category: category as ProjectCategory,
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
          name: title.trim(),
          description: description.trim() || undefined,
          category: category as ProjectCategory,
          lifecycleState: newLifecycleState,
          createdAt: now,
          actorId: user?.id,
        })
      )
    }

    return projectId
  }

  const handleSaveAndExit = () => {
    if (title.trim()) {
      saveProject()
    }
    navigate(generateRoute.newDraftingRoom())
  }

  const handleContinue = () => {
    if (!isValid) return
    const projectId = saveProject()
    if (projectId) {
      // Update lifecycle to stage 2 before navigating
      const now = new Date()
      const updatedLifecycle: ProjectLifecycleState = {
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
      navigate(generateRoute.newProjectStage2(projectId))
    }
  }

  return (
    <div className='stage-form'>
      <div className='stage-form-card'>
        {/* Wizard Navigation (only show when editing existing project) */}
        {isEditing && urlProjectId && (
          <StageWizard
            projectId={urlProjectId}
            currentStage={1}
            maxAccessibleStage={maxAccessibleStage}
          />
        )}

        {/* Header */}
        <div className='stage-form-header'>
          <h1 className='stage-form-title'>Stage 1: Identifying</h1>
          <p className='stage-form-subtitle'>Quick capture - 2 minutes</p>
        </div>

        {/* Form Fields */}
        <div className='stage-form-fields'>
          {/* Project Title */}
          <div className='stage-form-field'>
            <label className='stage-form-label'>Project Title</label>
            <input
              type='text'
              className='stage-form-input'
              placeholder="What's this project called?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Brief Description */}
          <div className='stage-form-field'>
            <label className='stage-form-label'>Brief Description</label>
            <textarea
              className='stage-form-textarea'
              placeholder="1-2 sentences about what you're trying to do"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Category */}
          <div className='stage-form-field'>
            <label className='stage-form-label'>Category</label>
            <div className='stage-form-category-pills'>
              {PROJECT_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type='button'
                  className={`stage-form-category-pill ${category === cat.value ? 'active' : ''}`}
                  style={
                    category === cat.value
                      ? { backgroundColor: cat.colorHex, borderColor: cat.colorHex, color: '#fff' }
                      : undefined
                  }
                  onClick={() => setCategory(cat.value)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className='stage-form-actions'>
          <button type='button' className='stage-form-btn secondary' onClick={handleSaveAndExit}>
            Save & Exit
          </button>
          <button
            type='button'
            className='stage-form-btn primary'
            onClick={handleContinue}
            disabled={!isValid}
          >
            Continue to Stage 2
          </button>
        </div>
      </div>
    </div>
  )
}
