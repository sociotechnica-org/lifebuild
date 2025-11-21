import { Schema } from '@livestore/livestore'
import type { PlanningAttributes } from './types/planning.js'

export type LifecycleStream = 'gold' | 'silver' | 'bronze'
export type LifecycleSlot = 'gold' | 'silver'

export interface DraftingPayload {
  summary?: string
  problemStatement?: string
  objectives?: string[]
  outline?: string[]
  notes?: string
  risks?: string[]
  ownerId?: string | null
  lastEditedAt?: number
}

export type ProjectLifecycleState =
  | { status: 'planning'; stage: 1 | 2 | 3; draftingData: DraftingPayload }
  | { status: 'ready_for_stage4'; stage: 4; draftingData: DraftingPayload }
  | { status: 'plans'; stream: LifecycleStream; queuePosition: number }
  | { status: 'work_at_hand'; slot: LifecycleSlot; activatedAt: number }
  | { status: 'live'; lastActiveAt: number }
  | { status: 'paused'; stream: LifecycleStream; pausedReason?: string }
  | { status: 'completed'; completedAt: number }

const PlanningOnlyStageLiteral = Schema.Literal(1, 2, 3)
const StreamLiteral = Schema.Literal('gold', 'silver', 'bronze')
const SlotLiteral = Schema.Literal('gold', 'silver')

export const DraftingPayloadSchema = Schema.Struct({
  summary: Schema.optional(Schema.String),
  problemStatement: Schema.optional(Schema.String),
  objectives: Schema.optional(Schema.Array(Schema.String)),
  outline: Schema.optional(Schema.Array(Schema.String)),
  notes: Schema.optional(Schema.String),
  risks: Schema.optional(Schema.Array(Schema.String)),
  ownerId: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
  lastEditedAt: Schema.optional(Schema.Number),
})

export const ProjectLifecycleStateSchema = Schema.Union(
  Schema.Struct({
    status: Schema.Literal('planning'),
    stage: PlanningOnlyStageLiteral,
    draftingData: DraftingPayloadSchema,
  }),
  Schema.Struct({
    status: Schema.Literal('ready_for_stage4'),
    stage: Schema.Literal(4),
    draftingData: DraftingPayloadSchema,
  }),
  Schema.Struct({
    status: Schema.Literal('plans'),
    stream: StreamLiteral,
    queuePosition: Schema.Number,
  }),
  Schema.Struct({
    status: Schema.Literal('work_at_hand'),
    slot: SlotLiteral,
    activatedAt: Schema.Number,
  }),
  Schema.Struct({
    status: Schema.Literal('live'),
    lastActiveAt: Schema.Number,
  }),
  Schema.Struct({
    status: Schema.Literal('paused'),
    stream: StreamLiteral,
    pausedReason: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    status: Schema.Literal('completed'),
    completedAt: Schema.Number,
  })
)

const clampPlanningStage = (stage: number | undefined | null): 1 | 2 | 3 | 4 => {
  if (stage === 2) return 2
  if (stage === 3) return 3
  if (stage === 4) return 4
  return 1
}

const ensureDraftingPayload = (
  draftingData?: DraftingPayload,
  fallbackTimestamp?: number
): DraftingPayload => {
  const base = draftingData || {}
  return {
    ...base,
    lastEditedAt: base.lastEditedAt ?? fallbackTimestamp ?? Date.now(),
  }
}

export const createDefaultLifecycleState = (
  draftingData?: DraftingPayload
): ProjectLifecycleState => ({
  status: 'planning',
  stage: 1,
  draftingData: ensureDraftingPayload(draftingData),
})

export const isProjectLifecycleState = (value: unknown): value is ProjectLifecycleState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const state = value as Record<string, unknown>
  switch (state.status) {
    case 'planning':
      return (
        typeof state.stage === 'number' &&
        (state.stage === 1 || state.stage === 2 || state.stage === 3) &&
        typeof state.draftingData === 'object' &&
        state.draftingData !== null
      )
    case 'ready_for_stage4':
      return (
        state.stage === 4 && typeof state.draftingData === 'object' && state.draftingData !== null
      )
    case 'plans':
      return (
        (state.stream === 'gold' || state.stream === 'silver' || state.stream === 'bronze') &&
        typeof state.queuePosition === 'number'
      )
    case 'work_at_hand':
      return (
        (state.slot === 'gold' || state.slot === 'silver') && typeof state.activatedAt === 'number'
      )
    case 'live':
      return typeof state.lastActiveAt === 'number'
    case 'paused':
      return (
        (state.stream === 'gold' || state.stream === 'silver' || state.stream === 'bronze') &&
        (state.pausedReason === undefined || typeof state.pausedReason === 'string')
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
  fallback?: ProjectLifecycleState,
  fallbackTimestampMs?: number
): ProjectLifecycleState => {
  const fallbackTimestamp =
    fallbackTimestampMs ??
    (fallback?.status === 'live'
      ? fallback.lastActiveAt
      : fallback?.status === 'completed'
        ? fallback.completedAt
        : fallback?.status === 'work_at_hand'
          ? fallback.activatedAt
          : undefined)
  if (!attributes) return fallback ?? createDefaultLifecycleState()

  const stage = clampPlanningStage(attributes.planningStage ?? 1)
  const draftingData: DraftingPayload = {
    objectives: attributes.objectives ? [attributes.objectives] : undefined,
    lastEditedAt: attributes.lastActivityAt,
  }

  if (attributes.status === 'planning') {
    if (stage === 4) {
      return {
        status: 'ready_for_stage4',
        stage,
        draftingData: ensureDraftingPayload(draftingData, fallbackTimestamp),
      }
    }
    return {
      status: 'planning',
      stage,
      draftingData: ensureDraftingPayload(draftingData, fallbackTimestamp),
    }
  }

  if (attributes.status === 'active') {
    return {
      status: 'work_at_hand',
      slot: 'gold',
      activatedAt: attributes.activatedAt ?? fallbackTimestamp ?? Date.now(),
    }
  }

  if (attributes.status === 'completed') {
    return {
      status: 'completed',
      completedAt: attributes.lastActivityAt ?? fallbackTimestamp ?? Date.now(),
    }
  }

  const queuePosition = attributes.priority ?? 0
  return {
    status: 'plans',
    stream: 'bronze',
    queuePosition: typeof queuePosition === 'number' ? queuePosition : 0,
  }
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
    case 'ready_for_stage4':
      return 'Ready for Stage 4'
    case 'plans':
      return `Plans · ${lifecycle.stream.toUpperCase()}`
    case 'work_at_hand':
      return `Work at Hand · ${lifecycle.slot.toUpperCase()} slot`
    case 'live':
      return 'Live'
    case 'paused':
      return `Paused · ${lifecycle.stream.toUpperCase()}`
    case 'completed':
      return 'Completed'
    default:
      return 'Lifecycle unknown'
  }
}
