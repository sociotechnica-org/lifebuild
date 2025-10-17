import React from 'react'
import type {
  ProjectArchetype,
  UrgencyLevel,
  ImportanceLevel,
  ComplexityLevel,
  ScaleLevel,
} from '@work-squared/shared'
import { ARCHETYPE_LABELS } from '@work-squared/shared'

export interface ProjectCreationStage2PresenterProps {
  objectives: string
  deadline: string // ISO date string (YYYY-MM-DD)
  archetype: ProjectArchetype | ''
  estimatedDuration: number
  urgency: UrgencyLevel
  importance: ImportanceLevel
  complexity: ComplexityLevel
  scale: ScaleLevel
  onObjectivesChange: (objectives: string) => void
  onDeadlineChange: (deadline: string) => void
  onArchetypeChange: (archetype: ProjectArchetype) => void
  onEstimatedDurationChange: (duration: number) => void
  onUrgencyChange: (urgency: UrgencyLevel) => void
  onImportanceChange: (importance: ImportanceLevel) => void
  onComplexityChange: (complexity: ComplexityLevel) => void
  onScaleChange: (scale: ScaleLevel) => void
  onBack: () => void
  onSaveDraft: () => void
  onContinue: () => void
  isSaving: boolean
  categoryColor?: string
}

/**
 * Stage 2: Scoped - Define project parameters and traits
 * Presenter component - pure UI with no data fetching
 */
export const ProjectCreationStage2Presenter: React.FC<ProjectCreationStage2PresenterProps> = ({
  objectives,
  deadline,
  archetype,
  estimatedDuration,
  urgency,
  importance,
  complexity,
  scale,
  onObjectivesChange,
  onDeadlineChange,
  onArchetypeChange,
  onEstimatedDurationChange,
  onUrgencyChange,
  onImportanceChange,
  onComplexityChange,
  onScaleChange,
  onBack,
  onSaveDraft,
  onContinue,
  isSaving,
  categoryColor = '#3B82F6',
}) => {
  const canContinue = objectives.trim().length > 0 && archetype !== ''

  return (
    <div className='max-w-2xl mx-auto p-6'>
      {/* Stage Indicator */}
      <div className='mb-8'>
        <div className='flex items-center gap-2 mb-2'>
          <div
            className='w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold'
            style={{ backgroundColor: categoryColor }}
          >
            2
          </div>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>Stage 2: Scoped</h2>
            <p className='text-sm text-gray-500'>Define objectives and project parameters</p>
          </div>
        </div>
        <div className='flex gap-2 mt-4'>
          <div className='h-2 flex-1 bg-gray-300 rounded' />
          <div className='h-2 flex-1 rounded' style={{ backgroundColor: categoryColor }} />
          <div className='h-2 flex-1 bg-gray-200 rounded' />
          <div className='h-2 flex-1 bg-gray-200 rounded' />
        </div>
      </div>

      {/* Form */}
      <div className='space-y-6'>
        {/* Objectives */}
        <div>
          <label htmlFor='objectives' className='block text-sm font-medium text-gray-700 mb-2'>
            Project Objective <span className='text-red-500'>*</span>
          </label>
          <textarea
            id='objectives'
            value={objectives}
            onChange={e => onObjectivesChange(e.target.value)}
            disabled={isSaving}
            rows={4}
            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500'
            placeholder='What do you want to achieve with this project?'
            autoFocus
          />
        </div>

        {/* Deadline & Duration */}
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label htmlFor='deadline' className='block text-sm font-medium text-gray-700 mb-2'>
              Deadline
            </label>
            <input
              id='deadline'
              type='date'
              value={deadline}
              onChange={e => onDeadlineChange(e.target.value)}
              disabled={isSaving}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500'
            />
          </div>
          <div>
            <label htmlFor='duration' className='block text-sm font-medium text-gray-700 mb-2'>
              Estimated Duration (hours)
            </label>
            <input
              id='duration'
              type='number'
              min='0'
              step='1'
              value={estimatedDuration || ''}
              onChange={e => onEstimatedDurationChange(Number(e.target.value))}
              disabled={isSaving}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500'
              placeholder='e.g., 40'
            />
          </div>
        </div>

        {/* Archetype */}
        <div>
          <label htmlFor='archetype' className='block text-sm font-medium text-gray-700 mb-2'>
            Project Archetype <span className='text-red-500'>*</span>
          </label>
          <select
            id='archetype'
            value={archetype}
            onChange={e => onArchetypeChange(e.target.value as ProjectArchetype)}
            disabled={isSaving}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500'
          >
            <option value=''>Select archetype...</option>
            {Object.entries(ARCHETYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className='mt-2 text-sm text-gray-500'>
            Choose the type that best describes this project
          </p>
        </div>

        {/* Traits */}
        <div className='border-t border-gray-200 pt-6'>
          <h3 className='text-sm font-medium text-gray-900 mb-4'>Project Traits</h3>
          <div className='grid grid-cols-2 gap-4'>
            {/* Urgency */}
            <div>
              <label htmlFor='urgency' className='block text-sm font-medium text-gray-700 mb-2'>
                Urgency
              </label>
              <select
                id='urgency'
                value={urgency}
                onChange={e => onUrgencyChange(e.target.value as UrgencyLevel)}
                disabled={isSaving}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500'
              >
                <option value='low'>Low</option>
                <option value='normal'>Normal</option>
                <option value='high'>High</option>
                <option value='critical'>Critical</option>
              </select>
            </div>

            {/* Importance */}
            <div>
              <label htmlFor='importance' className='block text-sm font-medium text-gray-700 mb-2'>
                Importance
              </label>
              <select
                id='importance'
                value={importance}
                onChange={e => onImportanceChange(e.target.value as ImportanceLevel)}
                disabled={isSaving}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500'
              >
                <option value='low'>Low</option>
                <option value='normal'>Normal</option>
                <option value='high'>High</option>
                <option value='critical'>Critical</option>
              </select>
            </div>

            {/* Complexity */}
            <div>
              <label htmlFor='complexity' className='block text-sm font-medium text-gray-700 mb-2'>
                Complexity
              </label>
              <select
                id='complexity'
                value={complexity}
                onChange={e => onComplexityChange(e.target.value as ComplexityLevel)}
                disabled={isSaving}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500'
              >
                <option value='simple'>Simple</option>
                <option value='complicated'>Complicated</option>
                <option value='complex'>Complex</option>
                <option value='chaotic'>Chaotic</option>
              </select>
            </div>

            {/* Scale */}
            <div>
              <label htmlFor='scale' className='block text-sm font-medium text-gray-700 mb-2'>
                Scale
              </label>
              <select
                id='scale'
                value={scale}
                onChange={e => onScaleChange(e.target.value as ScaleLevel)}
                disabled={isSaving}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500'
              >
                <option value='micro'>Micro</option>
                <option value='minor'>Minor</option>
                <option value='major'>Major</option>
                <option value='epic'>Epic</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className='mt-8 flex justify-between items-center'>
        <button
          onClick={onBack}
          disabled={isSaving}
          className='px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          Back to Stage 1
        </button>
        <div className='flex gap-3'>
          <button
            onClick={onSaveDraft}
            disabled={isSaving}
            className='px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={onContinue}
            disabled={!canContinue || isSaving}
            className='px-8 py-2 text-white rounded-lg font-medium disabled:cursor-not-allowed transition-colors'
            style={{
              backgroundColor: canContinue && !isSaving ? categoryColor : '#9CA3AF',
            }}
          >
            {isSaving ? 'Saving...' : 'Continue to Stage 3'}
          </button>
        </div>
      </div>
    </div>
  )
}
