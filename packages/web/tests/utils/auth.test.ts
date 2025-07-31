/**
 * Tests for auth utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  storeTokens,
  getStoredTokens,
  storeUser,
  getStoredUser,
  clearStoredAuth,
  isAuthenticated,
} from '../../src/utils/auth.js'
import { AuthTokens, AuthUser } from '@work-squared/shared/auth'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Auth utilities', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('token storage', () => {
    const mockTokens: AuthTokens = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
    }

    it('should store and retrieve tokens', () => {
      storeTokens(mockTokens)
      const retrieved = getStoredTokens()

      expect(retrieved).toEqual(mockTokens)
    })

    it('should return null when no tokens stored', () => {
      const retrieved = getStoredTokens()
      expect(retrieved).toBeNull()
    })

    it('should return null when tokens are incomplete', () => {
      localStorage.setItem('work-squared-access-token', 'access-token')
      // Missing refresh token

      const retrieved = getStoredTokens()
      expect(retrieved).toBeNull()
    })

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error and suppress console.error
      const originalGetItem = localStorage.getItem
      const originalConsoleError = console.error
      console.error = vi.fn()

      localStorage.getItem = vi.fn(() => {
        throw new Error('localStorage error')
      })

      const retrieved = getStoredTokens()
      expect(retrieved).toBeNull()

      // Restore
      localStorage.getItem = originalGetItem
      console.error = originalConsoleError
    })
  })

  describe('user storage', () => {
    const mockUser: AuthUser = {
      id: 'user-123',
      email: 'test@example.com',
      instances: [
        {
          id: 'instance-456',
          name: 'Test Workspace',
          createdAt: new Date(),
          lastAccessedAt: new Date(),
          isDefault: true,
        },
      ],
    }

    it('should store and retrieve user info', () => {
      storeUser(mockUser)
      const retrieved = getStoredUser()

      // Note: Date objects become strings after JSON serialization
      const expectedUser = {
        ...mockUser,
        instances: mockUser.instances.map(instance => ({
          ...instance,
          createdAt: instance.createdAt.toISOString(),
          lastAccessedAt: instance.lastAccessedAt.toISOString(),
        })),
      }

      expect(retrieved).toEqual(expectedUser)
    })

    it('should return null when no user stored', () => {
      const retrieved = getStoredUser()
      expect(retrieved).toBeNull()
    })

    it('should handle JSON parse errors gracefully', () => {
      // Suppress console.error for this test
      const originalConsoleError = console.error
      console.error = vi.fn()

      localStorage.setItem('work-squared-user-info', 'invalid-json')

      const retrieved = getStoredUser()
      expect(retrieved).toBeNull()

      // Restore
      console.error = originalConsoleError
    })
  })

  describe('clearStoredAuth', () => {
    it('should clear all stored auth data', () => {
      const mockTokens: AuthTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        instances: [],
      }

      storeTokens(mockTokens)
      storeUser(mockUser)

      // Verify data is stored
      expect(getStoredTokens()).toEqual(mockTokens)
      expect(getStoredUser()).toEqual(mockUser)

      clearStoredAuth()

      // Verify data is cleared
      expect(getStoredTokens()).toBeNull()
      expect(getStoredUser()).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when both tokens are present', () => {
      const mockTokens: AuthTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      storeTokens(mockTokens)
      expect(isAuthenticated()).toBe(true)
    })

    it('should return false when no tokens are stored', () => {
      expect(isAuthenticated()).toBe(false)
    })

    it('should return false when only access token is present', () => {
      localStorage.setItem('work-squared-access-token', 'access-token')
      expect(isAuthenticated()).toBe(false)
    })

    it('should return false when only refresh token is present', () => {
      localStorage.setItem('work-squared-refresh-token', 'refresh-token')
      expect(isAuthenticated()).toBe(false)
    })
  })
})
