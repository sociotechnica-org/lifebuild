import { useCallback, useMemo } from 'react'
import { useQuery, useStore } from '../livestore-compat.js'
import { getTableBronzeStack$, getTableConfiguration$ } from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import { type PriorityQueueItem } from '@lifebuild/shared/table-state'
import type { TableBronzeStackEntry, TableConfiguration } from '@lifebuild/shared/schema'

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
  addBronzeTask: (taskId: string, position?: number, initializeIfNeeded?: boolean) => Promise<void>
  removeBronzeTask: (entryId: string) => Promise<void>
  reorderBronzeStack: (
    entries: Array<Pick<PriorityQueueItem, 'taskId'> & { id: string }>
  ) => Promise<void>
}

export function useTableState(): UseTableStateResult {
  const { store } = useStore()

  const configurationRow = useQuery(getTableConfiguration$)
  const bronzeStack = (useQuery(getTableBronzeStack$) ?? []) as TableBronzeStackEntry[]

  // Distinguish between "loading" (undefined) vs "no config exists" (empty array)
  const isConfigurationLoaded = configurationRow !== undefined
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
    async (taskId: string, position?: number, initializeIfNeeded = false) => {
      // If initializeIfNeeded is true, only initialize if the query has loaded AND no config exists.
      // This prevents accidentally reinitializing an existing config during the initial hydration period.
      if (initializeIfNeeded && isConfigurationLoaded && !configuration) {
        await initializeConfiguration({})
      } else if (!initializeIfNeeded) {
        // Only throw if we're not in auto-initialize mode
        ensureConfigurationLoaded()
      }
      // If initializeIfNeeded is true but query hasn't loaded yet, we proceed
      // without initialization - the bronzeTaskAdded event will still be committed
      // and will work once the config is available.

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
    [
      activeBronzeStack,
      configuration,
      ensureConfigurationLoaded,
      initializeConfiguration,
      isConfigurationLoaded,
      store,
    ]
  )

  const removeBronzeTask = useCallback(
    async (entryId: string) => {
      // If query is still loading, proceed anyway - the event will work once config loads.
      // Only throw if query has loaded but no config exists.
      if (isConfigurationLoaded && !configuration) {
        throw new Error('Table configuration has not been initialized')
      }
      const now = new Date()
      return store.commit(
        events.bronzeTaskRemoved({
          id: entryId,
          removedAt: now,
        })
      )
    },
    [configuration, isConfigurationLoaded, store]
  )

  const reorderBronzeStack = useCallback(
    async (entries: Array<Pick<PriorityQueueItem, 'taskId'> & { id: string }>) => {
      // If query is still loading, proceed anyway - the event will work once config loads.
      // Only throw if query has loaded but no config exists.
      if (isConfigurationLoaded && !configuration) {
        throw new Error('Table configuration has not been initialized')
      }
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
    [configuration, isConfigurationLoaded, store]
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
