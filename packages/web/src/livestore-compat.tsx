/**
 * LiveStore Compatibility Layer
 *
 * This module provides backward-compatible wrappers for the new LiveStore API (0.4.0-dev.22+).
 * It maintains the old API patterns used throughout the codebase:
 * - LiveStoreProvider with props (schema, adapter, storeId, etc.)
 * - useStore() returning { store }
 * - useQuery(query$) without explicit store parameter
 */
import React, { createContext, useContext, useMemo, Suspense, type ReactNode } from 'react'
import {
  StoreRegistry,
  StoreRegistryProvider,
  useStore as useStoreNew,
  storeOptions,
  useQuery as useQueryNew,
} from '@livestore/react'
import type { Store, RegistryStoreOptions, Queryable, LiveStoreSchema } from '@livestore/livestore'

// Context to store the current store instance for useQuery without explicit store
const StoreInstanceContext = createContext<Store | null>(null)

export interface LiveStoreProviderProps {
  schema: LiveStoreSchema
  adapter: RegistryStoreOptions['adapter']
  /** Store ID - defaults to a random UUID if not provided (useful for Storybook) */
  storeId?: string
  batchUpdates?: (callback: () => void) => void
  syncPayload?: RegistryStoreOptions['syncPayload']
  boot?: RegistryStoreOptions['boot']
  renderLoading?: (state: { stage: string }) => ReactNode
  children: ReactNode
}

// Internal component that loads the store and provides it via context
// This component suspends until the store is loaded
const StoreLoader: React.FC<{
  options: RegistryStoreOptions
  children: ReactNode
}> = ({ options, children }) => {
  // This will suspend until the store is loaded
  const store = useStoreNew(options)

  return <StoreInstanceContext.Provider value={store}>{children}</StoreInstanceContext.Provider>
}

/**
 * Backward-compatible LiveStoreProvider that wraps the new StoreRegistry API.
 */
export const LiveStoreProvider: React.FC<LiveStoreProviderProps> = ({
  schema,
  adapter,
  storeId: providedStoreId,
  batchUpdates,
  syncPayload,
  boot,
  renderLoading,
  children,
}) => {
  // Generate a stable default storeId if not provided
  const storeId = useMemo(() => providedStoreId ?? crypto.randomUUID(), [providedStoreId])

  // Create a stable StoreRegistry instance
  const storeRegistry = useMemo(
    () =>
      new StoreRegistry({
        defaultOptions: {
          batchUpdates,
        },
      }),
    [batchUpdates]
  )

  // Create stable store options
  const options = useMemo(
    () =>
      storeOptions({
        schema,
        adapter,
        storeId,
        syncPayload,
        boot,
      }),
    [schema, adapter, storeId, syncPayload, boot]
  )

  // Default loading fallback
  const loadingFallback = renderLoading ? renderLoading({ stage: 'loading' }) : null

  return (
    <StoreRegistryProvider storeRegistry={storeRegistry}>
      <Suspense fallback={loadingFallback}>
        <StoreLoader options={options}>{children}</StoreLoader>
      </Suspense>
    </StoreRegistryProvider>
  )
}

/**
 * Backward-compatible useStore hook.
 * Returns { store } to match the old API pattern.
 */
export function useStore(): { store: Store } {
  const store = useContext(StoreInstanceContext)
  if (!store) {
    throw new Error('useStore must be used within a LiveStoreProvider')
  }
  return { store }
}

/**
 * Backward-compatible useQuery hook.
 * Automatically gets the store from context if not provided.
 */
export function useQuery<TQueryable extends Queryable<any>>(
  queryable: TQueryable,
  options?: { store?: Store }
): Queryable.Result<TQueryable> {
  const contextStore = useContext(StoreInstanceContext)
  const store = options?.store ?? contextStore

  if (!store) {
    throw new Error(
      'useQuery must be used within a LiveStoreProvider or receive a store in options'
    )
  }

  return useQueryNew(queryable, { store })
}

// Re-export other utilities from the new API
export { StoreRegistry, StoreRegistryProvider, storeOptions } from '@livestore/react'
