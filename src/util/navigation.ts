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

  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}storeId=${currentStoreId}`
}

export const preserveStoreIdInUrl = (path: string): string => {
  return buildUrlWithStoreId(path)
}
