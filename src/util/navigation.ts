// Navigation utilities that preserve storeId query parameter

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
