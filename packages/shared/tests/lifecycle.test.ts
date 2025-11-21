import {
  createDefaultLifecycleState,
  deriveLifecycleFromAttributes,
  parseProjectLifecycleState,
  resolveLifecycleState,
} from '../src/lifecycle.js'
import type { PlanningAttributes, ProjectLifecycleState } from '../src/types.js'

describe('project lifecycle helpers', () => {
  it('parses lifecycle state from JSON string', () => {
    const lifecycle: ProjectLifecycleState = {
      status: 'planning',
      stage: 2,
      draftingData: { summary: 'Initial', lastEditedAt: 10 },
    }

    expect(parseProjectLifecycleState(JSON.stringify(lifecycle))).toEqual(lifecycle)
  })

  it('returns null for invalid lifecycle payload', () => {
    expect(parseProjectLifecycleState('{"status":"unknown"}')).toBeNull()
    expect(parseProjectLifecycleState(undefined)).toBeNull()
  })

  it('derives planning and ready states from attributes', () => {
    const attrs: PlanningAttributes = {
      status: 'planning',
      planningStage: 3,
      objectives: 'map milestones',
    }

    const lifecycle = deriveLifecycleFromAttributes(attrs)
    expect(lifecycle.status).toBe('planning')
    expect(lifecycle.stage).toBe(3)

    const readyAttrs: PlanningAttributes = { ...attrs, planningStage: 4 }
    const ready = deriveLifecycleFromAttributes(readyAttrs)
    expect(ready.status).toBe('ready_for_stage4')
    expect(ready.stage).toBe(4)
  })

  it('derives active, completed, and backlog states from attributes', () => {
    const active = deriveLifecycleFromAttributes({
      status: 'active',
      activatedAt: 123,
    })
    expect(active).toEqual({
      status: 'work_at_hand',
      slot: 'gold',
      activatedAt: 123,
    })

    const completed = deriveLifecycleFromAttributes({
      status: 'completed',
      lastActivityAt: 500,
    })
    expect(completed).toEqual({ status: 'completed', completedAt: 500 })

    const backlog = deriveLifecycleFromAttributes({
      status: 'backlog',
      priority: 7,
    })
    expect(backlog).toEqual({ status: 'plans', stream: 'bronze', queuePosition: 7 })
  })

  it('prefers explicit lifecycle over derived attributes when resolving', () => {
    const lifecycle: ProjectLifecycleState = {
      status: 'plans',
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
    expect(resolved.draftingData.lastEditedAt).toBeDefined()

    const defaultState = createDefaultLifecycleState()
    expect(defaultState.status).toBe('planning')
  })
})
