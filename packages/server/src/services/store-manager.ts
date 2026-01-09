import type { Store as LiveStore } from '@livestore/livestore'
import { queryDb } from '@livestore/livestore'
import { EventEmitter } from 'events'
import { type StoreConfig, createStore } from '../factories/store-factory.js'
import { tables } from '@lifebuild/shared/schema'
import { logger, storeLogger, operationLogger } from '../utils/logger.js'
import {
  createOrchestrationTelemetry,
  getIncidentDashboardUrl,
} from '../utils/orchestration-telemetry.js'

export interface StoreInfo {
  store: LiveStore
  config: StoreConfig
  connectedAt: Date
  lastActivity: Date
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  errorCount: number
  reconnectAttempts: number
}

export interface StoreManagerEvents {
  storeReconnected: (data: { storeId: string; store: LiveStore }) => void
  storeDisconnected: (data: { storeId: string }) => void
}

export class StoreManager extends EventEmitter {
  private stores: Map<string, StoreInfo> = new Map()
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private healthCheckInterval?: NodeJS.Timeout
  private readonly maxReconnectAttempts: number
  private readonly reconnectInterval: number

  constructor(
    maxReconnectAttempts = Number(process.env.STORE_MAX_RECONNECT_ATTEMPTS) || 3,
    reconnectInterval = Number(process.env.STORE_RECONNECT_INTERVAL) || 5000
  ) {
    super()
    this.maxReconnectAttempts = maxReconnectAttempts
    this.reconnectInterval = reconnectInterval
  }

  async initialize(storeIds: string[]): Promise<void> {
    const log = operationLogger('store_manager_initialize', {
      storeCount: storeIds.length,
      storeIds,
    })
    const telemetry = createOrchestrationTelemetry({
      operation: 'store_manager.initialize',
      metadata: { storeCount: storeIds.length },
    })
    log.info('Initializing stores')

    let failureCount = 0

    const initPromises = storeIds.map(async storeId => {
      try {
        await this.addStore(storeId)
        storeLogger(storeId).info('Store initialized successfully')
      } catch (error) {
        storeLogger(storeId).error({ error }, 'Failed to initialize store')
        failureCount += 1
      }
    })

    await Promise.allSettled(initPromises)

    this.startHealthChecks()
    const status = failureCount > 0 ? 'completed_with_failures' : 'completed'
    const { durationMs } = telemetry.recordSuccess({
      initializedStores: this.stores.size,
      failedStores: failureCount,
      status,
    })
    logger.info(
      {
        activeStores: this.stores.size,
        durationMs,
        status,
        failedStores: failureCount,
        incidentDashboardUrl: getIncidentDashboardUrl(),
      },
      'Store manager initialization complete'
    )
  }

  async addStore(storeId: string): Promise<LiveStore> {
    const telemetry = createOrchestrationTelemetry({
      operation: 'store_manager.add_store',
      storeId,
      captureOnError: true,
    })

    if (this.stores.has(storeId)) {
      const existing = this.stores.get(storeId)!
      const { durationMs } = telemetry.recordSuccess({ status: 'already_exists' })
      storeLogger(storeId).warn(
        {
          durationMs,
          incidentDashboardUrl: getIncidentDashboardUrl(),
        },
        'Store already exists, returning existing instance'
      )
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

      const { durationMs } = telemetry.recordSuccess({
        status: 'connected',
      })
      storeLogger(storeId).info(
        {
          config: config.storeId,
          durationMs,
          incidentDashboardUrl: getIncidentDashboardUrl(),
        },
        'Store added successfully'
      )
      return store
    } catch (error) {
      const { durationMs } = telemetry.recordFailure(error, { phase: 'addStore' })
      storeLogger(storeId).error(
        { error, durationMs, incidentDashboardUrl: getIncidentDashboardUrl() },
        'Failed to add store'
      )
      throw error
    }
  }

  async removeStore(storeId: string): Promise<void> {
    const telemetry = createOrchestrationTelemetry({
      operation: 'store_manager.remove_store',
      storeId,
      captureOnError: true,
    })

    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) {
      const { durationMs } = telemetry.recordSuccess({ status: 'not_found' })
      storeLogger(storeId).warn(
        {
          durationMs,
          incidentDashboardUrl: getIncidentDashboardUrl(),
        },
        'Store not found for removal'
      )
      return
    }

    const reconnectTimeout = this.reconnectTimeouts.get(storeId)
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      this.reconnectTimeouts.delete(storeId)
    }

    let failureRecorded = false

    try {
      await storeInfo.store.shutdownPromise()
      storeLogger(storeId).info('Store shutdown complete')
    } catch (error) {
      failureRecorded = true
      const { durationMs } = telemetry.recordFailure(error, { phase: 'shutdown' })
      storeLogger(storeId).error(
        { error, durationMs, incidentDashboardUrl: getIncidentDashboardUrl() },
        'Error shutting down store'
      )
    }

    this.stores.delete(storeId)
    if (!failureRecorded) {
      const { durationMs } = telemetry.recordSuccess({ status: 'removed' })
      storeLogger(storeId).info(
        {
          status: 'removed',
          durationMs,
          incidentDashboardUrl: getIncidentDashboardUrl(),
        },
        'Store removed successfully'
      )
    } else {
      storeLogger(storeId).warn(
        {
          status: 'removed_with_errors',
          incidentDashboardUrl: getIncidentDashboardUrl(),
        },
        'Store removed with errors'
      )
    }
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

  /**
   * Actively probe a store connection by attempting a simple query.
   * This detects silent WebSocket disconnections that wouldn't otherwise be noticed.
   * Returns true if the store responds, false if the probe fails.
   */
  probeStoreConnection(storeId: string): boolean {
    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) {
      storeLogger(storeId).warn('Cannot probe - store not found')
      return false
    }

    try {
      // Run a lightweight query to verify the store is responsive
      // Use a simple select with limit 1 to minimize overhead
      storeInfo.store.query(queryDb(tables.chatMessages.select().limit(1)))
      return true
    } catch (error) {
      storeLogger(storeId).warn({ error }, 'Store probe failed - connection may be broken')
      // Mark store as disconnected so health checks can trigger reconnection
      storeInfo.status = 'disconnected'
      storeInfo.errorCount += 1
      return false
    }
  }

  /**
   * Get detailed connection probe results for all stores
   */
  probeAllConnections(): Map<string, { healthy: boolean; status: string; errorCount: number }> {
    const results = new Map<string, { healthy: boolean; status: string; errorCount: number }>()

    for (const [storeId, storeInfo] of this.stores) {
      const probeResult = this.probeStoreConnection(storeId)
      results.set(storeId, {
        healthy: probeResult,
        status: storeInfo.status,
        errorCount: storeInfo.errorCount,
      })
    }

    return results
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

        // Emit event so listeners (e.g., EventProcessor) can re-subscribe
        this.emit('storeReconnected', { storeId, store })
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
    // Probe interval - don't probe every health check to avoid overhead
    let probeCounter = 0
    const probeEveryNChecks = 4 // Probe every 2 minutes (4 * 30s)

    this.healthCheckInterval = setInterval(() => {
      probeCounter++
      const shouldProbe = probeCounter >= probeEveryNChecks

      for (const [storeId, storeInfo] of this.stores) {
        // Active probing - detect silent disconnections
        // Only probe stores that appear connected, and only periodically
        if (shouldProbe && storeInfo.status === 'connected') {
          const probeResult = this.probeStoreConnection(storeId)
          if (!probeResult) {
            storeLogger(storeId).warn(
              { reconnectAttempts: storeInfo.reconnectAttempts },
              'Health check probe failed - triggering reconnection'
            )
          }
        }

        if (storeInfo.status === 'error' || storeInfo.status === 'disconnected') {
          if (storeInfo.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(storeId)
          }
        }
      }

      if (shouldProbe) {
        probeCounter = 0
      }
    }, healthCheckInterval)
  }

  async shutdown(): Promise<void> {
    const log = operationLogger('store_manager_shutdown')
    const telemetry = createOrchestrationTelemetry({
      operation: 'store_manager.shutdown',
      metadata: { activeStores: this.stores.size },
    })
    log.info('Shutting down store manager')

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
    const { durationMs } = telemetry.recordSuccess({
      shutdownStores: shutdownPromises.length,
    })
    logger.info(
      {
        durationMs,
        incidentDashboardUrl: getIncidentDashboardUrl(),
      },
      'Store manager shutdown complete'
    )
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
