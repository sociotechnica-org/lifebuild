// Navigation utilities that preserve storeId query parameter

import type { AuthUser } from '@lifebuild/shared/auth'

export const getStoreIdFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null

  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('storeId')
}

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

export const preserveStoreIdInUrl = (path: string): string => {
  return buildUrlWithStoreId(path)
}

/**
 * Determines the storeId based solely on user data (ignoring URL)
 * Priority order:
 * 1. User's defaultInstanceId (if it exists in their instances)
 * 2. User's first instance
 * 3. Stored storeId from localStorage
 * 4. Generate new UUID
 */
export const determineStoreIdFromUser = (user: AuthUser | null | undefined): string => {
  // 1. Try user's defaultInstanceId (verify it exists in their instances)
  if (user?.defaultInstanceId && user.instances?.some(i => i.id === user.defaultInstanceId)) {
    return user.defaultInstanceId
  }

  // 2. Try user's first instance
  if (user?.instances && user.instances.length > 0 && user.instances[0]) {
    return user.instances[0].id
  }

  // 3. Try localStorage as fallback
  const storedStoreId = localStorage.getItem('storeId')
  if (storedStoreId) {
    return storedStoreId
  }

  // 4. Generate new UUID
  return crypto.randomUUID()
}

/**
 * Determines the appropriate storeId to use based on user data and current context
 * Priority order:
 * 1. Existing storeId in the target URL
 * 2. User's defaultInstanceId (if it exists in their instances)
 * 3. User's first instance
 * 4. Stored storeId from localStorage
 * 5. Generate new UUID
 */
export const determineStoreId = (targetUrl: string, user: AuthUser | null | undefined): string => {
  // 1. Check if target URL already has a storeId
  try {
    const url = new URL(targetUrl, window.location.origin)
    const existingStoreId = url.searchParams.get('storeId')
    if (existingStoreId) {
      return existingStoreId
    }
  } catch {
    // If URL parsing fails, continue with other methods
  }

  // 2-5. Use the user-based determination for everything else
  return determineStoreIdFromUser(user)
}

/**
 * Builds a redirect URL with the appropriate storeId appended based on user data
 * This is the primary function to use for post-login redirects
 * @param path - The path to redirect to (can be absolute or relative)
 * @param user - The authenticated user object
 * @returns URL with storeId query parameter
 */
export const buildRedirectUrl = (path: string, user: AuthUser | null | undefined): string => {
  try {
    // Parse the URL (handle both absolute and relative paths)
    const url = new URL(path, window.location.origin)

    // Determine the appropriate storeId
    const storeId = determineStoreId(path, user)

    // Add or update the storeId parameter
    url.searchParams.set('storeId', storeId)

    // Return relative path with search params and hash (pathname + search + hash)
    return url.pathname + url.search + url.hash
  } catch (error) {
    console.error('Error building redirect URL:', error)
    // Fallback: return original path
    return path
  }
}
