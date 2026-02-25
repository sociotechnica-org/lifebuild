import React from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoute } from '../../constants/routes.js'

/**
 * Entity Type Gate — first screen in the Drafting Room creation flow.
 * Presents a binary choice: Project or System.
 *
 * - "Project" navigates to the project Stage 1 form (existing flow).
 * - "System" navigates to the system Stage 1 form (placeholder for S4).
 */
export const EntityTypeGate: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className='flex items-start justify-center min-h-[calc(100vh-200px)] py-8'>
      <div className='w-full max-w-lg'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <h1 className="font-['Source_Serif_4',Georgia,serif] text-2xl font-bold text-[#2f2b27]">
            What are you building?
          </h1>
          <p className='mt-2 text-sm text-[#8b8680]'>
            Choose the type of entity to create in the Drafting Room.
          </p>
        </div>

        {/* Choice Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {/* Project Card */}
          <button
            type='button'
            className='group flex flex-col items-center gap-3 bg-white rounded-2xl border-2 border-[#e8e4de] p-6 cursor-pointer transition-all duration-200 hover:border-[#2f2b27] hover:shadow-md text-left'
            onClick={() => navigate(generateRoute.projectCreate())}
          >
            {/* Icon */}
            <div className='w-12 h-12 rounded-xl bg-[#f5f3ef] flex items-center justify-center transition-colors duration-200 group-hover:bg-[#2f2b27]'>
              <svg
                className='w-6 h-6 text-[#8b8680] transition-colors duration-200 group-hover:text-[#faf9f7]'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z' />
                <line x1='4' y1='22' x2='4' y2='15' />
              </svg>
            </div>
            {/* Label */}
            <div className='text-center'>
              <h2 className="font-['Source_Serif_4',Georgia,serif] text-lg font-bold text-[#2f2b27]">
                Project
              </h2>
              <p className='mt-1 text-sm text-[#8b8680]'>Bounded work with a finish line</p>
            </div>
          </button>

          {/* System Card */}
          <button
            type='button'
            className='group flex flex-col items-center gap-3 bg-white rounded-2xl border-2 border-[#e8e4de] p-6 cursor-pointer transition-all duration-200 hover:border-[#2f2b27] hover:shadow-md text-left'
            onClick={() => navigate(generateRoute.systemCreate())}
          >
            {/* Icon */}
            <div className='w-12 h-12 rounded-xl bg-[#f5f3ef] flex items-center justify-center transition-colors duration-200 group-hover:bg-[#2f2b27]'>
              <svg
                className='w-6 h-6 text-[#8b8680] transition-colors duration-200 group-hover:text-[#faf9f7]'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2' />
                <path d='M12 8v8' />
                <path d='M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4' />
              </svg>
            </div>
            {/* Label */}
            <div className='text-center'>
              <h2 className="font-['Source_Serif_4',Georgia,serif] text-lg font-bold text-[#2f2b27]">
                System
              </h2>
              <p className='mt-1 text-sm text-[#8b8680]'>Infrastructure that runs indefinitely</p>
            </div>
          </button>
        </div>

        {/* Back link */}
        <div className='mt-6 text-center'>
          <button
            type='button'
            className='text-sm text-[#8b8680] bg-transparent border-none cursor-pointer transition-colors duration-200 hover:text-[#2f2b27]'
            onClick={() => navigate(generateRoute.draftingRoom())}
          >
            Back to Drafting Room
          </button>
        </div>
      </div>
    </div>
  )
}
