import type { Store as LiveStore } from '@livestore/livestore'
import { type StoreConfig, createStore } from '../factories/store-factory.js'
import { logger, storeLogger, operationLogger } from '../utils/logger.js'

export interface StoreInfo {
  store: LiveStore
  config: StoreConfig
  connectedAt: Date
  lastActivity: Date
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  errorCount: number
  reconnectAttempts: number
}

export class StoreManager {
  private stores: Map<string, StoreInfo> = new Map()
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private healthCheckInterval?: NodeJS.Timeout
  private readonly maxReconnectAttempts: number
  private readonly reconnectInterval: number

  constructor(
    maxReconnectAttempts = Number(process.env.STORE_MAX_RECONNECT_ATTEMPTS) || 3,
    reconnectInterval = Number(process.env.STORE_RECONNECT_INTERVAL) || 5000
  ) {
    this.maxReconnectAttempts = maxReconnectAttempts
    this.reconnectInterval = reconnectInterval
  }

  async initialize(storeIds: string[]): Promise<void> {
    const log = operationLogger('store_manager_initialize', {
      storeCount: storeIds.length,
      storeIds,
    })
    log.info('Initializing stores')

    const initPromises = storeIds.map(async storeId => {
      try {
        await this.addStore(storeId)
        storeLogger(storeId).info('Store initialized successfully')
      } catch (error) {
        storeLogger(storeId).error({ error }, 'Failed to initialize store')
      }
    })

    await Promise.allSettled(initPromises)

    this.startHealthChecks()
    logger.info({ activeStores: this.stores.size }, 'Store manager initialization complete')
  }

  async addStore(storeId: string): Promise<LiveStore> {
    if (this.stores.has(storeId)) {
      const existing = this.stores.get(storeId)!
      storeLogger(storeId).warn('Store already exists, returning existing instance')
      return existing.store
    }

    try {
      const { store, config } = await createStore(storeId)

      const storeInfo: StoreInfo = {
        store,
        config,
        connectedAt: new Date(),
        lastActivity: new Date(),
        status: 'connected',
        errorCount: 0,
        reconnectAttempts: 0,
      }

      this.stores.set(storeId, storeInfo)
      this.setupStoreEventHandlers(storeId, store)

      storeLogger(storeId).info({ config: config.storeId }, 'Store added successfully')
      return store
    } catch (error) {
      storeLogger(storeId).error({ error }, 'Failed to add store')
      throw error
    }
  }

  async removeStore(storeId: string): Promise<void> {
    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) {
      storeLogger(storeId).warn('Store not found for removal')
      return
    }

    const reconnectTimeout = this.reconnectTimeouts.get(storeId)
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      this.reconnectTimeouts.delete(storeId)
    }

    try {
      await storeInfo.store.shutdownPromise()
      storeLogger(storeId).info('Store shutdown complete')
    } catch (error) {
      storeLogger(storeId).error({ error }, 'Error shutting down store')
    }

    this.stores.delete(storeId)
    storeLogger(storeId).info('Store removed successfully')
  }

  getStore(storeId: string): LiveStore | null {
    const storeInfo = this.stores.get(storeId)
    return storeInfo?.store || null
  }

  getAllStores(): Map<string, LiveStore> {
    const result = new Map<string, LiveStore>()
    for (const [id, info] of this.stores) {
      result.set(id, info.store)
    }
    return result
  }

  getStoreInfo(storeId: string): StoreInfo | null {
    return this.stores.get(storeId) || null
  }

  getAllStoreInfo(): Map<string, StoreInfo> {
    return new Map(this.stores)
  }

  private setupStoreEventHandlers(storeId: string, _store: LiveStore): void {
    // LiveStore doesn't expose traditional event emitters
    // We'll rely on health checks and error handling during operations
    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) return

    // Mark as connected since store creation succeeded
    storeInfo.status = 'connected'
    storeLogger(storeId).debug('Store setup complete')
  }

  private scheduleReconnect(storeId: string): void {
    if (this.reconnectTimeouts.has(storeId)) {
      return
    }

    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) return

    if (storeInfo.reconnectAttempts >= this.maxReconnectAttempts) {
      storeLogger(storeId).error(
        { maxReconnectAttempts: this.maxReconnectAttempts, attempts: storeInfo.reconnectAttempts },
        'Store exceeded max reconnect attempts'
      )
      storeInfo.status = 'error'
      return
    }

    storeLogger(storeId).info(
      { reconnectInterval: this.reconnectInterval, attempt: storeInfo.reconnectAttempts + 1 },
      'Scheduling store reconnect'
    )
    storeInfo.status = 'connecting'

    const timeout = setTimeout(async () => {
      this.reconnectTimeouts.delete(storeId)
      storeInfo.reconnectAttempts++

      try {
        storeLogger(storeId).info(
          { attempt: storeInfo.reconnectAttempts },
          'Attempting store reconnect'
        )

        await storeInfo.store.shutdownPromise()
        const { store } = await createStore(storeId, storeInfo.config)

        storeInfo.store = store
        storeInfo.status = 'connected'
        storeInfo.connectedAt = new Date()
        storeInfo.errorCount = 0
        storeInfo.reconnectAttempts = 0

        this.setupStoreEventHandlers(storeId, store)
        storeLogger(storeId).info('Store reconnected successfully')
      } catch (error) {
        storeLogger(storeId).error(
          { error, attempt: storeInfo.reconnectAttempts },
          'Failed to reconnect store'
        )

        if (storeInfo.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(storeId)
        } else {
          storeInfo.status = 'error'
        }
      }
    }, this.reconnectInterval)

    this.reconnectTimeouts.set(storeId, timeout)
  }

  private startHealthChecks(): void {
    const healthCheckInterval = 30000

    this.healthCheckInterval = setInterval(() => {
      for (const [storeId, storeInfo] of this.stores) {
        // Inactive warnings disabled entirely
        // const timeSinceActivity = Date.now() - storeInfo.lastActivity.getTime()
        // if (timeSinceActivity > 60000 && storeInfo.status === 'connected') {
        //   console.warn(
        //     `⚠️ Store ${storeId} has been inactive for ${Math.round(timeSinceActivity / 1000)}s`
        //   )
        // }

        if (storeInfo.status === 'error' || storeInfo.status === 'disconnected') {
          if (storeInfo.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(storeId)
          }
        }
      }
    }, healthCheckInterval)
  }

  async shutdown(): Promise<void> {
    operationLogger('store_manager_shutdown').info('Shutting down store manager')

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    for (const timeout of this.reconnectTimeouts.values()) {
      clearTimeout(timeout)
    }
    this.reconnectTimeouts.clear()

    const shutdownPromises = Array.from(this.stores.keys()).map(storeId =>
      this.removeStore(storeId)
    )

    await Promise.allSettled(shutdownPromises)
    logger.info('Store manager shutdown complete')
  }

  updateActivity(storeId: string): void {
    const storeInfo = this.stores.get(storeId)
    if (storeInfo) {
      storeInfo.lastActivity = new Date()
    }
  }

  getHealthStatus(): {
    healthy: boolean
    stores: Array<{
      storeId: string
      status: string
      connectedAt: string
      lastActivity: string
      errorCount: number
      reconnectAttempts: number
    }>
  } {
    const storeStatuses = Array.from(this.stores.entries()).map(([storeId, info]) => ({
      storeId,
      status: info.status,
      connectedAt: info.connectedAt.toISOString(),
      lastActivity: info.lastActivity.toISOString(),
      errorCount: info.errorCount,
      reconnectAttempts: info.reconnectAttempts,
    }))

    const healthy = storeStatuses.every(s => s.status === 'connected')

    return {
      healthy,
      stores: storeStatuses,
    }
  }
}

export const storeManager = new StoreManager()
