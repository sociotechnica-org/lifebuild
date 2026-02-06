/**
 * Project Planning - Types, Schemas, and Lifecycle State Machine
 *
 * This module defines how projects progress through planning stages and lifecycle states.
 * All project lifecycle data is stored in the `projectLifecycleState` JSON column.
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
// Project Lifecycle State (stored in projects.projectLifecycleState JSON field)
//
// This is the SINGLE SOURCE OF TRUTH for all project planning/lifecycle data.
// The structure is FLAT - all planning fields are at the top level, not nested.
// =============================================================================

/**
 * Flattened Project Lifecycle State
 *
 * All planning attributes are stored at the top level alongside status info.
 * This eliminates duplication between `attributes` and `projectLifecycleState`.
 *
 * NOTE: Optional fields can be `null` due to JSON serialization.
 * JSON doesn't have `undefined`, so when data round-trips through JSON,
 * `undefined` can become `null`. Always check for both when reading.
 */
export interface ProjectLifecycleState {
  // Core lifecycle status (required)
  status: ProjectStatus
  stage: PlanningStage

  // Planning fields (preserved across all statuses)
  // Can be undefined (missing) or null (JSON serialization)
  objectives?: string | null
  deadline?: number | null // Timestamp
  archetype?: ProjectArchetype | null
  estimatedDuration?: number | null // Hours
  urgency?: UrgencyLevel | null
  importance?: ImportanceLevel | null
  complexity?: ComplexityLevel | null
  scale?: ScaleLevel | null
  priority?: number | null // Lower number = higher priority

  // Backlog-specific fields
  stream?: LifecycleStream | null
  queuePosition?: number | null

  // Active-specific fields
  slot?: LifecycleSlot | null
  activatedAt?: number | null // Timestamp when moved to active

  // Completed-specific field
  completedAt?: number | null // Timestamp when completed
}

// Schema for LiveStore JSON parsing/validation
const StatusLiteral = Schema.Literal('planning', 'backlog', 'active', 'completed')
const StageLiteral = Schema.Literal(1, 2, 3, 4)
const ArchetypeLiteral = Schema.Literal(
  'quicktask',
  'discovery',
  'critical',
  'maintenance',
  'systembuild',
  'initiative'
)
const UrgencyLiteral = Schema.Literal('low', 'normal', 'high', 'critical')
const ImportanceLiteral = Schema.Literal('low', 'normal', 'high', 'critical')
const ComplexityLiteral = Schema.Literal('simple', 'complicated', 'complex', 'chaotic')
const ScaleLiteral = Schema.Literal('micro', 'minor', 'major', 'epic')
const StreamLiteral = Schema.Literal('gold', 'silver', 'bronze')
const SlotLiteral = Schema.Literal('gold', 'silver')

/**
 * Helper to create an optional field that also accepts null.
 * JSON doesn't have undefined, so when data round-trips through JSON,
 * undefined becomes null. This schema accepts both.
 */
const optionalNullable = <A, I, R>(schema: Schema.Schema<A, I, R>) =>
  Schema.optional(Schema.Union(schema, Schema.Null))

export const ProjectLifecycleStateSchema = Schema.Struct({
  // Core lifecycle (required)
  status: StatusLiteral,
  stage: StageLiteral,

  // Planning fields (all optional, accept null from JSON)
  objectives: optionalNullable(Schema.String),
  deadline: optionalNullable(Schema.Number),
  archetype: optionalNullable(ArchetypeLiteral),
  estimatedDuration: optionalNullable(Schema.Number),
  urgency: optionalNullable(UrgencyLiteral),
  importance: optionalNullable(ImportanceLiteral),
  complexity: optionalNullable(ComplexityLiteral),
  scale: optionalNullable(ScaleLiteral),
  priority: optionalNullable(Schema.Number),

  // Backlog fields
  stream: optionalNullable(StreamLiteral),
  queuePosition: optionalNullable(Schema.Number),

  // Active fields
  slot: optionalNullable(SlotLiteral),
  activatedAt: optionalNullable(Schema.Number),

  // Completed fields
  completedAt: optionalNullable(Schema.Number),
})

// =============================================================================
// Legacy PlanningAttributes type (for backwards compatibility during migration)
// @deprecated - Use ProjectLifecycleState instead
// =============================================================================

/**
 * @deprecated Use ProjectLifecycleState directly instead.
 * This type is kept for backwards compatibility with the old `attributes` column.
 */
export interface PlanningAttributes {
  status?: ProjectStatus
  planningStage?: PlanningStage
  objectives?: string
  deadline?: number
  archetype?: ProjectArchetype
  estimatedDuration?: number
  urgency?: UrgencyLevel
  importance?: ImportanceLevel
  complexity?: ComplexityLevel
  scale?: ScaleLevel
  priority?: number
  activatedAt?: number
  lastActivityAt?: number
  coverImage?: string
}

/**
 * @deprecated Use ProjectLifecycleStateSchema instead
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
  coverImage: Schema.optional(Schema.String),
})

// =============================================================================
// Lifecycle Helper Functions
// =============================================================================

/**
 * Create a default lifecycle state for a new project
 */
export const createDefaultLifecycleState = (
  overrides: Partial<ProjectLifecycleState> = {}
): ProjectLifecycleState => ({
  status: 'planning',
  stage: 1,
  ...overrides,
})

/**
 * Type guard to check if a value is a valid ProjectLifecycleState
 */
const isProjectLifecycleState = (value: unknown): value is ProjectLifecycleState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const state = value as Record<string, unknown>

  // Must have status and stage
  if (!state.status || !state.stage) return false

  const validStatuses = ['planning', 'backlog', 'active', 'completed']
  const validStages = [1, 2, 3, 4]

  if (!validStatuses.includes(state.status as string)) return false
  if (!validStages.includes(state.stage as number)) return false

  return true
}

/**
 * Parse a raw value (string or object) into a ProjectLifecycleState
 */
export const parseProjectLifecycleState = (value: unknown): ProjectLifecycleState | null => {
  if (value === null || value === undefined) return null

  try {
    const maybeState =
      typeof value === 'string' ? (JSON.parse(value) as unknown) : (value as unknown)

    // Handle old nested format with planningData
    if (
      maybeState &&
      typeof maybeState === 'object' &&
      'planningData' in (maybeState as Record<string, unknown>)
    ) {
      const oldState = maybeState as Record<string, unknown>
      const planningData = oldState.planningData as Record<string, unknown> | undefined

      // Flatten the old format into new format
      return {
        status: (oldState.status as ProjectStatus) ?? 'planning',
        stage: (oldState.stage as PlanningStage) ?? 1,
        objectives: planningData?.objectives as string | null | undefined,
        deadline: planningData?.deadline as number | null | undefined,
        archetype: planningData?.archetype as ProjectArchetype | null | undefined,
        estimatedDuration: planningData?.estimatedDuration as number | null | undefined,
        urgency: planningData?.urgency as UrgencyLevel | null | undefined,
        importance: planningData?.importance as ImportanceLevel | null | undefined,
        complexity: planningData?.complexity as ComplexityLevel | null | undefined,
        scale: planningData?.scale as ScaleLevel | null | undefined,
        priority: planningData?.priority as number | null | undefined,
        stream: oldState.stream as LifecycleStream | null | undefined,
        queuePosition: oldState.queuePosition as number | null | undefined,
        slot: oldState.slot as LifecycleSlot | null | undefined,
        activatedAt: oldState.activatedAt as number | null | undefined,
        completedAt: oldState.completedAt as number | null | undefined,
      }
    }

    return isProjectLifecycleState(maybeState) ? maybeState : null
  } catch {
    return null
  }
}

/**
 * @deprecated Use createDefaultLifecycleState or parse from existing state
 * Derives lifecycle state from legacy PlanningAttributes
 */
export const deriveLifecycleFromAttributes = (
  attributes?: PlanningAttributes | null,
  fallback?: ProjectLifecycleState
): ProjectLifecycleState => {
  if (!attributes) return fallback ?? createDefaultLifecycleState()

  const stage = clampPlanningStage(attributes.planningStage ?? 1)

  // Build base state with all planning data
  const baseState: ProjectLifecycleState = {
    status: attributes.status ?? 'planning',
    stage,
    objectives: attributes.objectives,
    deadline: attributes.deadline,
    archetype: attributes.archetype,
    estimatedDuration: attributes.estimatedDuration,
    urgency: attributes.urgency,
    importance: attributes.importance,
    complexity: attributes.complexity,
    scale: attributes.scale,
    priority: attributes.priority,
  }

  // Handle specific status transitions
  if (attributes.status === 'backlog' || (attributes.status === 'planning' && stage === 4)) {
    return {
      ...baseState,
      status: 'backlog',
      stage: 4,
      stream: 'bronze', // Default stream
      queuePosition: attributes.priority ?? 0,
    }
  }

  if (attributes.status === 'active') {
    return {
      ...baseState,
      status: 'active',
      activatedAt: attributes.activatedAt ?? Date.now(),
      slot: 'gold', // Default slot
    }
  }

  if (attributes.status === 'completed') {
    return {
      ...baseState,
      status: 'completed',
      completedAt: Date.now(),
    }
  }

  return baseState
}

const clampPlanningStage = (stage: number | undefined | null): PlanningStage => {
  if (stage === 2) return 2
  if (stage === 3) return 3
  if (stage === 4) return 4
  return 1
}

/**
 * Resolve lifecycle state from raw data, with fallbacks
 */
export const resolveLifecycleState = (
  rawLifecycle: unknown,
  legacyAttributes?: PlanningAttributes | null
): ProjectLifecycleState => {
  return (
    parseProjectLifecycleState(rawLifecycle) ??
    deriveLifecycleFromAttributes(legacyAttributes, undefined) ??
    createDefaultLifecycleState()
  )
}

/**
 * Stream display labels (Gold → Initiative, Silver → Optimization, Bronze → To-Do)
 */
export const STREAM_LABELS: Record<LifecycleStream, string> = {
  gold: 'Initiative',
  silver: 'Optimization',
  bronze: 'To-Do',
}

/**
 * Get a human-readable description of a lifecycle state
 */
export const describeProjectLifecycleState = (
  lifecycle: ProjectLifecycleState | null | undefined
): string => {
  if (!lifecycle) return 'Lifecycle unknown'
  const streamLabel = STREAM_LABELS[lifecycle.stream ?? 'bronze']
  switch (lifecycle.status) {
    case 'planning':
      return `Drafting · Stage ${lifecycle.stage}`
    case 'backlog':
      return `Sorting · ${streamLabel}`
    case 'active':
      return `Active${lifecycle.slot ? ` · ${STREAM_LABELS[lifecycle.slot]} slot` : ''}`
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
  1: 'Identifying',
  2: 'Scoping',
  3: 'Detailing',
  4: 'Prioritizing',
}
