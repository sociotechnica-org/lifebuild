import * as Sentry from '@sentry/node'
import { EventEmitter } from 'events'
import { Effect, Fiber, Stream } from '@livestore/utils/effect'
import { type StoreConfig, createStore } from '../factories/store-factory.js'
import { logger, storeLogger, operationLogger } from '../utils/logger.js'
import type { LiveStore } from '../types/livestore.js'
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
  networkStatus?: {
    isConnected: boolean
    timestampMs: number
    devtools?: {
      latchClosed?: boolean
    }
  }
  lastNetworkStatusAt?: Date
  lastConnectedAt?: Date
  lastDisconnectedAt?: Date
  networkStatusHistory: Array<{
    isConnected: boolean
    timestampMs: number
  }>
}

export interface StoreManagerEvents {
  storeReconnected: (data: { storeId: string; store: LiveStore }) => void
  storeDisconnected: (data: { storeId: string }) => void
}

export class StoreManager extends EventEmitter {
  private stores: Map<string, StoreInfo> = new Map()
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private networkStatusFibers: Map<string, Fiber.Fiber<unknown, unknown>> = new Map()
  private healthCheckInterval?: NodeJS.Timeout
  private readonly maxReconnectAttempts: number
  private readonly reconnectInterval: number
  private readonly networkHistoryLimit = 50

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
        networkStatusHistory: [],
      }

      this.stores.set(storeId, storeInfo)
      this.setupStoreEventHandlers(storeId, store)
      this.startNetworkStatusMonitoring(storeId, store, storeInfo)

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

    this.stopNetworkStatusMonitoring(storeId)

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

  private startNetworkStatusMonitoring(
    storeId: string,
    store: LiveStore,
    storeInfo: StoreInfo
  ): void {
    type NetworkStatus = NonNullable<StoreInfo['networkStatus']>
    this.stopNetworkStatusMonitoring(storeId)

    const recordStatus = (status: NetworkStatus) => {
      const now = new Date()
      const prevStatus = storeInfo.networkStatus?.isConnected
      storeInfo.networkStatus = status
      storeInfo.lastNetworkStatusAt = now

      storeInfo.networkStatusHistory.push({
        isConnected: status.isConnected,
        timestampMs: status.timestampMs,
      })
      if (storeInfo.networkStatusHistory.length > this.networkHistoryLimit) {
        storeInfo.networkStatusHistory.shift()
      }

      if (status.isConnected) {
        storeInfo.status = 'connected'
        storeInfo.lastConnectedAt = now
      } else {
        storeInfo.status = 'disconnected'
        storeInfo.lastDisconnectedAt = now
      }

      if (prevStatus !== undefined && prevStatus !== status.isConnected) {
        storeLogger(storeId).warn(
          {
            isConnected: status.isConnected,
            syncUrl: storeInfo.config.syncUrl,
            lastConnectedAt: storeInfo.lastConnectedAt?.toISOString(),
            lastDisconnectedAt: storeInfo.lastDisconnectedAt?.toISOString(),
          },
          'Store network status changed'
        )

        if (!status.isConnected) {
          const error = new Error(`LiveStore network disconnected for store ${storeId}`)
          Sentry.withScope(scope => {
            scope.setTag('storeId', storeId)
            scope.setTag('event', 'store_network_disconnected')
            scope.setExtra('syncUrl', storeInfo.config.syncUrl)
            scope.setExtra('timestampMs', status.timestampMs)
            scope.setExtra('devtoolsLatchClosed', status.devtools?.latchClosed ?? null)
            Sentry.captureException(error)
          })
          this.emit('storeDisconnected', { storeId })
        }
      } else if (prevStatus === undefined && !status.isConnected) {
        storeLogger(storeId).warn(
          {
            isConnected: status.isConnected,
            syncUrl: storeInfo.config.syncUrl,
          },
          'Store network status initialized as disconnected'
        )
        const error = new Error(`LiveStore network disconnected on startup for store ${storeId}`)
        Sentry.withScope(scope => {
          scope.setTag('storeId', storeId)
          scope.setTag('event', 'store_network_disconnected_startup')
          scope.setExtra('syncUrl', storeInfo.config.syncUrl)
          scope.setExtra('timestampMs', status.timestampMs)
          scope.setExtra('devtoolsLatchClosed', status.devtools?.latchClosed ?? null)
          Sentry.captureException(error)
        })
      }
    }

    Effect.runPromise(store.networkStatus)
      .then(status => {
        recordStatus(status as NetworkStatus)
      })
      .catch((error: unknown) => {
        storeLogger(storeId).warn({ error }, 'Failed to read initial network status')
      })

    const fiber = Effect.runFork(
      store.networkStatus.changes.pipe(
        Stream.tap(status => Effect.sync(() => recordStatus(status as NetworkStatus))),
        Stream.runDrain,
        Effect.tapCauseLogPretty
      )
    )

    this.networkStatusFibers.set(storeId, fiber)
  }

  private stopNetworkStatusMonitoring(storeId: string): void {
    const fiber = this.networkStatusFibers.get(storeId)
    if (fiber) {
      Effect.runFork(Fiber.interrupt(fiber))
      this.networkStatusFibers.delete(storeId)
    }
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

        this.stopNetworkStatusMonitoring(storeId)
        await storeInfo.store.shutdownPromise()
        const { store } = await createStore(storeId, storeInfo.config)

        storeInfo.store = store
        storeInfo.status = 'connected'
        storeInfo.connectedAt = new Date()
        storeInfo.errorCount = 0
        storeInfo.reconnectAttempts = 0
        storeInfo.networkStatusHistory = []

        this.setupStoreEventHandlers(storeId, store)
        this.startNetworkStatusMonitoring(storeId, store, storeInfo)
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

    this.healthCheckInterval = setInterval(() => {
      for (const [storeId, storeInfo] of this.stores) {
        if (storeInfo.status === 'error' || storeInfo.status === 'disconnected') {
          if (storeInfo.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(storeId)
          }
        }
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
    for (const storeId of this.networkStatusFibers.keys()) {
      this.stopNetworkStatusMonitoring(storeId)
    }

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
      networkStatus: StoreInfo['networkStatus'] | null
      lastNetworkStatusAt: string | null
      lastConnectedAt: string | null
      lastDisconnectedAt: string | null
      offlineDurationMs: number | null
    }>
  } {
    const storeStatuses = Array.from(this.stores.entries()).map(([storeId, info]) => ({
      storeId,
      status: info.status,
      connectedAt: info.connectedAt.toISOString(),
      lastActivity: info.lastActivity.toISOString(),
      errorCount: info.errorCount,
      reconnectAttempts: info.reconnectAttempts,
      networkStatus: info.networkStatus ?? null,
      lastNetworkStatusAt: info.lastNetworkStatusAt?.toISOString() ?? null,
      lastConnectedAt: info.lastConnectedAt?.toISOString() ?? null,
      lastDisconnectedAt: info.lastDisconnectedAt?.toISOString() ?? null,
      offlineDurationMs:
        info.networkStatus && info.networkStatus.isConnected === false && info.lastDisconnectedAt
          ? Date.now() - info.lastDisconnectedAt.getTime()
          : null,
    }))

    const healthy = storeStatuses.every(s => s.status === 'connected')

    return {
      healthy,
      stores: storeStatuses,
    }
  }

  getNetworkHealthStatus(): Map<
    string,
    {
      status: StoreInfo['status']
      networkStatus: StoreInfo['networkStatus'] | null
      lastNetworkStatusAt: string | null
      lastConnectedAt: string | null
      lastDisconnectedAt: string | null
      offlineDurationMs: number | null
      history: StoreInfo['networkStatusHistory']
    }
  > {
    const status = new Map()
    for (const [storeId, info] of this.stores) {
      status.set(storeId, {
        status: info.status,
        networkStatus: info.networkStatus ?? null,
        lastNetworkStatusAt: info.lastNetworkStatusAt?.toISOString() ?? null,
        lastConnectedAt: info.lastConnectedAt?.toISOString() ?? null,
        lastDisconnectedAt: info.lastDisconnectedAt?.toISOString() ?? null,
        offlineDurationMs:
          info.networkStatus && info.networkStatus.isConnected === false && info.lastDisconnectedAt
            ? Date.now() - info.lastDisconnectedAt.getTime()
            : null,
        history: info.networkStatusHistory,
      })
    }
    return status
  }

  async recreateStore(storeId: string): Promise<void> {
    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) {
      storeLogger(storeId).warn('Cannot recreate store - not found')
      return
    }

    storeLogger(storeId).info('Manual store recreation requested')
    const reconnectTimeout = this.reconnectTimeouts.get(storeId)
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      this.reconnectTimeouts.delete(storeId)
    }
    this.stopNetworkStatusMonitoring(storeId)

    await storeInfo.store.shutdownPromise()
    const { store } = await createStore(storeId, storeInfo.config)

    storeInfo.store = store
    storeInfo.status = 'connected'
    storeInfo.connectedAt = new Date()
    storeInfo.errorCount = 0
    storeInfo.reconnectAttempts = 0
    storeInfo.networkStatusHistory = []

    this.setupStoreEventHandlers(storeId, store)
    this.startNetworkStatusMonitoring(storeId, store, storeInfo)

    this.emit('storeReconnected', { storeId, store })
    storeLogger(storeId).info('Manual store recreation complete')
  }
}

export const storeManager = new StoreManager()
