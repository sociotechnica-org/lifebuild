import { getSessionIdFromUrl } from './session-id.js'

export const getStoreId = () => {
  if (typeof window === 'undefined') return 'unused'

  // For session-based routing, use the sessionId as the storeId
  const sessionId = getSessionIdFromUrl()
  if (sessionId) {
    return sessionId
  }

  // Fallback to original behavior for non-session routes
  const searchParams = new URLSearchParams(window.location.search)
  const storeId = searchParams.get('storeId')
  if (storeId !== null) return storeId

  const newAppId = crypto.randomUUID()
  searchParams.set('storeId', newAppId)

  window.location.search = searchParams.toString()
  return newAppId
}
