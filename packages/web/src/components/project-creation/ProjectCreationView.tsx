import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useStore, useQuery } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { getProjectDetails$ } from '@work-squared/shared/queries'
import type {
  PlanningAttributes,
  ProjectArchetype,
  UrgencyLevel,
  ImportanceLevel,
  ComplexityLevel,
  ScaleLevel,
} from '@work-squared/shared'
import { ProjectCreationStage1Presenter } from './ProjectCreationStage1Presenter'
import { ProjectCreationStage2Presenter } from './ProjectCreationStage2Presenter'
import { PROJECT_CATEGORIES } from '@work-squared/shared'

/**
 * Auto-suggest project archetype based on traits
 * Based on the Life Squared glossary logic
 */
function suggestArchetype(
  urgency: UrgencyLevel,
  importance: ImportanceLevel,
  complexity: ComplexityLevel,
  scale: ScaleLevel
): ProjectArchetype | null {
  // Critical Response: Urgency = Critical
  if (urgency === 'critical') {
    return 'critical'
  }

  // Quick Task: Micro-Minor scale + Simple complexity
  if ((scale === 'micro' || scale === 'minor') && complexity === 'simple') {
    return 'quicktask'
  }

  // Major Initiative: Major-Epic scale + High-Critical importance
  if (
    (scale === 'major' || scale === 'epic') &&
    (importance === 'high' || importance === 'critical')
  ) {
    return 'initiative'
  }

  // System Build: Minor-Major scale + Complicated-Complex + Low-Normal urgency
  if (
    (scale === 'minor' || scale === 'major') &&
    (complexity === 'complicated' || complexity === 'complex') &&
    (urgency === 'low' || urgency === 'normal')
  ) {
    return 'systembuild'
  }

  // Maintenance Loop: Simple-Complicated + Normal urgency
  if (
    (complexity === 'simple' || complexity === 'complicated') &&
    urgency === 'normal' &&
    importance === 'normal'
  ) {
    return 'maintenance'
  }

  // Discovery Mission: Minor scale + Complex/Chaotic complexity
  if (scale === 'minor' && (complexity === 'complex' || complexity === 'chaotic')) {
    return 'discovery'
  }

  // Default: Let user choose
  return null
}

/**
 * Container component for project creation workflow
 * Manages state, stage navigation, and event commits
 */
export const ProjectCreationView: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const store = useStore()

  // Get project ID from URL if editing existing project
  const projectId = searchParams.get('projectId')
  // Always call useQuery unconditionally - use dummy ID when none exists to avoid hooks violations
  const projectQueryResult = useQuery(getProjectDetails$(projectId || '__dummy__'))
  const existingProject = projectId ? (projectQueryResult?.[0] as any) : null

  // Stage management
  const [currentStage, setCurrentStage] = useState<1 | 2>(1)
  const [isSaving, setIsSaving] = useState(false)
  const [hasLoadedProject, setHasLoadedProject] = useState(false)

  // Stage 1 state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Stage 2 state
  const [objectives, setObjectives] = useState('')
  const [deadline, setDeadline] = useState('')
  const [archetype, setArchetype] = useState<ProjectArchetype | ''>('')
  const [isArchetypeManuallySet, setIsArchetypeManuallySet] = useState(false)
  const [estimatedDuration, setEstimatedDuration] = useState(0)
  const [urgency, setUrgency] = useState<UrgencyLevel>('normal')
  const [importance, setImportance] = useState<ImportanceLevel>('normal')
  const [complexity, setComplexity] = useState<ComplexityLevel>('simple')
  const [scale, setScale] = useState<ScaleLevel>('minor')

  // Load existing project data if editing (only on initial load)
  useEffect(() => {
    if (existingProject && !hasLoadedProject) {
      setTitle(existingProject.name || '')
      setDescription(existingProject.description || null)

      const attrs = existingProject.attributes as PlanningAttributes | null
      if (attrs) {
        setCurrentStage((attrs.planningStage as 1 | 2) || 1)
        setObjectives(attrs.objectives || '')
        if (attrs.deadline) {
          const dateStr = new Date(attrs.deadline).toISOString().split('T')[0]
          if (dateStr) setDeadline(dateStr)
        }
        setArchetype((attrs.archetype as ProjectArchetype) || '')
        setEstimatedDuration(attrs.estimatedDuration || 0)
        setUrgency(attrs.urgency || 'normal')
        setImportance(attrs.importance || 'normal')
        setComplexity(attrs.complexity || 'simple')
        setScale(attrs.scale || 'minor')
      }
      setHasLoadedProject(true)
    }
  }, [existingProject, hasLoadedProject])

  // Auto-suggest archetype based on traits
  useEffect(() => {
    // Only auto-suggest if archetype hasn't been manually set by user
    if (currentStage === 2 && !isArchetypeManuallySet) {
      const suggested = suggestArchetype(urgency, importance, complexity, scale)
      if (suggested) {
        setArchetype(suggested)
      }
    }
  }, [urgency, importance, complexity, scale, currentStage, isArchetypeManuallySet])

  // Get category color
  const category = PROJECT_CATEGORIES.find(c => c.value === categoryId)
  const categoryColor = category?.colorHex || '#3B82F6'

  // Save project (create or update)
  const saveProject = async (stage: 1 | 2, navigateToStage?: 1 | 2) => {
    if (!categoryId) return

    setIsSaving(true)
    try {
      const now = new Date()
      let currentProjectId = projectId

      // Create project if it doesn't exist
      if (!currentProjectId) {
        currentProjectId = crypto.randomUUID()
        store.store.commit(
          events.projectCreatedV2({
            id: currentProjectId,
            name: title,
            description: description || undefined,
            category: categoryId as any,
            attributes: undefined,
            createdAt: now,
            actorId: undefined,
          })
        )
      } else {
        // Update basic fields if they changed
        if (title !== existingProject?.name || description !== existingProject?.description) {
          store.store.commit(
            events.projectUpdated({
              id: currentProjectId,
              updates: {
                name: title,
                description: description || null,
              },
              updatedAt: now,
              actorId: undefined,
            })
          )
        }
      }

      // Build attributes object based on stage
      const attributes: PlanningAttributes = {
        status: 'planning',
        planningStage: stage,
      }

      // Include Stage 2 fields if we're on Stage 2
      if (stage === 2) {
        attributes.objectives = objectives
        attributes.deadline = deadline ? new Date(deadline).getTime() : undefined
        attributes.archetype = archetype as ProjectArchetype
        attributes.estimatedDuration = estimatedDuration || undefined
        attributes.urgency = urgency
        attributes.importance = importance
        attributes.complexity = complexity
        attributes.scale = scale
      }

      // Commit attributes update
      store.store.commit(
        events.projectAttributesUpdated({
          id: currentProjectId,
          attributes: attributes as any,
          updatedAt: now,
          actorId: undefined,
        })
      )

      // Update URL with project ID if new
      if (!projectId) {
        setSearchParams({ projectId: currentProjectId })
      }

      // Navigate to next stage if specified
      if (navigateToStage) {
        setCurrentStage(navigateToStage)
      }
    } catch (error) {
      console.error('Error saving project:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Stage 1 handlers
  const handleStage1SaveDraft = () => {
    saveProject(1)
  }

  const handleStage1Continue = () => {
    saveProject(1, 2)
  }

  // Stage 2 handlers
  const handleStage2Back = () => {
    setCurrentStage(1)
  }

  const handleStage2SaveDraft = () => {
    saveProject(2)
  }

  const handleStage2Continue = () => {
    // Stage 3 will be implemented in next PR
    saveProject(2)
    alert('Stage 3 (Task Planning) coming in next PR!')
  }

  if (!categoryId) {
    return <div className='p-6 text-center text-gray-500'>Invalid category</div>
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      {currentStage === 1 && (
        <ProjectCreationStage1Presenter
          title={title}
          description={description}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onSaveDraft={handleStage1SaveDraft}
          onContinue={handleStage1Continue}
          isSaving={isSaving}
          categoryColor={categoryColor}
        />
      )}
      {currentStage === 2 && (
        <ProjectCreationStage2Presenter
          objectives={objectives}
          deadline={deadline}
          archetype={archetype}
          estimatedDuration={estimatedDuration}
          urgency={urgency}
          importance={importance}
          complexity={complexity}
          scale={scale}
          onObjectivesChange={setObjectives}
          onDeadlineChange={setDeadline}
          onArchetypeChange={value => {
            setArchetype(value)
            setIsArchetypeManuallySet(true)
          }}
          onEstimatedDurationChange={setEstimatedDuration}
          onUrgencyChange={setUrgency}
          onImportanceChange={setImportance}
          onComplexityChange={setComplexity}
          onScaleChange={setScale}
          onBack={handleStage2Back}
          onSaveDraft={handleStage2SaveDraft}
          onContinue={handleStage2Continue}
          isSaving={isSaving}
          categoryColor={categoryColor}
        />
      )}
    </div>
  )
}
