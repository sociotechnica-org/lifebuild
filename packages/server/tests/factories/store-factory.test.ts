import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validateStoreId, getStoreConfig, StoreFactory } from '../../src/factories/store-factory.js'

vi.mock('@livestore/livestore', () => ({
  createStorePromise: vi.fn(),
}))

vi.mock('@livestore/adapter-node', () => ({
  makeAdapter: vi.fn(),
}))

vi.mock('@livestore/sync-cf', () => ({
  makeCfSync: vi.fn(),
}))

describe('Store Factory', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('validateStoreId', () => {
    it('should validate correct store IDs', () => {
      expect(validateStoreId('valid-store')).toBe(true)
      expect(validateStoreId('store_123')).toBe(true)
      expect(validateStoreId('a1b2c3')).toBe(true)
      expect(validateStoreId('store-with-long-name-123')).toBe(true)
    })

    it('should reject invalid store IDs', () => {
      expect(validateStoreId('')).toBe(false)
      expect(validateStoreId('ab')).toBe(false)
      expect(validateStoreId('-invalid')).toBe(false)
      expect(validateStoreId('_invalid')).toBe(false)
      expect(validateStoreId('@invalid')).toBe(false)
      expect(validateStoreId('store with spaces')).toBe(false)
      expect(validateStoreId('store!@#')).toBe(false)
    })

    it('should reject non-string values', () => {
      expect(validateStoreId(null as any)).toBe(false)
      expect(validateStoreId(undefined as any)).toBe(false)
      expect(validateStoreId(123 as any)).toBe(false)
      expect(validateStoreId({} as any)).toBe(false)
    })

    it('should reject store IDs that are too long', () => {
      const longId = 'a'.repeat(65)
      expect(validateStoreId(longId)).toBe(false)
    })
  })

  describe('getStoreConfig', () => {
    it('should return default configuration', () => {
      const config = getStoreConfig('test-store')

      expect(config.storeId).toBe('test-store')
      expect(config.authToken).toBe('token-test-store')
      expect(config.syncUrl).toBe('ws://localhost:8787')
      expect(config.dataPath).toBe('./data')
      expect(config.connectionTimeout).toBe(30000)
    })

    it('should use global environment variables', () => {
      process.env.AUTH_TOKEN = 'global-token'
      process.env.LIVESTORE_SYNC_URL = 'ws://global:8787'
      process.env.STORE_DATA_PATH = './global-data'
      process.env.STORE_CONNECTION_TIMEOUT = '60000'

      const config = getStoreConfig('test-store')

      expect(config.authToken).toBe('global-token')
      expect(config.syncUrl).toBe('ws://global:8787')
      expect(config.dataPath).toBe('./global-data')
      expect(config.connectionTimeout).toBe(60000)
    })

    it('should prioritize store-specific environment variables', () => {
      process.env.AUTH_TOKEN = 'global-token'
      process.env.STORE_TEST_STORE_AUTH_TOKEN = 'specific-token'
      process.env.STORE_TEST_STORE_SYNC_URL = 'ws://specific:8787'
      process.env.STORE_TEST_STORE_DATA_PATH = './specific-data'

      const config = getStoreConfig('test-store')

      expect(config.authToken).toBe('specific-token')
      expect(config.syncUrl).toBe('ws://specific:8787')
      expect(config.dataPath).toBe('./specific-data')
    })

    it('should handle store IDs with hyphens in env vars', () => {
      process.env.STORE_MY_SPECIAL_STORE_AUTH_TOKEN = 'special-token'

      const config = getStoreConfig('my-special-store')

      expect(config.authToken).toBe('special-token')
    })
  })

  describe('StoreFactory', () => {
    let factory: StoreFactory

    beforeEach(() => {
      factory = new StoreFactory()
    })

    describe('validate', () => {
      it('should validate store IDs', () => {
        expect(factory.validate('valid-store')).toBe(true)
        expect(factory.validate('invalid!')).toBe(false)
      })
    })

    describe('getConfig', () => {
      it('should return config without defaults', () => {
        const config = factory.getConfig('test-store')

        expect(config.storeId).toBe('test-store')
        expect(config.authToken).toBe('token-test-store')
      })

      it('should merge with default config', () => {
        factory = new StoreFactory({
          authToken: 'factory-default-token',
          connectionTimeout: 45000,
        })

        const config = factory.getConfig('test-store')

        expect(config.storeId).toBe('test-store')
        expect(config.authToken).toBe('factory-default-token')
        expect(config.connectionTimeout).toBe(45000)
        expect(config.syncUrl).toBe('ws://localhost:8787')
      })
    })
  })
})