/**
 * Utility functions for UI components
 */

import type { AuthUser } from '@lifebuild/shared/auth'

/**
 * Helper function to safely generate initials from a name
 * Handles edge cases like extra spaces, empty names, etc.
 */
export const getInitials = (name: string): string => {
  const initials = name
    .trim()
    .split(/\s+/) // Split on one or more whitespace characters
    .filter(part => part.length > 0) // Filter out empty parts
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) // Limit to 2 characters max

  // Fallback for empty names
  return initials || '?'
}

/**
 * Check if the current user is an admin
 */
export function isCurrentUserAdmin(user: AuthUser | null): boolean {
  if (!user) return false

  // Admin status is already computed and included in the JWT token by the auth service
  return user.isAdmin === true
}

/**
 * Get storeId from URL query parameters
 */
export const getStoreIdFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null

  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('storeId')
}

/**
 * Build a URL with storeId query parameter preserved
 */
export const buildUrlWithStoreId = (path: string, storeId?: string): string => {
  const currentStoreId = storeId || getStoreIdFromUrl()

  if (!currentStoreId) {
    return path
  }

  // Parse existing URL to avoid duplicates
  const [basePath, searchString] = path.split('?')
  const urlParams = new URLSearchParams(searchString || '')

  // Set/update the storeId parameter
  urlParams.set('storeId', currentStoreId)

  return `${basePath}?${urlParams.toString()}`
}

/**
 * Preserve storeId in a navigation URL
 */
export const preserveStoreIdInUrl = (path: string): string => {
  return buildUrlWithStoreId(path)
}
