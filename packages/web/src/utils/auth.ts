/**
 * Auth utilities for frontend token management
 */

import { AuthTokens, AuthUser, TOKEN_STORAGE_KEYS, AUTH_ENDPOINTS } from '@work-squared/shared/auth'

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

  try {
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

  // TODO: Add token expiry check here if needed
  // For now, return the stored token and let the server handle validation
  return tokens.accessToken
}
