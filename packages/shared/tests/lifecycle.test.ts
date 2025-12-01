import {
  createDefaultLifecycleState,
  deriveLifecycleFromAttributes,
  parseProjectLifecycleState,
  resolveLifecycleState,
} from '../src/types/planning.js'
import type { PlanningAttributes, ProjectLifecycleState } from '../src/types/planning.js'

describe('project lifecycle helpers', () => {
  it('parses lifecycle state from JSON string', () => {
    const lifecycle: ProjectLifecycleState = {
      status: 'planning',
      stage: 2,
      planningData: { objectives: 'Initial goal' },
    }

    expect(parseProjectLifecycleState(JSON.stringify(lifecycle))).toEqual(lifecycle)
  })

  it('returns null for invalid lifecycle payload', () => {
    expect(parseProjectLifecycleState('{"status":"unknown"}')).toBeNull()
    expect(parseProjectLifecycleState(undefined)).toBeNull()
  })

  it('derives planning and backlog states from attributes', () => {
    const attrs: PlanningAttributes = {
      status: 'planning',
      planningStage: 3,
      objectives: 'map milestones',
    }

    const lifecycle = deriveLifecycleFromAttributes(attrs)
    expect(lifecycle.status).toBe('planning')
    expect(lifecycle.stage).toBe(3)

    // Stage 4 with planning status becomes backlog
    const backlogAttrs: PlanningAttributes = { ...attrs, planningStage: 4 }
    const backlog = deriveLifecycleFromAttributes(backlogAttrs)
    expect(backlog.status).toBe('backlog')
    expect(backlog.stage).toBe(4)
  })

  it('derives active, completed, and backlog states from attributes', () => {
    const active = deriveLifecycleFromAttributes({
      status: 'active',
      activatedAt: 123,
    })
    expect(active).toEqual({
      status: 'active',
      slot: 'gold',
      activatedAt: 123,
    })

    const completed = deriveLifecycleFromAttributes({
      status: 'completed',
    })
    expect(completed.status).toBe('completed')
    expect(completed.completedAt).toBeDefined()

    const backlog = deriveLifecycleFromAttributes({
      status: 'backlog',
      priority: 7,
    })
    expect(backlog).toEqual({
      status: 'backlog',
      stage: 4,
      planningData: { status: 'backlog', priority: 7 },
      stream: 'bronze',
      queuePosition: 7,
    })
  })

  it('prefers explicit lifecycle over derived attributes when resolving', () => {
    const lifecycle: ProjectLifecycleState = {
      status: 'backlog',
      stage: 4,
      planningData: {},
      stream: 'silver',
      queuePosition: 2,
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
  })
})
