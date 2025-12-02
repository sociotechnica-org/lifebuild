import { Schema } from '@livestore/livestore'
import {
  createDefaultLifecycleState,
  deriveLifecycleFromAttributes,
  parseProjectLifecycleState,
  resolveLifecycleState,
  ProjectLifecycleStateSchema,
} from '../src/types/planning.js'
import type { PlanningAttributes, ProjectLifecycleState } from '../src/types/planning.js'

describe('ProjectLifecycleStateSchema', () => {
  it('accepts valid lifecycle state with no optional fields', () => {
    const input = { status: 'planning', stage: 1 }
    const result = Schema.decodeUnknownSync(ProjectLifecycleStateSchema)(input)
    expect(result.status).toBe('planning')
    expect(result.stage).toBe(1)
  })

  it('accepts null values for optional fields (JSON compatibility)', () => {
    // This is the critical test - JSON serialization can produce null values
    const input = {
      status: 'planning',
      stage: 1,
      objectives: 'Test',
      deadline: null, // null from JSON
      archetype: 'quicktask',
    }
    const result = Schema.decodeUnknownSync(ProjectLifecycleStateSchema)(input)
    expect(result.status).toBe('planning')
    expect(result.stage).toBe(1)
    expect(result.objectives).toBe('Test')
    expect(result.deadline).toBeNull()
    expect(result.archetype).toBe('quicktask')
  })

  it('accepts all optional fields as null', () => {
    const input = {
      status: 'backlog',
      stage: 4,
      objectives: null,
      deadline: null,
      archetype: null,
      estimatedDuration: null,
      urgency: null,
      importance: null,
      complexity: null,
      scale: null,
      priority: null,
      stream: null,
      queuePosition: null,
      slot: null,
      activatedAt: null,
      completedAt: null,
    }
    // Should not throw
    const result = Schema.decodeUnknownSync(ProjectLifecycleStateSchema)(input)
    expect(result.status).toBe('backlog')
  })

  it('rejects invalid status', () => {
    const input = { status: 'invalid', stage: 1 }
    expect(() => Schema.decodeUnknownSync(ProjectLifecycleStateSchema)(input)).toThrow()
  })

  it('rejects invalid stage', () => {
    const input = { status: 'planning', stage: 5 }
    expect(() => Schema.decodeUnknownSync(ProjectLifecycleStateSchema)(input)).toThrow()
  })
})

describe('project lifecycle helpers', () => {
  it('parses lifecycle state from JSON string (flattened format)', () => {
    const lifecycle: ProjectLifecycleState = {
      status: 'planning',
      stage: 2,
      objectives: 'Initial goal',
    }

    expect(parseProjectLifecycleState(JSON.stringify(lifecycle))).toEqual(lifecycle)
  })

  it('parses old nested format and flattens it', () => {
    const oldFormat = {
      status: 'planning',
      stage: 2,
      planningData: { objectives: 'Initial goal', archetype: 'discovery' },
    }

    const parsed = parseProjectLifecycleState(JSON.stringify(oldFormat))
    expect(parsed).toEqual({
      status: 'planning',
      stage: 2,
      objectives: 'Initial goal',
      archetype: 'discovery',
    })
  })

  it('returns null for invalid lifecycle payload', () => {
    expect(parseProjectLifecycleState('{"status":"unknown"}')).toBeNull()
    expect(parseProjectLifecycleState(undefined)).toBeNull()
  })

  it('derives planning and backlog states from legacy attributes', () => {
    const attrs: PlanningAttributes = {
      status: 'planning',
      planningStage: 3,
      objectives: 'map milestones',
    }

    const lifecycle = deriveLifecycleFromAttributes(attrs)
    expect(lifecycle.status).toBe('planning')
    expect(lifecycle.stage).toBe(3)
    expect(lifecycle.objectives).toBe('map milestones')

    // Stage 4 with planning status becomes backlog
    const backlogAttrs: PlanningAttributes = { ...attrs, planningStage: 4 }
    const backlog = deriveLifecycleFromAttributes(backlogAttrs)
    expect(backlog.status).toBe('backlog')
    expect(backlog.stage).toBe(4)
  })

  it('derives active and completed states from legacy attributes', () => {
    const active = deriveLifecycleFromAttributes({
      status: 'active',
      activatedAt: 123,
      objectives: 'Some goals',
    })
    expect(active.status).toBe('active')
    expect(active.activatedAt).toBe(123)
    expect(active.slot).toBe('gold')
    expect(active.objectives).toBe('Some goals') // Planning data preserved

    const completed = deriveLifecycleFromAttributes({
      status: 'completed',
      objectives: 'Completed goals',
    })
    expect(completed.status).toBe('completed')
    expect(completed.completedAt).toBeDefined()
    expect(completed.objectives).toBe('Completed goals') // Planning data preserved
  })

  it('derives backlog states from legacy attributes', () => {
    const backlog = deriveLifecycleFromAttributes({
      status: 'backlog',
      priority: 7,
      archetype: 'systembuild',
    })
    expect(backlog.status).toBe('backlog')
    expect(backlog.stage).toBe(4)
    expect(backlog.stream).toBe('bronze')
    expect(backlog.queuePosition).toBe(7)
    expect(backlog.archetype).toBe('systembuild') // Planning data preserved
  })

  it('prefers explicit lifecycle over derived attributes when resolving', () => {
    const lifecycle: ProjectLifecycleState = {
      status: 'backlog',
      stage: 4,
      stream: 'silver',
      queuePosition: 2,
      objectives: 'My objectives',
    }

    const resolved = resolveLifecycleState(lifecycle, {
      status: 'planning',
      planningStage: 1,
    })
    expect(resolved).toEqual(lifecycle)
  })

  it('falls back to default lifecycle when nothing is provided', () => {
    const resolved = resolveLifecycleState(null, null)
    expect(resolved.status).toBe('planning')
    expect(resolved.stage).toBe(1)

    const defaultState = createDefaultLifecycleState()
    expect(defaultState.status).toBe('planning')
    expect(defaultState.stage).toBe(1)
  })

  it('creates lifecycle state with overrides', () => {
    const state = createDefaultLifecycleState({
      objectives: 'Test objective',
      archetype: 'discovery',
    })
    expect(state.status).toBe('planning')
    expect(state.stage).toBe(1)
    expect(state.objectives).toBe('Test objective')
    expect(state.archetype).toBe('discovery')
  })
})
