import React from 'react'

export interface ProjectCreationStage1PresenterProps {
  title: string
  description: string
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  onSaveDraft: () => void
  onContinue: () => void
  isSaving: boolean
  categoryColor?: string
}

/**
 * Stage 1: Identified - Capture project title and description
 * Presenter component - pure UI with no data fetching
 */
export const ProjectCreationStage1Presenter: React.FC<ProjectCreationStage1PresenterProps> = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onSaveDraft,
  onContinue,
  isSaving,
  categoryColor = '#3B82F6',
}) => {
  const canContinue = title.trim().length > 0

  return (
    <div className='max-w-2xl mx-auto p-6'>
      {/* Stage Indicator */}
      <div className='mb-8'>
        <div className='flex items-center gap-2 mb-2'>
          <div
            className='w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold'
            style={{ backgroundColor: categoryColor }}
          >
            1
          </div>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>Stage 1: Identified</h2>
            <p className='text-sm text-gray-500'>Capture your project idea</p>
          </div>
        </div>
        <div className='flex gap-2 mt-4'>
          <div className='h-2 flex-1 rounded' style={{ backgroundColor: categoryColor }} />
          <div className='h-2 flex-1 bg-gray-200 rounded' />
          <div className='h-2 flex-1 bg-gray-200 rounded' />
          <div className='h-2 flex-1 bg-gray-200 rounded' />
        </div>
      </div>

      {/* Form */}
      <div className='space-y-6'>
        {/* Title */}
        <div>
          <label htmlFor='project-title' className='block text-sm font-medium text-gray-700 mb-2'>
            Project Title <span className='text-red-500'>*</span>
          </label>
          <input
            id='project-title'
            type='text'
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            disabled={isSaving}
            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-lg disabled:bg-gray-50 disabled:text-gray-500'
            placeholder="What's this project about?"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor='project-description'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Description
          </label>
          <textarea
            id='project-description'
            value={description}
            onChange={e => onDescriptionChange(e.target.value)}
            disabled={isSaving}
            rows={6}
            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500'
            placeholder='Briefly describe what you want to accomplish...'
          />
          <p className='mt-2 text-sm text-gray-500'>
            Don't overthink it - you can refine this later
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className='mt-8 flex justify-between items-center'>
        <button
          onClick={onSaveDraft}
          disabled={!title.trim() || isSaving}
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
          {isSaving ? 'Saving...' : 'Save & Continue to Stage 2'}
        </button>
      </div>
    </div>
  )
}
