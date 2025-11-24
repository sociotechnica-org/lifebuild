import { useCallback, useMemo } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { getTableBronzeStack$, getTableConfiguration$ } from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import { type PriorityQueueItem } from '@work-squared/shared/table-state'
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
          goldProjectId: overrides?.goldProjectId ?? configuration?.goldProjectId ?? null,
          silverProjectId: overrides?.silverProjectId ?? configuration?.silverProjectId ?? null,
          bronzeMode: overrides?.bronzeMode ?? configuration?.bronzeMode ?? 'minimal',
          bronzeTargetExtra: overrides?.bronzeTargetExtra ?? configuration?.bronzeTargetExtra ?? 0,
          updatedAt: now,
        })
      )
    },
    [configuration, store]
  )

  const assignGold = useCallback(
    async (projectId: string) => {
      ensureConfigurationLoaded()
      const now = new Date()
      return store.commit(
        events.tableGoldAssigned({
          projectId,
          updatedAt: now,
        })
      )
    },
    [ensureConfigurationLoaded, store]
  )

  const clearGold = useCallback(async () => {
    ensureConfigurationLoaded()
    const now = new Date()
    return store.commit(
      events.tableGoldCleared({
        updatedAt: now,
      })
    )
  }, [ensureConfigurationLoaded, store])

  const assignSilver = useCallback(
    async (projectId: string) => {
      ensureConfigurationLoaded()
      const now = new Date()
      return store.commit(
        events.tableSilverAssigned({
          projectId,
          updatedAt: now,
        })
      )
    },
    [ensureConfigurationLoaded, store]
  )

  const clearSilver = useCallback(async () => {
    ensureConfigurationLoaded()
    const now = new Date()
    return store.commit(
      events.tableSilverCleared({
        updatedAt: now,
      })
    )
  }, [ensureConfigurationLoaded, store])

  const setBronzeMode = useCallback(
    async (mode: TableConfiguration['bronzeMode'], extra = 0) => {
      ensureConfigurationLoaded()
      const now = new Date()
      return store.commit(
        events.tableBronzeModeUpdated({
          bronzeMode: mode,
          bronzeTargetExtra: extra,
          updatedAt: now,
        })
      )
    },
    [ensureConfigurationLoaded, store]
  )

  const addBronzeTask = useCallback(
    async (taskId: string, position?: number) => {
      ensureConfigurationLoaded()
      const now = new Date()
      const resolvedPosition =
        position ??
        (activeBronzeStack.length === 0
          ? 0
          : activeBronzeStack.reduce((max, entry) => Math.max(max, entry.position), -1) + 1)

      return store.commit(
        events.bronzeTaskAdded({
          id: crypto.randomUUID(),
          taskId,
          position: resolvedPosition,
          insertedAt: now,
          insertedBy: undefined,
        })
      )
    },
    [activeBronzeStack, ensureConfigurationLoaded, store]
  )

  const removeBronzeTask = useCallback(
    async (entryId: string) => {
      ensureConfigurationLoaded()
      const now = new Date()
      return store.commit(
        events.bronzeTaskRemoved({
          id: entryId,
          removedAt: now,
        })
      )
    },
    [ensureConfigurationLoaded, store]
  )

  const reorderBronzeStack = useCallback(
    async (entries: Array<Pick<PriorityQueueItem, 'taskId'> & { id: string }>) => {
      ensureConfigurationLoaded()
      const now = new Date()
      const ordering = entries.map((entry, index) => ({
        id: entry.id,
        position: index,
      }))

      return store.commit(
        events.bronzeStackReordered({
          ordering,
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
