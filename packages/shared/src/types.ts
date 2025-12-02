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

// Export planning types and lifecycle
export type {
  ProjectStatus,
  PlanningStage,
  ProjectArchetype,
  UrgencyLevel,
  ImportanceLevel,
  ComplexityLevel,
  ScaleLevel,
  PlanningAttributes,
  LifecycleSlot,
  LifecycleStream,
  ProjectLifecycleState,
} from './types/planning.js'
export {
  ARCHETYPE_LABELS,
  STAGE_LABELS,
  PlanningAttributesSchema,
  ProjectLifecycleStateSchema,
  createDefaultLifecycleState,
  describeProjectLifecycleState,
  deriveLifecycleFromAttributes,
  parseProjectLifecycleState,
  resolveLifecycleState,
} from './types/planning.js'
