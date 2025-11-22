import { describe, expect, it } from 'vitest'
import type { TableBronzeStackEntry } from '../src/livestore/schema.js'
import { getNextBronzeTasks } from '../src/table-state.js'

describe('table-state helpers', () => {
  it('builds bronze task add events when the stack has room', () => {
    const { events } = getNextBronzeTasks({
      queue: [{ taskId: 'task-a' }, { taskId: 'task-b' }, { taskId: 'task-c' }],
      stack: [],
      desiredCount: 2,
      actorId: 'tester',
      insertedBy: 'tester',
    })

    expect(events).toHaveLength(2)
    expect(events[0].name).toBe('table.bronze_task_added')
    expect(events[0].args.taskId).toBe('task-a')
    expect(events[1].args.position).toBe(1)
    expect(events[0].args.insertedBy).toBe('tester')
    expect(events[0].args.actorId).toBe('tester')
  })

  it('emits removal events when the stack exceeds the desired size', () => {
    const stack: TableBronzeStackEntry[] = [
      {
        id: 'entry-1',
        storeId: 'store-1',
        taskId: 'task-a',
        position: 0,
        insertedAt: new Date(),
        insertedBy: null,
        status: 'active',
        removedAt: null,
      },
      {
        id: 'entry-2',
        storeId: 'store-1',
        taskId: 'task-b',
        position: 1,
        insertedAt: new Date(),
        insertedBy: null,
        status: 'active',
        removedAt: null,
      },
    ]

    const { events } = getNextBronzeTasks({
      queue: [],
      stack,
      desiredCount: 1,
      actorId: 'tester',
    })

    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('table.bronze_task_removed')
    expect(events[0].args.id).toBe('entry-2')
    expect(events[0].args.actorId).toBe('tester')
  })
})
