// Session ID management for demo mode
export function getSessionIdFromUrl(): string | null {
  if (typeof window === 'undefined' || !window.location?.pathname) {
    return null
  }

  const path = window.location.pathname
  const match = path.match(/^\/session\/([^\/]+)/)
  return match?.[1] ?? null
}

export function getOrCreateSessionId(): string {
  // First check if we're already on a session URL
  const urlSessionId = getSessionIdFromUrl()
  if (urlSessionId) {
    // Store it in localStorage for future reference
    localStorage.setItem('sessionId', urlSessionId)
    return urlSessionId
  }

  // Check localStorage for existing session
  let sessionId = localStorage.getItem('sessionId')
  if (!sessionId) {
    // Generate new session ID
    sessionId = crypto.randomUUID()
    localStorage.setItem('sessionId', sessionId)
  }

  return sessionId
}

export function clearSessionId(): void {
  localStorage.removeItem('sessionId')
}
