/**
 * Basic Auth Context for Work Squared
 * Manages authentication state and token refresh
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { AuthUser, AuthTokens, ConnectionState } from '@work-squared/shared/auth'
import {
  getStoredTokens,
  getStoredUser,
  storeTokens,
  storeUser,
  clearStoredAuth,
  refreshAccessToken,
  login as authLogin,
  logout as authLogout,
  isAuthenticated,
  getCurrentAccessToken,
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

  // Initialize auth state from localStorage
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

    initializeAuth()
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
  }, [])

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const newTokens = await refreshAccessToken()
      if (newTokens) {
        setTokens(newTokens)
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

  const getCurrentToken = useCallback(async (): Promise<string | null> => {
    return getCurrentAccessToken()
  }, [])

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
    isAuthenticated: isAuthenticated(),
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
