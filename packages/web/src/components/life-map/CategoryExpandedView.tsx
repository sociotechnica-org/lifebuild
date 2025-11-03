import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@livestore/react'
import { getProjects$ } from '@work-squared/shared/queries'
import { type ProjectCategory, getCategoryInfo } from '@work-squared/shared'
import { ProjectCard } from './ProjectCard.js'
import { ProjectExpandedView } from './ProjectExpandedView.js'
import {
  CATEGORY_SCALE_DURATION,
  PROJECT_CARDS_SHOW_DELAY,
  PROJECT_CARDS_FADE_DURATION,
  EASE_SMOOTH,
} from './animationTimings.js'

/**
 * Color mixing configuration - same as LifeCategoryCard
 */
const CARD_BASE_COLOR = '#a0856f'
const TINT_STRENGTH: number = 0.03
const SATURATION_BOOST: number = 0.035
const BRIGHTNESS_ADJUST: number = 0.2

/**
 * Mix a category color with the brown background and apply adjustments
 * Same algorithm as LifeCategoryCard
 */
function mixWithBrown(categoryColorHex: string): string {
  const baseR = parseInt(CARD_BASE_COLOR.slice(1, 3), 16)
  const baseG = parseInt(CARD_BASE_COLOR.slice(3, 5), 16)
  const baseB = parseInt(CARD_BASE_COLOR.slice(5, 7), 16)

  const catR = parseInt(categoryColorHex.slice(1, 3), 16)
  const catG = parseInt(categoryColorHex.slice(3, 5), 16)
  const catB = parseInt(categoryColorHex.slice(5, 7), 16)

  let r = baseR * (1 - TINT_STRENGTH) + catR * TINT_STRENGTH
  let g = baseG * (1 - TINT_STRENGTH) + catG * TINT_STRENGTH
  let b = baseB * (1 - TINT_STRENGTH) + catB * TINT_STRENGTH

  if (SATURATION_BOOST > 0) {
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    r = r + (catR - gray) * SATURATION_BOOST
    g = g + (catG - gray) * SATURATION_BOOST
    b = b + (catB - gray) * SATURATION_BOOST
  }

  if (BRIGHTNESS_ADJUST !== 0) {
    if (BRIGHTNESS_ADJUST > 0) {
      r = r + (255 - r) * BRIGHTNESS_ADJUST
      g = g + (255 - g) * BRIGHTNESS_ADJUST
      b = b + (255 - b) * BRIGHTNESS_ADJUST
    } else {
      r = r * (1 + BRIGHTNESS_ADJUST)
      g = g * (1 + BRIGHTNESS_ADJUST)
      b = b * (1 + BRIGHTNESS_ADJUST)
    }
  }

  r = Math.max(0, Math.min(255, Math.round(r)))
  g = Math.max(0, Math.min(255, Math.round(g)))
  b = Math.max(0, Math.min(255, Math.round(b)))

  return `rgb(${r}, ${g}, ${b})`
}

interface CategoryExpandedViewProps {
  categoryId: ProjectCategory
  onClose: () => void
}

/**
 * CategoryExpandedView - NEW UI component for expanded category view
 * Shows projects for the category with smooth animations
 * Uses the same color mixing algorithm as LifeCategoryCard
 */
export const CategoryExpandedView: React.FC<CategoryExpandedViewProps> = ({
  categoryId,
  onClose,
}) => {
  const projects = useQuery(getProjects$) ?? []
  const categoryInfo = getCategoryInfo(categoryId)
  const [expandedProjectId, setExpandedProjectId] = React.useState<string | null>(null)
  const [showProjects, setShowProjects] = React.useState(false)

  if (!categoryInfo) return null

  // Filter projects for this category
  const categoryProjects = projects.filter(
    p => p.category === categoryId && !p.archivedAt && !p.deletedAt
  )

  // Use the same color mixing algorithm as the card
  const backgroundColor = mixWithBrown(categoryInfo.colorHex)

  const expandedProject = expandedProjectId
    ? categoryProjects.find(p => p.id === expandedProjectId)
    : null

  // Show projects after category scale-up animation completes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowProjects(true)
    }, PROJECT_CARDS_SHOW_DELAY * 1000) // Convert to milliseconds
    return () => clearTimeout(timer)
  }, [])

  const handleProjectClick = (projectId: string) => {
    setExpandedProjectId(projectId)
  }

  const handleProjectClose = () => {
    setExpandedProjectId(null)
  }

  // Handle ESC key - only close category if no project is open
  // Use capture phase to intercept before LifeMap's handler
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expandedProjectId) {
          // Project is open - close it first, prevent LifeMap from handling
          handleProjectClose()
          e.stopImmediatePropagation()
          e.preventDefault()
        } else {
          // No project open - close category
          onClose()
          e.stopImmediatePropagation()
          e.preventDefault()
        }
      }
    }
    // Use capture phase so this runs before LifeMap's handler
    window.addEventListener('keydown', handleEscape, true)
    return () => window.removeEventListener('keydown', handleEscape, true)
  }, [expandedProjectId, handleProjectClose, onClose])

  return (
    <motion.div
      key={`expanded-${categoryId}`}
      layoutId={categoryId}
      className='flex flex-col cursor-pointer overflow-hidden'
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: backgroundColor,
        borderRadius: '0',
        zIndex: 10,
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{
        layout: { duration: CATEGORY_SCALE_DURATION, ease: EASE_SMOOTH },
      }}
      onClick={e => {
        // Don't close category if clicking on background when project is open
        if (!expandedProjectId && e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Projects Grid and Modal - both rendered together for layoutId animation */}
      <AnimatePresence mode='popLayout'>
        {/* Always render the grid container */}
        <div key='grid-container' className='flex-1 overflow-y-auto pl-16 pr-8 pt-16 pb-8'>
          <div className='max-w-7xl mx-auto'>
            {categoryProjects.length === 0 ? (
              <motion.div
                className='text-center py-20'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: PROJECT_CARDS_SHOW_DELAY - 0.2 }}
              >
                <p className='text-xl mb-4' style={{ fontFamily: 'Georgia, serif', color: '#666' }}>
                  No projects yet in this category
                </p>
              </motion.div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {categoryProjects.map(project => {
                  const isExpanded = expandedProjectId === project.id
                  return (
                    <motion.div
                      key={project.id}
                      onClick={e => e.stopPropagation()}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: showProjects && !isExpanded ? 1 : 0,
                      }}
                      transition={{ duration: PROJECT_CARDS_FADE_DURATION }}
                      style={{
                        visibility: isExpanded ? 'hidden' : 'visible',
                      }}
                    >
                      <ProjectCard
                        project={project}
                        onClick={() => handleProjectClick(project.id)}
                      />
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Project Expanded Modal */}
        <AnimatePresence>
          {expandedProject && (
            <ProjectExpandedView
              key={`modal-${expandedProject.id}`}
              project={expandedProject}
              onClose={handleProjectClose}
            />
          )}
        </AnimatePresence>
      </AnimatePresence>
    </motion.div>
  )
}
