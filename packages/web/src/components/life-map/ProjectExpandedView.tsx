import React from 'react'
import { motion } from 'framer-motion'
import type { Project } from '@work-squared/shared/schema'
import { formatDate } from '../../util/dates.js'
import { PROJECT_MODAL_DURATION, PROJECT_MODAL_SCALE, EASE_SMOOTH } from './animationTimings.js'

interface ProjectExpandedViewProps {
  project: Project
  onClose: () => void
}

/**
 * ProjectExpandedView - NEW UI component for expanded project modal
 * Shows full project details in a zoomed-up modal overlay
 */
export const ProjectExpandedView: React.FC<ProjectExpandedViewProps> = ({ project, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        className='fixed inset-0 bg-black/20 backdrop-blur-sm z-40'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: PROJECT_MODAL_DURATION }}
        onClick={onClose}
      />

      {/* Modal Card - fade in with scale down */}
      <motion.div
        className='fixed z-50 pointer-events-none'
        style={{
          top: '4rem', // pt-16
          left: '4rem', // pl-16
          bottom: '2rem', // pb-8
          right: '2rem', // pr-8
          width: 'auto',
          height: 'auto',
          maxWidth: '1200px',
        }}
        initial={{ opacity: 0, scale: PROJECT_MODAL_SCALE }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: PROJECT_MODAL_SCALE }}
        transition={{ duration: PROJECT_MODAL_DURATION, ease: EASE_SMOOTH }}
      >
        <motion.div
          className='backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 pointer-events-auto overflow-hidden flex flex-col h-full w-full'
          style={{
            fontFamily: 'Georgia, serif',
            backgroundColor: '#f5f1e8', // Same beige as LifeMap background
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className='absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors z-10'
            aria-label='Close'
          >
            <svg
              className='w-5 h-5 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>

          {/* Content */}
          <div className='flex-1 overflow-y-auto p-8'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>{project.name}</h1>
            {project.description && (
              <p className='text-lg text-gray-700 mb-6'>{project.description}</p>
            )}

            <div className='space-y-4 text-sm text-gray-600'>
              <div>
                <span className='font-semibold'>Created:</span> {formatDate(project.createdAt)}
              </div>
              <div>
                <span className='font-semibold'>Updated:</span> {formatDate(project.updatedAt)}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}
