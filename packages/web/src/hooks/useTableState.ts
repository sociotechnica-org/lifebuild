import { useCallback, useMemo } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { getTableBronzeStack$, getTableConfiguration$ } from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import {
  nextConfigurationVersion,
  nextPriorityQueueVersion,
  type PriorityQueueItem,
} from '@work-squared/shared/table-state'
import type { TableBronzeStackEntry, TableConfiguration } from '@work-squared/shared/schema'

export interface UseTableStateResult {
  configuration: TableConfiguration | null
  bronzeStack: TableBronzeStackEntry[]
  activeBronzeStack: TableBronzeStackEntry[]
  initializeConfiguration: (overrides?: Partial<TableConfiguration>) => Promise<void>
  assignGold: (projectId: string) => Promise<void>
  clearGold: () => Promise<void>
  assignSilver: (projectId: string) => Promise<void>
  clearSilver: () => Promise<void>
  setBronzeMode: (mode: TableConfiguration['bronzeMode'], extra?: number) => Promise<void>
  addBronzeTask: (taskId: string, position?: number) => Promise<void>
  removeBronzeTask: (entryId: string) => Promise<void>
  reorderBronzeStack: (
    entries: Array<Pick<PriorityQueueItem, 'taskId'> & { id: string }>
  ) => Promise<void>
}

export function useTableState(): UseTableStateResult {
  const { store } = useStore()

  const configurationRow = useQuery(getTableConfiguration$)
  const bronzeStack = (useQuery(getTableBronzeStack$) ?? []) as TableBronzeStackEntry[]

  const configuration = useMemo<TableConfiguration | null>(() => {
    if (!configurationRow || configurationRow.length === 0) return null
    return configurationRow[0] ?? null
  }, [configurationRow])

  const activeBronzeStack = useMemo<TableBronzeStackEntry[]>(
    () =>
      [...bronzeStack]
        .filter(entry => entry.status === 'active')
        .sort((a, b) => a.position - b.position),
    [bronzeStack]
  )

  const ensureConfigurationLoaded = useCallback((): TableConfiguration => {
    if (!configuration) {
      throw new Error('Table configuration has not been loaded yet')
    }
    return configuration
  }, [configuration])

  const initializeConfiguration = useCallback(
    async (overrides?: Partial<TableConfiguration>) => {
      const now = new Date()
      return store.commit(
        events.tableConfigurationInitialized({
          goldProjectId: overrides?.goldProjectId ?? null,
          silverProjectId: overrides?.silverProjectId ?? null,
          bronzeMode: overrides?.bronzeMode ?? 'minimal',
          bronzeTargetExtra: overrides?.bronzeTargetExtra ?? 0,
          version: overrides?.version ?? configuration?.version ?? 0,
          priorityQueueVersion:
            overrides?.priorityQueueVersion ?? configuration?.priorityQueueVersion ?? 0,
          updatedAt: now,
        })
      )
    },
    [configuration?.priorityQueueVersion, configuration?.version, store]
  )

  const assignGold = useCallback(
    async (projectId: string) => {
      const loadedConfiguration = ensureConfigurationLoaded()
      const now = new Date()
      return store.commit(
        events.tableGoldAssigned({
          projectId,
          expectedVersion: loadedConfiguration.version,
          nextVersion: nextConfigurationVersion(loadedConfiguration),
          updatedAt: now,
        })
      )
    },
    [ensureConfigurationLoaded, store]
  )

  const clearGold = useCallback(async () => {
    const loadedConfiguration = ensureConfigurationLoaded()
    const now = new Date()
    return store.commit(
      events.tableGoldCleared({
        expectedVersion: loadedConfiguration.version,
        nextVersion: nextConfigurationVersion(loadedConfiguration),
        updatedAt: now,
      })
    )
  }, [ensureConfigurationLoaded, store])

  const assignSilver = useCallback(
    async (projectId: string) => {
      const loadedConfiguration = ensureConfigurationLoaded()
      const now = new Date()
      return store.commit(
        events.tableSilverAssigned({
          projectId,
          expectedVersion: loadedConfiguration.version,
          nextVersion: nextConfigurationVersion(loadedConfiguration),
          updatedAt: now,
        })
      )
    },
    [ensureConfigurationLoaded, store]
  )

  const clearSilver = useCallback(async () => {
    const loadedConfiguration = ensureConfigurationLoaded()
    const now = new Date()
    return store.commit(
      events.tableSilverCleared({
        expectedVersion: loadedConfiguration.version,
        nextVersion: nextConfigurationVersion(loadedConfiguration),
        updatedAt: now,
      })
    )
  }, [ensureConfigurationLoaded, store])

  const setBronzeMode = useCallback(
    async (mode: TableConfiguration['bronzeMode'], extra = 0) => {
      const loadedConfiguration = ensureConfigurationLoaded()
      const now = new Date()
      return store.commit(
        events.tableBronzeModeUpdated({
          bronzeMode: mode,
          bronzeTargetExtra: extra,
          expectedVersion: loadedConfiguration.version,
          nextVersion: nextConfigurationVersion(loadedConfiguration),
          updatedAt: now,
        })
      )
    },
    [ensureConfigurationLoaded, store]
  )

  const addBronzeTask = useCallback(
    async (taskId: string, position?: number) => {
      const loadedConfiguration = ensureConfigurationLoaded()
      const now = new Date()
      const nextQueueVersion = nextPriorityQueueVersion(loadedConfiguration)
      const resolvedPosition =
        position ?? activeBronzeStack.slice().sort((a, b) => a.position - b.position).length

      return store.commit(
        events.bronzeTaskAdded({
          id: crypto.randomUUID(),
          taskId,
          position: resolvedPosition,
          insertedAt: now,
          insertedBy: undefined,
          expectedQueueVersion: loadedConfiguration.priorityQueueVersion,
          nextQueueVersion,
        })
      )
    },
    [activeBronzeStack, ensureConfigurationLoaded, store]
  )

  const removeBronzeTask = useCallback(
    async (entryId: string) => {
      const loadedConfiguration = ensureConfigurationLoaded()
      const now = new Date()
      const nextQueueVersion = nextPriorityQueueVersion(loadedConfiguration)
      return store.commit(
        events.bronzeTaskRemoved({
          id: entryId,
          removedAt: now,
          expectedQueueVersion: loadedConfiguration.priorityQueueVersion,
          nextQueueVersion,
        })
      )
    },
    [ensureConfigurationLoaded, store]
  )

  const reorderBronzeStack = useCallback(
    async (entries: Array<Pick<PriorityQueueItem, 'taskId'> & { id: string }>) => {
      const loadedConfiguration = ensureConfigurationLoaded()
      const now = new Date()
      const nextQueueVersion = nextPriorityQueueVersion(loadedConfiguration)
      const ordering = entries.map((entry, index) => ({
        id: entry.id,
        position: index,
      }))

      return store.commit(
        events.bronzeStackReordered({
          ordering,
          expectedQueueVersion: loadedConfiguration.priorityQueueVersion,
          nextQueueVersion,
          updatedAt: now,
        })
      )
    },
    [ensureConfigurationLoaded, store]
  )

  return {
    configuration,
    bronzeStack,
    activeBronzeStack,
    initializeConfiguration,
    assignGold,
    clearGold,
    assignSilver,
    clearSilver,
    setBronzeMode,
    addBronzeTask,
    removeBronzeTask,
    reorderBronzeStack,
  }
}
