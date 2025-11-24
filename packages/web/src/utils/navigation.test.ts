import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { determineStoreId, buildRedirectUrl, getStoreIdFromUrl } from './navigation.js'
import type { AuthUser } from '@work-squared/shared/auth'

// Mock crypto.randomUUID
const mockUUID = 'mock-uuid-1234'
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => mockUUID),
})

// Helper to create test user
const createTestUser = (overrides?: Partial<AuthUser>): AuthUser => ({
  id: 'user-1',
  email: 'test@example.com',
  instances: [
    {
      id: 'instance-1',
      name: 'First Instance',
      role: 'owner',
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    },
    {
      id: 'instance-2',
      name: 'Second Instance',
      role: 'member',
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    },
  ],
  defaultInstanceId: 'instance-1',
  ...overrides,
})

describe('navigation utils', () => {
  beforeEach(() => {
    localStorage.clear()
    // Mock window.location.origin
    vi.stubGlobal('location', {
      origin: 'http://localhost:5173',
      pathname: '/',
      search: '',
      hash: '',
    })
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('getStoreIdFromUrl', () => {
    it('returns null when no storeId in URL', () => {
      expect(getStoreIdFromUrl()).toBeNull()
    })

    it('returns storeId from URL search params', () => {
      vi.stubGlobal('location', {
        origin: 'http://localhost:5173',
        pathname: '/',
        search: '?storeId=test-store-123',
        hash: '',
      })

      expect(getStoreIdFromUrl()).toBe('test-store-123')
    })
  })

  describe('determineStoreId', () => {
    it('returns storeId from target URL if present', () => {
      const user = createTestUser()
      const result = determineStoreId('/?storeId=url-store', user)
      expect(result).toBe('url-store')
    })

    it('returns user defaultInstanceId when available and valid', () => {
      const user = createTestUser({ defaultInstanceId: 'instance-1' })
      const result = determineStoreId('/', user)
      expect(result).toBe('instance-1')
    })

    it('returns first instance when no defaultInstanceId', () => {
      const user = createTestUser({ defaultInstanceId: null })
      const result = determineStoreId('/', user)
      expect(result).toBe('instance-1')
    })

    it('skips invalid defaultInstanceId and uses first instance', () => {
      const user = createTestUser({ defaultInstanceId: 'non-existent-instance' })
      const result = determineStoreId('/', user)
      expect(result).toBe('instance-1')
    })

    it('returns localStorage storeId when user has no instances', () => {
      localStorage.setItem('storeId', 'stored-store-id')
      const user = createTestUser({ instances: [], defaultInstanceId: null })
      const result = determineStoreId('/', user)
      expect(result).toBe('stored-store-id')
    })

    it('generates new UUID when no user data and no localStorage', () => {
      const result = determineStoreId('/', null)
      expect(result).toBe(mockUUID)
    })

    it('generates new UUID when user is undefined', () => {
      const result = determineStoreId('/', undefined)
      expect(result).toBe(mockUUID)
    })

    it('handles user with empty instances array', () => {
      localStorage.setItem('storeId', 'fallback-store')
      const user = createTestUser({ instances: [], defaultInstanceId: null })
      const result = determineStoreId('/', user)
      expect(result).toBe('fallback-store')
    })
  })

  describe('buildRedirectUrl', () => {
    it('adds storeId to path without query params', () => {
      const user = createTestUser({ defaultInstanceId: 'instance-1' })
      const result = buildRedirectUrl('/dashboard', user)
      expect(result).toBe('/dashboard?storeId=instance-1')
    })

    it('adds storeId to path with existing query params', () => {
      const user = createTestUser({ defaultInstanceId: 'instance-1' })
      const result = buildRedirectUrl('/projects?filter=active', user)
      expect(result).toBe('/projects?filter=active&storeId=instance-1')
    })

    it('preserves existing storeId in URL', () => {
      const user = createTestUser({ defaultInstanceId: 'instance-1' })
      const result = buildRedirectUrl('/?storeId=existing-store', user)
      expect(result).toBe('/?storeId=existing-store')
    })

    it('uses first instance when no defaultInstanceId', () => {
      const user = createTestUser({ defaultInstanceId: null })
      const result = buildRedirectUrl('/', user)
      expect(result).toBe('/?storeId=instance-1')
    })

    it('generates UUID when user is null', () => {
      const result = buildRedirectUrl('/', null)
      expect(result).toBe(`/?storeId=${mockUUID}`)
    })

    it('handles absolute URLs', () => {
      const user = createTestUser({ defaultInstanceId: 'instance-1' })
      const result = buildRedirectUrl('http://localhost:5173/dashboard', user)
      expect(result).toBe('/dashboard?storeId=instance-1')
    })

    it('handles complex URLs with hash', () => {
      const user = createTestUser({ defaultInstanceId: 'instance-1' })
      const result = buildRedirectUrl('/page?tab=1#section', user)
      expect(result).toBe('/page?tab=1&storeId=instance-1')
    })

    it('returns original path on error', () => {
      const user = createTestUser()
      const invalidUrl = 'not a valid url with spaces'

      // Mock URL constructor to throw
      const originalURL = global.URL
      global.URL = class extends originalURL {
        constructor(url: string, base?: string) {
          if (url === invalidUrl) {
            throw new Error('Invalid URL')
          }
          super(url, base)
        }
      } as typeof URL

      const result = buildRedirectUrl(invalidUrl, user)
      expect(result).toBe(invalidUrl)

      global.URL = originalURL
    })

    it('prefers user defaultInstanceId over localStorage', () => {
      localStorage.setItem('storeId', 'stored-id')
      const user = createTestUser({ defaultInstanceId: 'instance-2' })
      const result = buildRedirectUrl('/', user)
      expect(result).toBe('/?storeId=instance-2')
    })

    it('falls back to localStorage when user has no instances', () => {
      localStorage.setItem('storeId', 'stored-id')
      const user = createTestUser({ instances: [], defaultInstanceId: null })
      const result = buildRedirectUrl('/', user)
      expect(result).toBe('/?storeId=stored-id')
    })
  })
})
