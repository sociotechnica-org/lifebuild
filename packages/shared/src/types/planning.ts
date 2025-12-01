/**
 * Project Planning - Types, Schemas, and Lifecycle State Machine
 *
 * This module defines how projects progress through planning stages and lifecycle states.
 */

import { Schema } from '@livestore/livestore'

// =============================================================================
// Basic Types
// =============================================================================

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

export type LifecycleStream = 'gold' | 'silver' | 'bronze'
export type LifecycleSlot = 'gold' | 'silver'

// =============================================================================
// Planning Attributes (stored in projects.attributes JSON field)
// =============================================================================

/**
 * Schema for PlanningAttributes - used for JSON parsing/validation in LiveStore
 * All fields are optional to allow partial updates
 */
export const PlanningAttributesSchema = Schema.Struct({
  status: Schema.optional(Schema.Literal('planning', 'backlog', 'active', 'completed')),
  planningStage: Schema.optional(Schema.Literal(1, 2, 3, 4)),
  objectives: Schema.optional(Schema.String),
  deadline: Schema.optional(Schema.Number),
  archetype: Schema.optional(
    Schema.Literal('quicktask', 'discovery', 'critical', 'maintenance', 'systembuild', 'initiative')
  ),
  estimatedDuration: Schema.optional(Schema.Number),
  urgency: Schema.optional(Schema.Literal('low', 'normal', 'high', 'critical')),
  importance: Schema.optional(Schema.Literal('low', 'normal', 'high', 'critical')),
  complexity: Schema.optional(Schema.Literal('simple', 'complicated', 'complex', 'chaotic')),
  scale: Schema.optional(Schema.Literal('micro', 'minor', 'major', 'epic')),
  priority: Schema.optional(Schema.Number),
  activatedAt: Schema.optional(Schema.Number),
  lastActivityAt: Schema.optional(Schema.Number),
})

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

// =============================================================================
// Project Lifecycle State (stored in projects.projectLifecycleState JSON field)
// =============================================================================

export type ProjectLifecycleState =
  | { status: 'planning'; stage: 1 | 2 | 3; planningData: PlanningAttributes }
  | {
      status: 'backlog'
      stage: 4
      planningData: PlanningAttributes
      stream: LifecycleStream
      queuePosition: number
    }
  | {
      status: 'active'
      activatedAt: number
      slot?: LifecycleSlot
    }
  | { status: 'completed'; completedAt: number }

const PlanningOnlyStageLiteral = Schema.Literal(1, 2, 3)
const StreamLiteral = Schema.Literal('gold', 'silver', 'bronze')
const SlotLiteral = Schema.Literal('gold', 'silver')

export const ProjectLifecycleStateSchema = Schema.Union(
  Schema.Struct({
    status: Schema.Literal('planning'),
    stage: PlanningOnlyStageLiteral,
    planningData: PlanningAttributesSchema,
  }),
  Schema.Struct({
    status: Schema.Literal('backlog'),
    stage: Schema.Literal(4),
    planningData: PlanningAttributesSchema,
    stream: StreamLiteral,
    queuePosition: Schema.Number,
  }),
  Schema.Struct({
    status: Schema.Literal('active'),
    activatedAt: Schema.Number,
    slot: Schema.optional(SlotLiteral),
  }),
  Schema.Struct({
    status: Schema.Literal('completed'),
    completedAt: Schema.Number,
  })
)

// =============================================================================
// Lifecycle Helper Functions
// =============================================================================

const clampPlanningStage = (stage: number | undefined | null): 1 | 2 | 3 | 4 => {
  if (stage === 2) return 2
  if (stage === 3) return 3
  if (stage === 4) return 4
  return 1
}

export const createDefaultLifecycleState = (
  planningData: PlanningAttributes = {}
): ProjectLifecycleState => ({
  status: 'planning',
  stage: 1,
  planningData,
})

const isProjectLifecycleState = (value: unknown): value is ProjectLifecycleState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const state = value as Record<string, unknown>
  switch (state.status) {
    case 'planning':
      return (
        typeof state.stage === 'number' &&
        (state.stage === 1 || state.stage === 2 || state.stage === 3) &&
        typeof state.planningData === 'object' &&
        state.planningData !== null
      )
    case 'backlog':
      return (
        state.stage === 4 &&
        typeof state.planningData === 'object' &&
        state.planningData !== null &&
        (state.stream === 'gold' || state.stream === 'silver' || state.stream === 'bronze') &&
        typeof state.queuePosition === 'number'
      )
    case 'active':
      return (
        typeof state.activatedAt === 'number' &&
        (state.slot === undefined || state.slot === 'gold' || state.slot === 'silver')
      )
    case 'completed':
      return typeof state.completedAt === 'number'
    default:
      return false
  }
}

export const parseProjectLifecycleState = (value: unknown): ProjectLifecycleState | null => {
  if (value === null || value === undefined) return null

  try {
    const maybeState =
      typeof value === 'string' ? (JSON.parse(value) as unknown) : (value as unknown)
    return isProjectLifecycleState(maybeState) ? maybeState : null
  } catch {
    return null
  }
}

export const deriveLifecycleFromAttributes = (
  attributes?: PlanningAttributes | null,
  fallback?: ProjectLifecycleState
): ProjectLifecycleState => {
  if (!attributes) return fallback ?? createDefaultLifecycleState()

  const stage = clampPlanningStage(attributes.planningStage ?? 1)

  if (attributes.status === 'planning' || !attributes.status) {
    if (stage === 4) {
      // Stage 4 in planning status means ready to be prioritized (backlog)
      return {
        status: 'backlog',
        stage: 4,
        planningData: attributes,
        stream: 'bronze', // Default stream
        queuePosition: attributes.priority ?? 0,
      }
    }
    return {
      status: 'planning',
      stage,
      planningData: attributes,
    }
  }

  if (attributes.status === 'backlog') {
    return {
      status: 'backlog',
      stage: 4,
      planningData: attributes,
      stream: 'bronze',
      queuePosition: attributes.priority ?? 0,
    }
  }

  if (attributes.status === 'active') {
    return {
      status: 'active',
      activatedAt: attributes.activatedAt ?? Date.now(),
      slot: 'gold', // Default slot
    }
  }

  if (attributes.status === 'completed') {
    return {
      status: 'completed',
      completedAt: Date.now(),
    }
  }

  // Fallback for unknown status
  return createDefaultLifecycleState(attributes)
}

export const resolveLifecycleState = (
  rawLifecycle: unknown,
  attributes?: PlanningAttributes | null
): ProjectLifecycleState => {
  return (
    parseProjectLifecycleState(rawLifecycle) ??
    deriveLifecycleFromAttributes(attributes, undefined) ??
    createDefaultLifecycleState()
  )
}

export const describeProjectLifecycleState = (
  lifecycle: ProjectLifecycleState | null | undefined
): string => {
  if (!lifecycle) return 'Lifecycle unknown'
  switch (lifecycle.status) {
    case 'planning':
      return `Planning · Stage ${lifecycle.stage}`
    case 'backlog':
      return `Backlog · ${lifecycle.stream.toUpperCase()}`
    case 'active':
      return `Active${lifecycle.slot ? ` · ${lifecycle.slot.toUpperCase()} slot` : ''}`
    case 'completed':
      return 'Completed'
    default:
      return 'Lifecycle unknown'
  }
}

// =============================================================================
// Display Labels
// =============================================================================

export const ARCHETYPE_LABELS: Record<ProjectArchetype, string> = {
  quicktask: 'Quick Task',
  discovery: 'Discovery Mission',
  critical: 'Critical Response',
  maintenance: 'Maintenance Loop',
  systembuild: 'System Build',
  initiative: 'Major Initiative',
}

export const STAGE_LABELS: Record<PlanningStage, string> = {
  1: 'Identified',
  2: 'Scoped',
  3: 'Drafted',
  4: 'Prioritized',
}
