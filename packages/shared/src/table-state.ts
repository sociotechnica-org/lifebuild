import { events } from './livestore/schema.js'
import type { TableBronzeStackEntry } from './livestore/schema.js'

export const BRONZE_MODES = ['minimal', 'target', 'maximal'] as const
export type BronzeMode = (typeof BRONZE_MODES)[number]

export const BRONZE_STACK_STATUSES = ['active', 'removed'] as const
export type BronzeStackStatus = (typeof BRONZE_STACK_STATUSES)[number]

export interface PriorityQueueItem {
  taskId: string
  position?: number
}

export interface BronzeStackPlanOptions {
  queue: PriorityQueueItem[]
  stack: TableBronzeStackEntry[]
  desiredCount: number
  actorId?: string
  insertedBy?: string
  timestamp?: Date
  idFactory?: (item: PriorityQueueItem) => string
}

export interface BronzeStackPlanResult {
  events: Array<
    ReturnType<typeof events.bronzeTaskAdded> | ReturnType<typeof events.bronzeTaskRemoved>
  >
}

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

export const normalizeBronzeStack = (stack: TableBronzeStackEntry[]): TableBronzeStackEntry[] =>
  [...stack].sort((a, b) => a.position - b.position)

export const activeBronzeEntries = (stack: TableBronzeStackEntry[]): TableBronzeStackEntry[] =>
  stack.filter(entry => entry.status === 'active')

export function getNextBronzeTasks(options: BronzeStackPlanOptions): BronzeStackPlanResult {
  const now = options.timestamp ?? new Date()
  const activeStack = normalizeBronzeStack(activeBronzeEntries(options.stack))
  const targetCount = Math.max(0, options.desiredCount)
  const eventsToEmit: BronzeStackPlanResult['events'] = []

  if (activeStack.length > targetCount) {
    const toRemove = activeStack.slice(targetCount)
    toRemove.forEach(entry => {
      eventsToEmit.push(
        events.bronzeTaskRemoved({
          id: entry.id,
          removedAt: now,
          actorId: options.actorId,
        })
      )
    })
  } else if (activeStack.length < targetCount) {
    const missing = targetCount - activeStack.length
    const activeTaskIds = new Set(activeStack.map(entry => entry.taskId))
    const additions = options.queue
      .filter(item => !activeTaskIds.has(item.taskId))
      .slice(0, missing)

    let nextPosition = activeStack.reduce((max, entry) => Math.max(max, entry.position), -1) + 1
    additions.forEach(item => {
      eventsToEmit.push(
        events.bronzeTaskAdded({
          id: options.idFactory?.(item) ?? generateId(),
          taskId: item.taskId,
          position: nextPosition,
          insertedAt: now,
          insertedBy: options.insertedBy ?? options.actorId,
          actorId: options.actorId,
        })
      )
      nextPosition += 1
    })
  }

  return { events: eventsToEmit }
}
