import React from 'react'

export interface ProjectCreationStage3PresenterProps {
  projectId: string
  projectTitle: string
  onBack: () => void
  onOpenProject: () => void
  categoryColor?: string
}

/**
 * Stage 3: Drafted - Bridge to task planning
 * This stage prompts the user to plan their tasks using the existing project page
 * Presenter component - pure UI with no data fetching
 */
export const ProjectCreationStage3Presenter: React.FC<ProjectCreationStage3PresenterProps> = ({
  projectTitle,
  onBack,
  onOpenProject,
  categoryColor = '#3B82F6',
}) => {
  return (
    <div className='max-w-2xl mx-auto p-6'>
      {/* Stage Indicator */}
      <div className='mb-8'>
        <div className='flex items-center gap-2 mb-2'>
          <div
            className='w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold'
            style={{ backgroundColor: categoryColor }}
          >
            3
          </div>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>Stage 3: Drafted</h2>
            <p className='text-sm text-gray-500'>Plan your project tasks</p>
          </div>
        </div>
        <div className='flex gap-2 mt-4'>
          <div className='h-2 flex-1 bg-gray-300 rounded' />
          <div className='h-2 flex-1 bg-gray-300 rounded' />
          <div className='h-2 flex-1 rounded' style={{ backgroundColor: categoryColor }} />
          <div className='h-2 flex-1 bg-gray-200 rounded' />
        </div>
      </div>

      {/* Main Content */}
      <div className='bg-white border border-gray-200 rounded-lg p-8 text-center'>
        <div className='mb-6'>
          <div className='text-4xl mb-4'>📋</div>
          <h3 className='text-xl font-semibold text-gray-900 mb-2'>Now let's plan your tasks</h3>
          <p className='text-gray-600 mb-4'>
            Open your project page to add and organize tasks using the kanban board.
          </p>
          <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6'>
            <p className='text-sm font-medium text-gray-700 mb-2'>Project:</p>
            <p className='text-lg font-semibold text-gray-900'>{projectTitle}</p>
          </div>
        </div>

        <button
          onClick={onOpenProject}
          className='w-full px-8 py-3 text-white rounded-lg font-medium transition-colors hover:opacity-90'
          style={{ backgroundColor: categoryColor }}
        >
          Open Project & Plan Tasks
        </button>

        <p className='mt-4 text-sm text-gray-500'>
          When you're done planning tasks, you can mark your plan as ready from the project page.
        </p>
      </div>

      {/* Actions */}
      <div className='mt-8 flex justify-start items-center'>
        <button
          onClick={onBack}
          className='px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
        >
          Back to Stage 2
        </button>
      </div>
    </div>
  )
}
