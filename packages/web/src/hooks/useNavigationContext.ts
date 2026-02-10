import { useLocation, useParams } from 'react-router-dom'
import { useQuery } from '../livestore-compat.js'
import { getProjects$ } from '@lifebuild/shared/queries'
import {
  getCategoryInfo,
  resolveLifecycleState,
  STAGE_LABELS,
  ARCHETYPE_LABELS,
  type ProjectCategory,
  type ProjectLifecycleState,
} from '@lifebuild/shared'
import type { NavigationContext } from '../../../server/src/services/agentic-loop/types.js'

/**
 * Detect which page/view the user is on based on the route
 */
function detectCurrentView(pathname: string): string | undefined {
  if (pathname.includes('/stage1') || pathname === '/drafting-room/new') {
    return 'Stage 1: Identifying - User is naming and categorizing a new project'
  }
  if (pathname.includes('/stage2')) {
    return 'Stage 2: Scoping - User is defining objectives, archetype, and tier'
  }
  if (pathname.includes('/stage3')) {
    return 'Stage 3: Detailing - User is creating an actionable task list'
  }
  if (pathname === '/drafting-room') {
    return 'Drafting Room - Overview of all projects in planning stages 1-3'
  }
  if (pathname === '/sorting-room' || pathname.startsWith('/sorting-room/')) {
    return 'Sorting Room - Prioritizing and scheduling backlog projects'
  }
  if (pathname === '/life-map') {
    return 'Life Map - Overview of all life categories and active projects'
  }
  return undefined
}

/**
 * Format lifecycle state into human-readable attributes
 */
function formatLifecycleAttributes(
  lifecycle: ProjectLifecycleState | null
): Record<string, string> | undefined {
  if (!lifecycle) return undefined

  const attrs: Record<string, string> = {
    status: lifecycle.status,
    stage: `${lifecycle.stage} (${STAGE_LABELS[lifecycle.stage] || 'Unknown'})`,
  }

  if (lifecycle.objectives) {
    attrs.objectives = lifecycle.objectives
  }
  if (lifecycle.archetype) {
    attrs.archetype = ARCHETYPE_LABELS[lifecycle.archetype] || lifecycle.archetype
  }
  if (lifecycle.stream) {
    attrs.stream = lifecycle.stream
  }
  if (lifecycle.scale) {
    attrs.scale = lifecycle.scale
  }
  if (lifecycle.complexity) {
    attrs.complexity = lifecycle.complexity
  }
  if (lifecycle.urgency) {
    attrs.urgency = lifecycle.urgency
  }
  if (lifecycle.importance) {
    attrs.importance = lifecycle.importance
  }
  if (lifecycle.deadline) {
    attrs.deadline = formatDate(lifecycle.deadline)
  }
  if (lifecycle.estimatedDuration) {
    attrs.estimatedDuration = `${lifecycle.estimatedDuration} hours`
  }

  return attrs
}

/**
 * Hook to extract current navigation context for LLM
 * Captures what page/entity the user is viewing and subtab if present
 */
export const useNavigationContext = (): NavigationContext | null => {
  const location = useLocation()
  const params = useParams<{
    projectId?: string
    categoryId?: string
  }>()

  // Call all hooks unconditionally (Rules of Hooks requirement)
  const projects = useQuery(getProjects$) ?? []

  // Extract subtab from query parameters
  const searchParams = new URLSearchParams(location.search)
  const subtab = searchParams.get('subtab') || undefined

  const context: NavigationContext = {}

  // Add current view description
  const currentView = detectCurrentView(location.pathname)
  if (currentView) {
    context.currentView = currentView
  }

  // Add subtab if present
  if (subtab) {
    context.subtab = subtab
  }

  // Detect current entity from route params
  // Always send the entity ID if we're on an entity route, even if the local query hasn't loaded yet
  // The backend will enrich with full data from the database
  if (params.projectId) {
    const project = projects.find(p => p.id === params.projectId)
    const lifecycle = project ? resolveLifecycleState(project.projectLifecycleState, null) : null

    // Build comprehensive project attributes
    const baseAttributes: Record<string, string> = project
      ? {
          name: project.name,
          description: project.description || '(none)',
          category: project.category || '(none)',
          created: formatDate(project.createdAt),
          updated: formatDate(project.updatedAt),
        }
      : {
          // Placeholder - backend will enrich from database
          name: params.projectId,
        }

    // Merge in lifecycle attributes
    const lifecycleAttrs = formatLifecycleAttributes(lifecycle)
    const allAttributes = lifecycleAttrs ? { ...baseAttributes, ...lifecycleAttrs } : baseAttributes

    // Send project ID regardless of whether we found it locally
    context.currentEntity = {
      type: 'project',
      id: params.projectId,
      attributes: allAttributes,
    }
  } else if (params.categoryId) {
    const categoryInfo = getCategoryInfo(params.categoryId as ProjectCategory)

    context.currentEntity = {
      type: 'category',
      id: params.categoryId,
      attributes: categoryInfo
        ? {
            name: categoryInfo.name,
            description: categoryInfo.description,
            icon: categoryInfo.icon,
            colorHex: categoryInfo.colorHex,
          }
        : {
            // Placeholder - categoryId might be invalid
            name: params.categoryId,
          },
    }
  }

  // Return null if no meaningful context (user on home page, settings, etc.)
  if (!context.currentEntity && !context.subtab && !context.currentView) {
    return null
  }

  return context
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date | number | string | null | undefined): string {
  if (!date) return '(none)'

  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return '(none)'

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
