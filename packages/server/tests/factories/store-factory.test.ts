import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createStorePromise } from '@livestore/livestore'
import { makeAdapter } from '@livestore/adapter-node'
import { makeWsSync } from '@livestore/sync-cf/client'
import {
  validateStoreId,
  getStoreConfig,
  StoreFactory,
  createStore,
  resetDevtoolsPortAllocatorForTests,
} from '../../src/factories/store-factory.js'

vi.mock('@livestore/livestore', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    createStorePromise: vi.fn(),
  }
})

vi.mock('@livestore/adapter-node', () => ({
  makeAdapter: vi.fn(),
}))

vi.mock('@livestore/sync-cf/client', () => ({
  makeWsSync: vi.fn(),
}))

describe('Store Factory', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    resetDevtoolsPortAllocatorForTests()
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
      expect(config.syncUrl).toBe('ws://localhost:8787')
      expect(config.dataPath).toBe('./data')
      expect(config.connectionTimeout).toBe(30000)
      expect(config.devtoolsUrl).toBe('http://localhost:4300')
      expect(config.enableDevtools).toBe(true)
    })

    it('should use global environment variables', () => {
      process.env.LIVESTORE_SYNC_URL = 'ws://global:8787'
      process.env.STORE_DATA_PATH = './global-data'
      process.env.STORE_CONNECTION_TIMEOUT = '60000'
      process.env.DEVTOOLS_URL = 'http://localhost:4400'

      const config = getStoreConfig('test-store')

      expect(config.syncUrl).toBe('ws://global:8787')
      expect(config.dataPath).toBe('./global-data')
      expect(config.connectionTimeout).toBe(60000)
      expect(config.devtoolsUrl).toBe('http://localhost:4400')
    })

    it('should prioritize store-specific environment variables', () => {
      process.env.STORE_TEST_STORE_SYNC_URL = 'ws://specific:8787'
      process.env.STORE_TEST_STORE_DATA_PATH = './specific-data'
      process.env.STORE_TEST_STORE_DEVTOOLS_URL = 'http://localhost:4500'

      const config = getStoreConfig('test-store')

      expect(config.syncUrl).toBe('ws://specific:8787')
      expect(config.dataPath).toBe('./specific-data')
      expect(config.devtoolsUrl).toBe('http://localhost:4500')
    })

    it('should support store-specific devtools URL override', () => {
      process.env.STORE_TEST_STORE_DEVTOOLS_URL = 'http://localhost:5000'

      const config = getStoreConfig('test-store')

      expect(config.devtoolsUrl).toBe('http://localhost:5000')
    })

    it('should disable devtools in production', () => {
      process.env.NODE_ENV = 'production'

      const config = getStoreConfig('test-store')

      expect(config.enableDevtools).toBe(false)
    })

    it('should disable devtools when DISABLE_DEVTOOLS is true', () => {
      process.env.DISABLE_DEVTOOLS = 'true'

      const config = getStoreConfig('test-store')

      expect(config.enableDevtools).toBe(false)
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
        expect(config.syncUrl).toBe('ws://localhost:8787')
      })

      it('should merge with default config', () => {
        factory = new StoreFactory({
          connectionTimeout: 45000,
        })

        const config = factory.getConfig('test-store')

        expect(config.storeId).toBe('test-store')
        expect(config.connectionTimeout).toBe(45000)
        expect(config.syncUrl).toBe('ws://localhost:8787')
      })
    })
  })

  describe('createStore', () => {
    it('allocates distinct devtools ports for different stores', async () => {
      vi.mocked(makeAdapter).mockReturnValue({} as any)
      vi.mocked(makeWsSync).mockReturnValue({} as any)
      vi.mocked(createStorePromise).mockResolvedValue({ shutdownPromise: vi.fn() } as any)

      await createStore('test-store-a')
      await createStore('test-store-b')

      const firstAdapterArgs = vi.mocked(makeAdapter).mock.calls[0]?.[0] as any
      const secondAdapterArgs = vi.mocked(makeAdapter).mock.calls[1]?.[0] as any

      expect(firstAdapterArgs.devtools.port).not.toBe(secondAdapterArgs.devtools.port)
      expect(firstAdapterArgs.devtools.host).toBe('localhost')
      expect(secondAdapterArgs.devtools.host).toBe('localhost')
    })

    it('respects DEVTOOLS_PORT_BASE when allocating ports', async () => {
      process.env.DEVTOOLS_PORT_BASE = '4600'
      vi.mocked(makeAdapter).mockReturnValue({} as any)
      vi.mocked(makeWsSync).mockReturnValue({} as any)
      vi.mocked(createStorePromise).mockResolvedValue({ shutdownPromise: vi.fn() } as any)

      await createStore('test-store-a')
      await createStore('test-store-b')

      const firstAdapterArgs = vi.mocked(makeAdapter).mock.calls[0]?.[0] as any
      const secondAdapterArgs = vi.mocked(makeAdapter).mock.calls[1]?.[0] as any

      expect(firstAdapterArgs.devtools.port).toBe(4600)
      expect(secondAdapterArgs.devtools.port).toBe(4601)
    })

    it('releases reserved devtools ports when store creation fails', async () => {
      process.env.DEVTOOLS_PORT_BASE = '4700'
      vi.mocked(makeAdapter).mockReturnValue({} as any)
      vi.mocked(makeWsSync).mockReturnValue({} as any)
      vi.mocked(createStorePromise)
        .mockRejectedValueOnce(new Error('store init failed'))
        .mockResolvedValueOnce({ shutdownPromise: vi.fn() } as any)

      await expect(createStore('test-store-a')).rejects.toThrow('store init failed')
      await createStore('test-store-a')

      const firstAdapterArgs = vi.mocked(makeAdapter).mock.calls[0]?.[0] as any
      const secondAdapterArgs = vi.mocked(makeAdapter).mock.calls[1]?.[0] as any

      expect(firstAdapterArgs.devtools.port).toBe(4700)
      expect(secondAdapterArgs.devtools.port).toBe(4701)
    })
  })
})
