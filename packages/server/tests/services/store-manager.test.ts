import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StoreManager } from '../../src/services/store-manager.js'
import * as storeFactory from '../../src/factories/store-factory.js'

vi.mock('../../src/factories/store-factory.js', () => ({
  createStore: vi.fn(),
  validateStoreId: vi.fn((id) => /^[a-zA-Z0-9][a-zA-Z0-9-_]{2,63}$/.test(id)),
  getStoreConfig: vi.fn((id) => ({
    storeId: id,
    authToken: 'test-token',
    syncUrl: 'ws://localhost:8787',
    dataPath: './test-data',
    connectionTimeout: 5000,
  })),
}))

describe('StoreManager', () => {
  let storeManager: StoreManager
  let mockStore: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockStore = {
      storeId: 'test-store',
      query: vi.fn(),
      shutdown: vi.fn().mockResolvedValue(undefined),
      shutdownPromise: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
    }

    vi.mocked(storeFactory.createStore).mockResolvedValue({
      store: mockStore,
      config: {
        storeId: 'test-store',
        authToken: 'test-token',
        syncUrl: 'ws://localhost:8787',
        dataPath: './test-data',
        connectionTimeout: 5000,
      },
    })

    storeManager = new StoreManager(3, 1000)
  })

  afterEach(async () => {
    await storeManager.shutdown()
  })

  describe('initialize', () => {
    it('should initialize multiple stores', async () => {
      const storeIds = ['store-1', 'store-2', 'store-3']

      await storeManager.initialize(storeIds)

      expect(storeFactory.createStore).toHaveBeenCalledTimes(3)
      expect(storeManager.getAllStores().size).toBe(3)
    })

    it('should handle initialization errors gracefully', async () => {
      vi.mocked(storeFactory.createStore).mockRejectedValueOnce(new Error('Connection failed'))

      const storeIds = ['failing-store', 'working-store']
      await storeManager.initialize(storeIds)

      expect(storeManager.getAllStores().size).toBe(1)
      expect(storeManager.getStore('working-store')).toBeTruthy()
      expect(storeManager.getStore('failing-store')).toBeNull()
    })

    it('should handle empty store list', async () => {
      await storeManager.initialize([])

      expect(storeFactory.createStore).not.toHaveBeenCalled()
      expect(storeManager.getAllStores().size).toBe(0)
    })
  })

  describe('addStore', () => {
    it('should add a new store', async () => {
      const store = await storeManager.addStore('new-store')

      expect(store).toBe(mockStore)
      expect(storeManager.getStore('new-store')).toBe(mockStore)
      expect(storeFactory.createStore).toHaveBeenCalledWith('new-store')
    })

    it('should return existing store if already added', async () => {
      await storeManager.addStore('test-store')
      const secondCall = await storeManager.addStore('test-store')

      expect(secondCall).toBe(mockStore)
      expect(storeFactory.createStore).toHaveBeenCalledTimes(1)
    })

    it('should throw error if store creation fails', async () => {
      vi.mocked(storeFactory.createStore).mockRejectedValueOnce(new Error('Creation failed'))

      await expect(storeManager.addStore('failing-store')).rejects.toThrow('Creation failed')
      expect(storeManager.getStore('failing-store')).toBeNull()
    })
  })

  describe('removeStore', () => {
    it('should remove an existing store', async () => {
      await storeManager.addStore('test-store')
      await storeManager.removeStore('test-store')

      expect(mockStore.shutdownPromise).toHaveBeenCalled()
      expect(storeManager.getStore('test-store')).toBeNull()
    })

    it('should handle removing non-existent store', async () => {
      await expect(storeManager.removeStore('non-existent')).resolves.not.toThrow()
    })

    it('should handle shutdown errors gracefully', async () => {
      mockStore.shutdownPromise.mockRejectedValueOnce(new Error('Shutdown failed'))

      await storeManager.addStore('test-store')
      await expect(storeManager.removeStore('test-store')).resolves.not.toThrow()
      expect(storeManager.getStore('test-store')).toBeNull()
    })
  })

  describe('getStore', () => {
    it('should return store if exists', async () => {
      await storeManager.addStore('test-store')

      const store = storeManager.getStore('test-store')
      expect(store).toBe(mockStore)
    })

    it('should return null if store does not exist', () => {
      const store = storeManager.getStore('non-existent')
      expect(store).toBeNull()
    })
  })

  describe('getAllStores', () => {
    it('should return all stores', async () => {
      await storeManager.addStore('store-1')
      await storeManager.addStore('store-2')

      const allStores = storeManager.getAllStores()

      expect(allStores.size).toBe(2)
      expect(allStores.has('store-1')).toBe(true)
      expect(allStores.has('store-2')).toBe(true)
    })

    it('should return empty map when no stores', () => {
      const allStores = storeManager.getAllStores()
      expect(allStores.size).toBe(0)
    })
  })

  describe('getStoreInfo', () => {
    it('should return store info if exists', async () => {
      await storeManager.addStore('test-store')

      const info = storeManager.getStoreInfo('test-store')

      expect(info).toBeTruthy()
      expect(info?.store).toBe(mockStore)
      expect(info?.status).toBe('connected')
      expect(info?.errorCount).toBe(0)
      expect(info?.reconnectAttempts).toBe(0)
    })

    it('should return null if store does not exist', () => {
      const info = storeManager.getStoreInfo('non-existent')
      expect(info).toBeNull()
    })
  })

  describe('updateActivity', () => {
    it('should update last activity timestamp', async () => {
      await storeManager.addStore('test-store')

      const infoBefore = storeManager.getStoreInfo('test-store')
      const activityBefore = infoBefore?.lastActivity

      await new Promise((resolve) => setTimeout(resolve, 10))

      storeManager.updateActivity('test-store')

      const infoAfter = storeManager.getStoreInfo('test-store')
      const activityAfter = infoAfter?.lastActivity

      expect(activityAfter).toBeTruthy()
      expect(activityAfter!.getTime()).toBeGreaterThan(activityBefore!.getTime())
    })

    it('should handle updating non-existent store', () => {
      expect(() => storeManager.updateActivity('non-existent')).not.toThrow()
    })
  })

  describe('getHealthStatus', () => {
    it('should return healthy status when all stores connected', async () => {
      await storeManager.addStore('store-1')
      await storeManager.addStore('store-2')

      const health = storeManager.getHealthStatus()

      expect(health.healthy).toBe(true)
      expect(health.stores).toHaveLength(2)
      expect(health.stores[0].status).toBe('connected')
      expect(health.stores[1].status).toBe('connected')
    })

    it('should return degraded status when store has errors', async () => {
      await storeManager.addStore('test-store')

      const info = storeManager.getStoreInfo('test-store')
      if (info) {
        info.status = 'error'
        info.errorCount = 5
      }

      const health = storeManager.getHealthStatus()

      expect(health.healthy).toBe(false)
      expect(health.stores[0].status).toBe('error')
      expect(health.stores[0].errorCount).toBe(5)
    })
  })

  describe('shutdown', () => {
    it('should shutdown all stores', async () => {
      await storeManager.addStore('store-1')
      await storeManager.addStore('store-2')

      await storeManager.shutdown()

      expect(mockStore.shutdownPromise).toHaveBeenCalledTimes(2)
      expect(storeManager.getAllStores().size).toBe(0)
    })

    it('should handle shutdown errors gracefully', async () => {
      mockStore.shutdownPromise.mockRejectedValueOnce(new Error('Shutdown failed'))

      await storeManager.addStore('test-store')
      await expect(storeManager.shutdown()).resolves.not.toThrow()
    })
  })
})