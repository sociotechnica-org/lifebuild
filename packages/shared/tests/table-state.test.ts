import { describe, expect, it } from 'vitest'
import type { TableBronzeStackEntry } from '../src/livestore/schema.js'
import {
  getNextBronzeTasks,
  nextConfigurationVersion,
  nextPriorityQueueVersion,
} from '../src/table-state.js'

describe('table-state helpers', () => {
  it('increments configuration and priority queue versions with sensible defaults', () => {
    expect(nextConfigurationVersion()).toBe(1)
    expect(nextConfigurationVersion({ version: 4 })).toBe(5)
    expect(nextPriorityQueueVersion(undefined, 10)).toBe(10)
    expect(nextPriorityQueueVersion({ priorityQueueVersion: 2 })).toBe(3)
  })

  it('builds bronze task add events when the stack has room', () => {
    const { events, nextQueueVersion, expectedQueueVersion } = getNextBronzeTasks({
      storeId: 'store-1',
      queue: [{ taskId: 'task-a' }, { taskId: 'task-b' }, { taskId: 'task-c' }],
      stack: [],
      desiredCount: 2,
      config: { priorityQueueVersion: 1 },
      actorId: 'tester',
      insertedBy: 'tester',
      nextQueueVersion: 5,
    })

    expect(nextQueueVersion).toBe(5)
    expect(expectedQueueVersion).toBe(1)
    expect(events).toHaveLength(2)
    expect(events[0].name).toBe('table.bronze_task_added')
    expect(events[0].args.taskId).toBe('task-a')
    expect(events[1].args.position).toBe(1)
    expect(events[0].args.nextQueueVersion).toBe(5)
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

    const { events, nextQueueVersion, expectedQueueVersion } = getNextBronzeTasks({
      storeId: 'store-1',
      queue: [],
      stack,
      desiredCount: 1,
      config: { priorityQueueVersion: 7 },
      actorId: 'tester',
    })

    expect(nextQueueVersion).toBe(8)
    expect(expectedQueueVersion).toBe(7)
    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('table.bronze_task_removed')
    expect(events[0].args.id).toBe('entry-2')
    expect(events[0].args.expectedQueueVersion).toBe(7)
  })
})
