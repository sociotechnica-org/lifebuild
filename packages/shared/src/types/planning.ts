/**
 * Planning workflow types for Life Category project planning (Phase 2)
 */

export type ProjectStatus = 'planning' | 'backlog' | 'active' | 'completed'

export type PlanningStage = 1 | 2 | 3 | 4

export type ProjectArchetype =
  | 'quicktask'
  | 'discovery'
  | 'critical'
  | 'maintenance'
  | 'systembuild'
  | 'initiative'

export type UrgencyLevel = 'low' | 'normal' | 'high' | 'critical'
export type ImportanceLevel = 'low' | 'normal' | 'high' | 'critical'
export type ComplexityLevel = 'simple' | 'complicated' | 'complex' | 'chaotic'
export type ScaleLevel = 'micro' | 'minor' | 'major' | 'epic'

/**
 * Project attributes for the planning workflow
 * These are stored in projects.attributes JSON field
 */
export interface PlanningAttributes {
  // Planning workflow state
  status?: ProjectStatus
  planningStage?: PlanningStage

  // Stage 2 fields (Scoped)
  objectives?: string
  deadline?: number // Timestamp
  archetype?: ProjectArchetype
  estimatedDuration?: number // Hours
  urgency?: UrgencyLevel
  importance?: ImportanceLevel
  complexity?: ComplexityLevel
  scale?: ScaleLevel

  // Stage 4 fields (Prioritized)
  priority?: number // Lower number = higher priority

  // Activity tracking
  activatedAt?: number // Timestamp when moved to active
  lastActivityAt?: number // Timestamp of last update
}

/**
 * Display labels for archetype options
 */
export const ARCHETYPE_LABELS: Record<ProjectArchetype, string> = {
  quicktask: 'Quick Task',
  discovery: 'Discovery Mission',
  critical: 'Critical Response',
  maintenance: 'Maintenance Loop',
  systembuild: 'System Build',
  initiative: 'Major Initiative',
}

/**
 * Display labels for planning stages
 */
export const STAGE_LABELS: Record<PlanningStage, string> = {
  1: 'Identified',
  2: 'Scoped',
  3: 'Drafted',
  4: 'Prioritized',
}
