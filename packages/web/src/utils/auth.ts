/**
 * Auth utilities for frontend token management
 */

import { AuthTokens, AuthUser, TOKEN_STORAGE_KEYS, AUTH_ENDPOINTS } from '@work-squared/shared/auth'

export interface DecodedAccessToken {
  exp?: number
  iat?: number
  [key: string]: unknown
}

interface RefreshLockPayload {
  ownerId: string
  expiresAt: number
}

export const ACCESS_TOKEN_REFRESH_BUFFER_SECONDS = 120
const REFRESH_LOCK_KEY = 'work-squared-refresh-lock'
const REFRESH_LOCK_TTL_MS = 5000
const REFRESH_LOCK_WAIT_MS = 4000
const REFRESH_LOCK_POLL_INTERVAL_MS = 150
const TAB_LOCK_ID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tab-${Math.random().toString(36).slice(2)}-${Date.now()}`

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function decodeBase64Url(chunk: string): string {
  const normalized = chunk.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  const base64 = normalized + padding

  if (typeof atob === 'function') {
    return atob(base64)
  }

  if (typeof (globalThis as any).atob === 'function') {
    return (globalThis as any).atob(base64)
  }

  const globalBuffer = (globalThis as any)?.Buffer
  if (typeof globalBuffer !== 'undefined') {
    return globalBuffer.from(base64, 'base64').toString('binary')
  }

  throw new Error('No base64 decoder available')
}

export function decodeAccessToken(token: string): DecodedAccessToken | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) {
      return null
    }

    const payloadSegment = parts[1]
    if (!payloadSegment) {
      return null
    }
    const json = decodeBase64Url(payloadSegment)
    return JSON.parse(json)
  } catch (error) {
    console.error('Failed to decode JWT payload', error)
    return null
  }
}

export function getAccessTokenExpiry(accessToken: string): number | null {
  const decoded = decodeAccessToken(accessToken)
  if (!decoded || typeof decoded.exp !== 'number') {
    return null
  }

  return decoded.exp * 1000
}

export function isAccessTokenExpiringSoon(accessToken: string, bufferSeconds: number): boolean {
  const expiry = getAccessTokenExpiry(accessToken)
  if (!expiry) {
    return true
  }

  const bufferMs = bufferSeconds * 1000
  return Date.now() >= expiry - bufferMs
}

function getRefreshLock(): RefreshLockPayload | null {
  if (!isBrowserEnvironment()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(REFRESH_LOCK_KEY)
    if (!raw) {
      return null
    }
    return JSON.parse(raw) as RefreshLockPayload
  } catch {
    return null
  }
}

function setRefreshLock(payload: RefreshLockPayload): void {
  if (!isBrowserEnvironment()) {
    return
  }

  try {
    window.localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify(payload))
  } catch (error) {
    console.error('Failed to set refresh lock', error)
  }
}

function clearRefreshLock(): void {
  if (!isBrowserEnvironment()) {
    return
  }

  try {
    const existing = getRefreshLock()
    if (existing?.ownerId === TAB_LOCK_ID) {
      window.localStorage.removeItem(REFRESH_LOCK_KEY)
    }
  } catch (error) {
    console.error('Failed to clear refresh lock', error)
  }
}

function removeExpiredRefreshLock(): void {
  if (!isBrowserEnvironment()) {
    return
  }

  const lock = getRefreshLock()
  if (lock && lock.expiresAt <= Date.now()) {
    try {
      window.localStorage.removeItem(REFRESH_LOCK_KEY)
    } catch (error) {
      console.error('Failed to remove expired refresh lock', error)
    }
  }
}

async function acquireRefreshLock(): Promise<boolean> {
  if (!isBrowserEnvironment()) {
    return true
  }

  const start = Date.now()
  while (true) {
    removeExpiredRefreshLock()

    const currentLock = getRefreshLock()
    if (!currentLock || currentLock.ownerId === TAB_LOCK_ID) {
      setRefreshLock({
        ownerId: TAB_LOCK_ID,
        expiresAt: Date.now() + REFRESH_LOCK_TTL_MS,
      })
      return true
    }

    if (Date.now() - start >= REFRESH_LOCK_WAIT_MS) {
      return false
    }

    await new Promise(resolve => setTimeout(resolve, REFRESH_LOCK_POLL_INTERVAL_MS))
  }
}

function releaseRefreshLock(): void {
  clearRefreshLock()
}

/**
 * Get stored auth tokens from localStorage
 */
export function getStoredTokens(): AuthTokens | null {
  try {
    const accessToken = localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN)
    const refreshToken = localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN)

    if (accessToken && refreshToken) {
      return { accessToken, refreshToken }
    }
    return null
  } catch (error) {
    console.error('Error reading stored tokens:', error)
    return null
  }
}

/**
 * Store auth tokens in localStorage
 */
export function storeTokens(tokens: AuthTokens): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken)
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
  } catch (error) {
    console.error('Error storing tokens:', error)
  }
}

/**
 * Get stored user info
 */
export function getStoredUser(): AuthUser | null {
  try {
    const userJson = localStorage.getItem(TOKEN_STORAGE_KEYS.USER_INFO)
    return userJson ? JSON.parse(userJson) : null
  } catch (error) {
    console.error('Error reading stored user:', error)
    return null
  }
}

/**
 * Store user info in localStorage
 */
export function storeUser(user: AuthUser): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEYS.USER_INFO, JSON.stringify(user))
  } catch (error) {
    console.error('Error storing user:', error)
  }
}

/**
 * Clear all stored auth data
 */
export function clearStoredAuth(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(TOKEN_STORAGE_KEYS.USER_INFO)
    localStorage.removeItem(REFRESH_LOCK_KEY)
  } catch (error) {
    console.error('Error clearing stored auth:', error)
  }
}

/**
 * Get auth service URL from environment
 */
export function getAuthServiceUrl(): string {
  // Check various environment variable formats
  const authUrl =
    import.meta.env.VITE_AUTH_SERVICE_URL ||
    import.meta.env.AUTH_SERVICE_URL ||
    'https://work-squared-auth.jessmartin.workers.dev' // Fallback to deployed service

  return authUrl
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<AuthTokens | null> {
  const tokens = getStoredTokens()
  if (!tokens?.refreshToken) {
    return null
  }

  const lockAcquired = await acquireRefreshLock()

  try {
    if (!lockAcquired) {
      // Another tab is refreshing; wait briefly and reuse stored tokens if valid
      await new Promise(resolve => setTimeout(resolve, REFRESH_LOCK_POLL_INTERVAL_MS))
      const updatedTokens = getStoredTokens()
      if (
        updatedTokens?.accessToken &&
        !isAccessTokenExpiringSoon(updatedTokens.accessToken, ACCESS_TOKEN_REFRESH_BUFFER_SECONDS)
      ) {
        return updatedTokens
      }
    }

    const response = await fetch(`${getAuthServiceUrl()}${AUTH_ENDPOINTS.REFRESH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    const data = await response.json()
    if (data.success && data.accessToken && data.refreshToken) {
      const newTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }
      storeTokens(newTokens)

      // Update user info if provided
      if (data.user) {
        storeUser(data.user)
      }

      return newTokens
    }

    throw new Error('Invalid refresh response')
  } catch (error) {
    console.error('Token refresh failed:', error)
    // Clear invalid tokens
    clearStoredAuth()
    return null
  } finally {
    releaseRefreshLock()
  }
}

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string
): Promise<{ user: AuthUser; tokens: AuthTokens } | null> {
  try {
    const response = await fetch(`${getAuthServiceUrl()}${AUTH_ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`)
    }

    const data = await response.json()
    if (data.success && data.user && data.accessToken && data.refreshToken) {
      const tokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }

      storeTokens(tokens)
      storeUser(data.user)

      return { user: data.user, tokens }
    }

    throw new Error('Invalid login response')
  } catch (error) {
    console.error('Login failed:', error)
    return null
  }
}

/**
 * Logout and clear stored data
 */
export async function logout(): Promise<void> {
  const tokens = getStoredTokens()

  // Try to notify server of logout
  if (tokens?.refreshToken) {
    try {
      await fetch(`${getAuthServiceUrl()}${AUTH_ENDPOINTS.LOGOUT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      })
    } catch (error) {
      console.error('Logout request failed:', error)
      // Continue with local cleanup even if server request fails
    }
  }

  clearStoredAuth()
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  const tokens = getStoredTokens()
  return !!(tokens?.accessToken && tokens?.refreshToken)
}

/**
 * Get current access token (with automatic refresh attempt)
 */
export async function getCurrentAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens()
  if (!tokens?.accessToken) {
    return null
  }

  if (isAccessTokenExpiringSoon(tokens.accessToken, ACCESS_TOKEN_REFRESH_BUFFER_SECONDS)) {
    const refreshed = await refreshAccessToken()
    if (refreshed?.accessToken) {
      return refreshed.accessToken
    }

    return null
  }

  return tokens.accessToken
}

/**
 * Get current user info (for event metadata)
 */
export function getCurrentUser(): AuthUser | null {
  return getStoredUser()
}
