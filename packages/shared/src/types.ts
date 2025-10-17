import { Schema } from '@livestore/livestore'

export const Filter = Schema.Literal('all', 'active', 'completed')
export type Filter = typeof Filter.Type

// Export auth types from auth module
export type {
  SyncPayload,
  EventMetadata,
  AuthTokens,
  AuthUser,
  AuthInstance,
} from './auth/types.js'

// Export planning types
export type {
  ProjectStatus,
  PlanningStage,
  ProjectArchetype,
  UrgencyLevel,
  ImportanceLevel,
  ComplexityLevel,
  ScaleLevel,
  PlanningAttributes,
} from './types/planning.js'
export { ARCHETYPE_LABELS, STAGE_LABELS } from './types/planning.js'
