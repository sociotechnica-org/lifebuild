import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { PROJECT_CATEGORIES, type ProjectCategory } from '@work-squared/shared'
import { useAuth } from '../../../contexts/AuthContext.js'
import { generateRoute } from '../../../constants/routes.js'
import './stage-form.css'

interface Stage1FormProps {
  /** Initial data for editing existing project */
  initialData?: {
    id?: string
    title?: string
    description?: string
    category?: ProjectCategory | null
  }
}

export const Stage1Form: React.FC<Stage1FormProps> = ({ initialData }) => {
  const navigate = useNavigate()
  const { store } = useStore()
  const { user } = useAuth()

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [category, setCategory] = useState<ProjectCategory | null>(initialData?.category ?? null)

  const isValid = title.trim().length > 0 && category !== null

  const createProject = () => {
    if (!title.trim()) return null

    const projectId = initialData?.id ?? crypto.randomUUID()
    const now = new Date()

    // Create project with planningStage: 1 and status: 'planning'
    store.commit(
      events.projectCreatedV2({
        id: projectId,
        name: title.trim(),
        description: description.trim() || undefined,
        category: category as any,
        attributes: {
          planningStage: 1,
          status: 'planning',
        } as any,
        createdAt: now,
        actorId: user?.id,
      })
    )

    return projectId
  }

  const handleSaveAndExit = () => {
    if (title.trim()) {
      createProject()
    }
    navigate(generateRoute.newDraftingRoom())
  }

  const handleContinue = () => {
    if (!isValid) return
    const projectId = createProject()
    if (projectId) {
      // TODO: Navigate to Stage 2 with the project ID
      navigate(generateRoute.newDraftingRoom())
    }
  }

  return (
    <div className='stage-form'>
      <div className='stage-form-card'>
        {/* Header */}
        <div className='stage-form-header'>
          <h1 className='stage-form-title'>Stage 1: Identified</h1>
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
