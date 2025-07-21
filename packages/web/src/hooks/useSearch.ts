import { useMemo } from 'react'

export interface SearchableItem {
  id: string
  [key: string]: any
}

export interface SearchConfig<T extends SearchableItem> {
  searchFields: Array<keyof T>
  filterFn?: (item: T) => boolean
}

/**
 * Custom hook for client-side search functionality
 * @param items - Array of items to search through
 * @param query - Search query string
 * @param config - Configuration object specifying search fields and filters
 * @returns Filtered array of items
 */
export function useSearch<T extends SearchableItem>(
  items: readonly T[],
  query: string,
  config: SearchConfig<T>
): T[] {
  return useMemo(() => {
    let filtered = [...items] // Convert readonly array to mutable array

    // Apply custom filter if provided
    if (config.filterFn) {
      filtered = filtered.filter(config.filterFn)
    }

    // Apply search filter
    if (query.trim()) {
      const searchQuery = query.toLowerCase()
      filtered = filtered.filter(item =>
        config.searchFields.some(field => {
          const value = item[field]
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchQuery)
          }
          return false
        })
      )
    }

    return filtered
  }, [items, query, config])
}
