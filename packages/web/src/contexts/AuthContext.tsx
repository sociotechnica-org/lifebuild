/**
 * Basic Auth Context for Work Squared
 * Manages authentication state and token refresh
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { AuthUser, AuthTokens, ConnectionState } from '@work-squared/shared/auth'
import {
  getStoredTokens,
  getStoredUser,
  refreshAccessToken,
  login as authLogin,
  logout as authLogout,
  getCurrentAccessToken,
  getAccessTokenExpiry,
  isAccessTokenExpiringSoon,
  ACCESS_TOKEN_REFRESH_BUFFER_SECONDS,
} from '../utils/auth.js'

interface AuthContextType {
  // State
  user: AuthUser | null
  tokens: AuthTokens | null
  connectionState: ConnectionState
  isLoading: boolean

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  getCurrentToken: () => Promise<string | null>
  handleConnectionError: (error: any) => Promise<boolean>

  // Status
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const tokensEqual = (a: AuthTokens | null, b: AuthTokens | null) => {
  if (a === b) {
    return true
  }
  if (!a || !b) {
    return false
  }
  return a.accessToken === b.accessToken && a.refreshToken === b.refreshToken
}

const usersEqual = (a: AuthUser | null, b: AuthUser | null) => {
  if (a === b) {
    return true
  }
  if (!a || !b) {
    return false
  }

  if (a.id !== b.id || a.email !== b.email || a.isAdmin !== b.isAdmin) {
    return false
  }

  const aInstances = a.instances ?? []
  const bInstances = b.instances ?? []
  if (aInstances.length !== bInstances.length) {
    return false
  }

  for (let i = 0; i < aInstances.length; i++) {
    const instanceA = aInstances[i]
    const instanceB = bInstances[i]

    if (
      instanceA.id !== instanceB.id ||
      instanceA.name !== instanceB.name ||
      String(instanceA.createdAt) !== String(instanceB.createdAt) ||
      String(instanceA.lastAccessedAt) !== String(instanceB.lastAccessedAt) ||
      instanceA.isDefault !== instanceB.isDefault
    ) {
      return false
    }
  }

  return true
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [tokens, setTokens] = useState<AuthTokens | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  )
  const [isLoading, setIsLoading] = useState(true)

  // Track retry attempts to prevent infinite loops
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const refreshTimerRef = useRef<number | null>(null)

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [])

  // Initialize auth state from localStorage and listen for changes
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedTokens = getStoredTokens()
        const storedUser = getStoredUser()

        if (storedTokens && storedUser) {
          setTokens(storedTokens)
          setUser(storedUser)
          setConnectionState(ConnectionState.CONNECTED)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Multi-tab sync: listen for localStorage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'work-squared-access-token') {
        // Auth state changed in another tab
        const storedTokens = getStoredTokens()
        const storedUser = getStoredUser()

        if (storedTokens && storedUser) {
          // Logged in from another tab
          setTokens(storedTokens)
          setUser(storedUser)
          setConnectionState(ConnectionState.AUTHENTICATED)
        } else {
          // Logged out from another tab
          setTokens(null)
          setUser(null)
          setConnectionState(ConnectionState.DISCONNECTED)
        }
      }
    }

    initializeAuth()

    // Listen for storage changes (multi-tab sync)
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const result = await authLogin(email, password)
      if (result) {
        setUser(result.user)
        setTokens(result.tokens)
        setConnectionState(ConnectionState.AUTHENTICATED)
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    clearRefreshTimer()
    retryCountRef.current = 0
    try {
      await authLogout()
      setUser(null)
      setTokens(null)
      setConnectionState(ConnectionState.DISCONNECTED)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [clearRefreshTimer])

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const newTokens = await refreshAccessToken()
      if (newTokens) {
        setTokens(newTokens)
        retryCountRef.current = 0
        return true
      }

      // Refresh failed - logout
      await logout()
      return false
    } catch (error) {
      console.error('Token refresh error:', error)
      await logout()
      return false
    }
  }, [logout])

  const scheduleAccessTokenRefresh = useCallback(
    (accessToken?: string | null) => {
      if (typeof window === 'undefined') {
        return
      }

      clearRefreshTimer()

      if (!accessToken) {
        return
      }

      const expiry = getAccessTokenExpiry(accessToken)
      if (!expiry) {
        void refreshToken()
        return
      }

      const refreshAt = expiry - ACCESS_TOKEN_REFRESH_BUFFER_SECONDS * 1000
      const delay = Math.max(refreshAt - Date.now(), 0)

      refreshTimerRef.current = window.setTimeout(async () => {
        refreshTimerRef.current = null
        const refreshed = await refreshToken()
        if (!refreshed) {
          console.warn('Scheduled token refresh failed; user will be logged out.')
        }
      }, delay)
    },
    [clearRefreshTimer, refreshToken]
  )

  const checkTokenFreshness = useCallback(async () => {
    const stored = getStoredTokens()
    const accessToken = stored?.accessToken
    if (!accessToken) {
      clearRefreshTimer()
      return
    }

    if (isAccessTokenExpiringSoon(accessToken, ACCESS_TOKEN_REFRESH_BUFFER_SECONDS)) {
      await refreshToken()
      return
    }

    scheduleAccessTokenRefresh(accessToken)
  }, [scheduleAccessTokenRefresh, clearRefreshTimer, refreshToken])

  const syncAuthStateFromStorage = useCallback(() => {
    const storedTokens = getStoredTokens()
    const storedUser = getStoredUser()

    setTokens(prev => {
      if (tokensEqual(prev, storedTokens)) {
        return prev
      }
      return storedTokens ?? null
    })

    setUser(prev => {
      if (usersEqual(prev, storedUser)) {
        return prev
      }
      return storedUser ?? null
    })

    if (!storedTokens?.accessToken || !storedTokens?.refreshToken) {
      setConnectionState(ConnectionState.DISCONNECTED)
    }
  }, [setTokens, setUser, setConnectionState])

  useEffect(() => {
    if (!tokens?.accessToken) {
      clearRefreshTimer()
      return
    }

    scheduleAccessTokenRefresh(tokens.accessToken)

    return () => {
      clearRefreshTimer()
    }
  }, [tokens?.accessToken, scheduleAccessTokenRefresh, clearRefreshTimer])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    if (!tokens?.accessToken) {
      return
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkTokenFreshness()
      }
    }

    const handleOnline = () => {
      void checkTokenFreshness()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
    void checkTokenFreshness()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
    }
  }, [tokens?.accessToken, checkTokenFreshness])

  const getCurrentToken = useCallback(async (): Promise<string | null> => {
    try {
      return await getCurrentAccessToken()
    } finally {
      syncAuthStateFromStorage()
    }
  }, [syncAuthStateFromStorage])

  const handleConnectionError = useCallback(
    async (error: any): Promise<boolean> => {
      console.error('Connection error:', error)

      // Check if this is an auth-related error
      const errorMessage = error?.message || error?.toString() || ''
      const isAuthError =
        errorMessage.includes('TOKEN_EXPIRED') ||
        errorMessage.includes('TOKEN_INVALID') ||
        errorMessage.includes('TOKEN_MISSING') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('unauthorized')

      if (!isAuthError) {
        console.log('Non-auth error, not attempting token refresh')
        return false
      }

      // Prevent infinite retry loops
      if (retryCountRef.current >= maxRetries) {
        console.error('Max retry attempts reached, logging out')
        await logout()
        return false
      }

      retryCountRef.current++
      setConnectionState(ConnectionState.RECONNECTING)

      try {
        console.log(`Attempting token refresh (attempt ${retryCountRef.current}/${maxRetries})`)
        const refreshed = await refreshToken()

        if (refreshed) {
          console.log('Token refresh successful, connection should recover')
          retryCountRef.current = 0 // Reset retry count on success
          setConnectionState(ConnectionState.AUTHENTICATED)
          return true
        } else {
          console.error('Token refresh failed')
          setConnectionState(ConnectionState.ERROR)
          return false
        }
      } catch (error) {
        console.error('Error during connection recovery:', error)
        setConnectionState(ConnectionState.ERROR)
        return false
      }
    },
    [refreshToken, logout]
  )

  const contextValue: AuthContextType = {
    user,
    tokens,
    connectionState,
    isLoading,
    login,
    logout,
    refreshToken,
    getCurrentToken,
    handleConnectionError,
    isAuthenticated: Boolean(tokens?.accessToken && tokens?.refreshToken),
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

/**
 * Higher-order component for protected routes
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return <div>Loading authentication...</div>
    }

    if (!isAuthenticated) {
      return <div>Please log in to access this page.</div>
    }

    return <Component {...props} />
  }
}
