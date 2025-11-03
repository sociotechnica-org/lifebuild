import React from 'react'
import type { Project } from '@work-squared/shared/schema'

import { motion } from 'framer-motion'

interface ProjectCardProps {
  project: Project
  onClick?: () => void
  layoutId?: string // For Framer Motion layoutId animation
}

/**
 * ProjectCard - UI component for displaying projects
 * Designed for the new LifeMap UI with modern styling
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, layoutId }) => {
  return (
    <motion.div
      layoutId={layoutId || `project-${project.id}`}
      className='bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-white/20'
      onClick={onClick}
      style={{
        fontFamily: 'Georgia, serif',
      }}
    >
      <h3 className='text-xl font-semibold text-gray-900 mb-2'>{project.name}</h3>
      {project.description && (
        <p className='text-sm text-gray-600 mb-4 line-clamp-3'>{project.description}</p>
      )}
      <div className='text-xs text-gray-500'>
        Created {new Date(project.createdAt).toLocaleDateString()}
      </div>
    </motion.div>
  )
}
