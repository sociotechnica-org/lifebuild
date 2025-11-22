import { events } from './livestore/schema.js'
import type { TableBronzeStackEntry, TableConfiguration } from './livestore/schema.js'

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
  config?: Pick<TableConfiguration, 'priorityQueueVersion'>
  actorId?: string
  insertedBy?: string
  timestamp?: Date
  idFactory?: (item: PriorityQueueItem) => string
  nextQueueVersion?: number
}

export interface BronzeStackPlanResult {
  events: Array<
    ReturnType<typeof events.bronzeTaskAdded> | ReturnType<typeof events.bronzeTaskRemoved>
  >
  nextQueueVersion: number
  expectedQueueVersion?: number
}

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

export const nextConfigurationVersion = (config?: Pick<TableConfiguration, 'version'>): number =>
  (config?.version ?? 0) + 1

export const nextPriorityQueueVersion = (
  config?: Pick<TableConfiguration, 'priorityQueueVersion'>,
  override?: number
): number => override ?? (config?.priorityQueueVersion ?? 0) + 1

export const normalizeBronzeStack = (stack: TableBronzeStackEntry[]): TableBronzeStackEntry[] =>
  [...stack].sort((a, b) => a.position - b.position)

export const activeBronzeEntries = (stack: TableBronzeStackEntry[]): TableBronzeStackEntry[] =>
  stack.filter(entry => entry.status === 'active')

export function getNextBronzeTasks(options: BronzeStackPlanOptions): BronzeStackPlanResult {
  const now = options.timestamp ?? new Date()
  const activeStack = normalizeBronzeStack(activeBronzeEntries(options.stack))
  const targetCount = Math.max(0, options.desiredCount)
  const eventsToEmit: BronzeStackPlanResult['events'] = []
  const initialQueueVersion = options.config?.priorityQueueVersion

  let nextExpectedVersion = initialQueueVersion
  let nextVersionValue =
    options.nextQueueVersion ?? nextPriorityQueueVersion(options.config, options.nextQueueVersion)
  let lastQueueVersion = initialQueueVersion ?? 0

  const allocateQueueVersion = () => {
    const versions = {
      expectedQueueVersion: nextExpectedVersion,
      nextQueueVersion: nextVersionValue,
    }

    nextExpectedVersion = versions.nextQueueVersion
    nextVersionValue = versions.nextQueueVersion + 1
    if (versions.nextQueueVersion !== undefined) {
      lastQueueVersion = versions.nextQueueVersion
    }

    return versions
  }

  if (activeStack.length > targetCount) {
    const toRemove = activeStack.slice(targetCount)
    toRemove.forEach(entry => {
      const { expectedQueueVersion, nextQueueVersion } = allocateQueueVersion()
      eventsToEmit.push(
        events.bronzeTaskRemoved({
          id: entry.id,
          removedAt: now,
          expectedQueueVersion,
          nextQueueVersion,
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

    additions.forEach((item, index) => {
      const { expectedQueueVersion, nextQueueVersion } = allocateQueueVersion()
      eventsToEmit.push(
        events.bronzeTaskAdded({
          id: options.idFactory?.(item) ?? generateId(),
          taskId: item.taskId,
          position: activeStack.length + index,
          insertedAt: now,
          insertedBy: options.insertedBy ?? options.actorId,
          expectedQueueVersion,
          nextQueueVersion,
          actorId: options.actorId,
        })
      )
    })
  }

  return {
    events: eventsToEmit,
    nextQueueVersion: eventsToEmit.length > 0 ? lastQueueVersion : (initialQueueVersion ?? 0),
    expectedQueueVersion: initialQueueVersion,
  }
}
