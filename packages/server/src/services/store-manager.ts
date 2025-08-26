import type { Store as LiveStore } from '@livestore/livestore'
import { type StoreConfig, createStore } from '../factories/store-factory.js'

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
    console.log(`🚀 Initializing ${storeIds.length} stores...`)

    const initPromises = storeIds.map(async storeId => {
      try {
        await this.addStore(storeId)
        console.log(`✅ Store ${storeId} initialized`)
      } catch (error) {
        console.error(`❌ Failed to initialize store ${storeId}:`, error)
      }
    })

    await Promise.allSettled(initPromises)

    this.startHealthChecks()
    console.log(`📊 Store manager initialized with ${this.stores.size} active stores`)
  }

  async addStore(storeId: string): Promise<LiveStore> {
    if (this.stores.has(storeId)) {
      const existing = this.stores.get(storeId)!
      console.log(`⚠️ Store ${storeId} already exists`)
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

      console.log(`✅ Added store ${storeId}`)
      return store
    } catch (error) {
      console.error(`❌ Failed to add store ${storeId}:`, error)
      throw error
    }
  }

  async removeStore(storeId: string): Promise<void> {
    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) {
      console.warn(`⚠️ Store ${storeId} not found`)
      return
    }

    const reconnectTimeout = this.reconnectTimeouts.get(storeId)
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      this.reconnectTimeouts.delete(storeId)
    }

    try {
      await storeInfo.store.shutdown()
      console.log(`🔌 Store ${storeId} shutdown complete`)
    } catch (error) {
      console.error(`⚠️ Error shutting down store ${storeId}:`, error)
    }

    this.stores.delete(storeId)
    console.log(`✅ Removed store ${storeId}`)
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
    console.log(`✅ Store ${storeId} setup complete`)
  }

  private scheduleReconnect(storeId: string): void {
    if (this.reconnectTimeouts.has(storeId)) {
      return
    }

    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) return

    if (storeInfo.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Store ${storeId} exceeded max reconnect attempts`)
      storeInfo.status = 'error'
      return
    }

    console.log(`🔄 Scheduling reconnect for store ${storeId} in ${this.reconnectInterval}ms`)
    storeInfo.status = 'connecting'

    const timeout = setTimeout(async () => {
      this.reconnectTimeouts.delete(storeId)
      storeInfo.reconnectAttempts++

      try {
        console.log(
          `🔄 Attempting to reconnect store ${storeId} (attempt ${storeInfo.reconnectAttempts})`
        )

        await storeInfo.store.shutdown()
        const { store } = await createStore(storeId, storeInfo.config)

        storeInfo.store = store
        storeInfo.status = 'connected'
        storeInfo.connectedAt = new Date()
        storeInfo.errorCount = 0
        storeInfo.reconnectAttempts = 0

        this.setupStoreEventHandlers(storeId, store)
        console.log(`✅ Store ${storeId} reconnected successfully`)
      } catch (error) {
        console.error(`❌ Failed to reconnect store ${storeId}:`, error)

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
        const timeSinceActivity = Date.now() - storeInfo.lastActivity.getTime()

        if (timeSinceActivity > 60000 && storeInfo.status === 'connected') {
          console.warn(
            `⚠️ Store ${storeId} has been inactive for ${Math.round(timeSinceActivity / 1000)}s`
          )
        }

        if (storeInfo.status === 'error' || storeInfo.status === 'disconnected') {
          if (storeInfo.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(storeId)
          }
        }
      }
    }, healthCheckInterval)
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down store manager...')

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
    console.log('✅ Store manager shutdown complete')
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
