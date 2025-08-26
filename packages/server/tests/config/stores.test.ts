import { describe, it, expect, beforeEach, vi } from 'vitest'
import { parseStoreIds, loadStoresConfig, getStoreSpecificEnvVar, hasStoreSpecificConfig } from '../../src/config/stores.js'

vi.mock('../../src/factories/store-factory.js', () => ({
  validateStoreId: vi.fn((id) => /^[a-zA-Z0-9][a-zA-Z0-9-_]{2,63}$/.test(id)),
}))

describe('Store Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('parseStoreIds', () => {
    it('should parse comma-separated store IDs', () => {
      const ids = parseStoreIds('store-1,store-2,store-3')
      expect(ids).toEqual(['store-1', 'store-2', 'store-3'])
    })

    it('should trim whitespace from IDs', () => {
      const ids = parseStoreIds(' store-1 , store-2 , store-3 ')
      expect(ids).toEqual(['store-1', 'store-2', 'store-3'])
    })

    it('should filter out empty IDs', () => {
      const ids = parseStoreIds('store-1,,store-2,')
      expect(ids).toEqual(['store-1', 'store-2'])
    })

    it('should remove duplicate IDs', () => {
      const ids = parseStoreIds('store-1,store-2,store-1,store-3,store-2')
      expect(ids).toEqual(['store-1', 'store-2', 'store-3'])
    })

    it('should skip invalid store IDs', () => {
      const ids = parseStoreIds('valid-store,@invalid,another-valid,$bad')
      expect(ids).toEqual(['valid-store', 'another-valid'])
    })

    it('should return empty array for empty input', () => {
      expect(parseStoreIds('')).toEqual([])
      expect(parseStoreIds(undefined)).toEqual([])
      expect(parseStoreIds('   ')).toEqual([])
    })

    it('should throw error if all IDs are invalid', () => {
      expect(() => parseStoreIds('@invalid,$bad,!wrong')).toThrow('No valid store IDs found')
    })
  })

  describe('loadStoresConfig', () => {
    it('should load default configuration', () => {
      const config = loadStoresConfig()

      expect(config.storeIds).toEqual([])
      expect(config.connectionTimeout).toBe(30000)
      expect(config.reconnectInterval).toBe(5000)
      expect(config.maxReconnectAttempts).toBe(3)
    })

    it('should load configuration from environment variables', () => {
      process.env.STORE_IDS = 'store-1,store-2'
      process.env.STORE_CONNECTION_TIMEOUT = '60000'
      process.env.STORE_RECONNECT_INTERVAL = '10000'
      process.env.STORE_MAX_RECONNECT_ATTEMPTS = '5'

      const config = loadStoresConfig()

      expect(config.storeIds).toEqual(['store-1', 'store-2'])
      expect(config.connectionTimeout).toBe(60000)
      expect(config.reconnectInterval).toBe(10000)
      expect(config.maxReconnectAttempts).toBe(5)
    })

    it('should use defaults for invalid timeout values', () => {
      process.env.STORE_CONNECTION_TIMEOUT = '500'
      process.env.STORE_RECONNECT_INTERVAL = '500'
      process.env.STORE_MAX_RECONNECT_ATTEMPTS = '20'

      const config = loadStoresConfig()

      expect(config.connectionTimeout).toBe(30000)
      expect(config.reconnectInterval).toBe(5000)
      expect(config.maxReconnectAttempts).toBe(3)
    })

    it('should handle non-numeric values gracefully', () => {
      process.env.STORE_CONNECTION_TIMEOUT = 'not-a-number'
      process.env.STORE_RECONNECT_INTERVAL = 'invalid'
      process.env.STORE_MAX_RECONNECT_ATTEMPTS = 'abc'

      const config = loadStoresConfig()

      expect(config.connectionTimeout).toBe(30000)
      expect(config.reconnectInterval).toBe(5000)
      expect(config.maxReconnectAttempts).toBe(3)
    })
  })

  describe('getStoreSpecificEnvVar', () => {
    it('should get store-specific environment variable', () => {
      process.env.STORE_WORKSPACE_123_AUTH_TOKEN = 'custom-token'

      const value = getStoreSpecificEnvVar('workspace-123', 'AUTH_TOKEN')
      expect(value).toBe('custom-token')
    })

    it('should handle store IDs with hyphens', () => {
      process.env.STORE_MY_STORE_ID_SYNC_URL = 'ws://custom:8787'

      const value = getStoreSpecificEnvVar('my-store-id', 'SYNC_URL')
      expect(value).toBe('ws://custom:8787')
    })

    it('should return undefined for non-existent variable', () => {
      const value = getStoreSpecificEnvVar('store-1', 'NON_EXISTENT')
      expect(value).toBeUndefined()
    })
  })

  describe('hasStoreSpecificConfig', () => {
    it('should return true if store has specific config', () => {
      process.env.STORE_WORKSPACE_123_AUTH_TOKEN = 'custom-token'
      process.env.STORE_WORKSPACE_123_SYNC_URL = 'ws://custom:8787'

      expect(hasStoreSpecificConfig('workspace-123')).toBe(true)
    })

    it('should return false if store has no specific config', () => {
      expect(hasStoreSpecificConfig('workspace-456')).toBe(false)
    })

    it('should handle store IDs with special characters', () => {
      process.env.STORE_MY_SPECIAL_STORE_DATA_PATH = './custom-path'

      expect(hasStoreSpecificConfig('my-special-store')).toBe(true)
    })
  })
})