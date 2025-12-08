import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import {
  ACCESS_TOKEN_REFRESH_BUFFER_SECONDS,
  decodeAccessToken,
  getAccessTokenExpiry,
  getCurrentAccessToken,
  isAccessTokenExpiringSoon,
  storeTokens,
  clearStoredAuth,
  getStoredTokens,
  storeUser,
  getStoredUser,
  isAuthenticated,
} from './auth.js'
import { TOKEN_STORAGE_KEYS, type AuthTokens, type AuthUser } from '@lifebuild/shared/auth'

const encodeSegment = (input: object) =>
  Buffer.from(JSON.stringify(input))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const createTestToken = (payload: Record<string, unknown>) => {
  const header = { alg: 'HS256', typ: 'JWT' }
  return `${encodeSegment(header)}.${encodeSegment(payload)}.signature`
}

describe('auth utils', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    clearStoredAuth()
    vi.restoreAllMocks()
  })

  it('decodes access tokens safely', () => {
    const exp = Math.floor(Date.now() / 1000) + 300
    const token = createTestToken({ exp, userId: 'user-123' })

    const decoded = decodeAccessToken(token)

    expect(decoded).toMatchObject({ exp, userId: 'user-123' })
    expect(getAccessTokenExpiry(token)).toBe(exp * 1000)
  })

  it('detects tokens expiring within the refresh buffer', () => {
    const expSoon = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_REFRESH_BUFFER_SECONDS / 2
    const token = createTestToken({ exp: expSoon })

    expect(isAccessTokenExpiringSoon(token, ACCESS_TOKEN_REFRESH_BUFFER_SECONDS)).toBe(true)
  })

  it('refreshes the access token when expiring', async () => {
    const expiring = Math.floor(Date.now() / 1000) + 60
    const refreshed = Math.floor(Date.now() / 1000) + 60 * 10

    const currentAccessToken = createTestToken({ exp: expiring })
    const currentRefreshToken = 'refresh-123'
    const newAccessToken = createTestToken({ exp: refreshed })
    const newRefreshToken = 'refresh-456'

    storeTokens({ accessToken: currentAccessToken, refreshToken: currentRefreshToken })

    vi.stubEnv('VITE_AUTH_SERVICE_URL', 'https://auth.test')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    const token = await getCurrentAccessToken()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('https://auth.test/refresh', expect.any(Object))
    expect(token).toBe(newAccessToken)
    expect(localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN)).toBe(newAccessToken)
    expect(localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN)).toBe(newRefreshToken)
  })

  describe('token storage helpers', () => {
    const mockTokens: AuthTokens = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
    }

    it('stores and retrieves both tokens', () => {
      storeTokens(mockTokens)
      expect(getStoredTokens()).toEqual(mockTokens)
    })

    it('returns null when tokens are missing or incomplete', () => {
      expect(getStoredTokens()).toBeNull()
      localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, 'access-only')
      expect(getStoredTokens()).toBeNull()
    })

    it('guards against storage failures', () => {
      const originalGetItem = localStorage.getItem
      const originalConsoleError = console.error
      console.error = vi.fn()
      localStorage.getItem = vi.fn(() => {
        throw new Error('storage error')
      })

      expect(getStoredTokens()).toBeNull()

      localStorage.getItem = originalGetItem
      console.error = originalConsoleError
    })
  })

  describe('user storage helpers', () => {
    const mockUser: AuthUser = {
      id: 'user-123',
      email: 'test@example.com',
      instances: [
        {
          id: 'instance-456',
          name: 'Test Workspace',
          createdAt: new Date(),
          lastAccessedAt: new Date(),
          role: 'owner',
          isDefault: true,
        },
      ],
    }

    it('stores and retrieves the serialized user', () => {
      storeUser(mockUser)
      const retrieved = getStoredUser()

      const expectedInstances = mockUser.instances.map(instance => ({
        ...instance,
        createdAt: instance.createdAt.toISOString(),
        lastAccessedAt: instance.lastAccessedAt.toISOString(),
      }))

      expect(retrieved).toEqual({ ...mockUser, instances: expectedInstances })
    })

    it('returns null when no user data exists', () => {
      expect(getStoredUser()).toBeNull()
    })

    it('handles malformed JSON gracefully', () => {
      const originalConsoleError = console.error
      console.error = vi.fn()

      localStorage.setItem(TOKEN_STORAGE_KEYS.USER_INFO, 'not-json')
      expect(getStoredUser()).toBeNull()

      console.error = originalConsoleError
    })
  })

  describe('clearStoredAuth', () => {
    it('removes persisted tokens and user data', () => {
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

      expect(getStoredTokens()).toEqual(mockTokens)
      expect(getStoredUser()).toEqual({
        ...mockUser,
        instances: [],
      })

      clearStoredAuth()

      expect(getStoredTokens()).toBeNull()
      expect(getStoredUser()).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    const tokens: AuthTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }

    it('returns true when both tokens exist', () => {
      storeTokens(tokens)
      expect(isAuthenticated()).toBe(true)
    })

    it('returns false when tokens are missing', () => {
      expect(isAuthenticated()).toBe(false)
      localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, 'access-only')
      expect(isAuthenticated()).toBe(false)
      localStorage.clear()
      localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, 'refresh-only')
      expect(isAuthenticated()).toBe(false)
    })
  })
})
