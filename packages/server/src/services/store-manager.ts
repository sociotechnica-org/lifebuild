import type { Store as LiveStore, SyncState } from '@livestore/livestore'
import { StoreInternalsSymbol } from '@livestore/livestore'
import { Effect, Stream } from '@livestore/utils/effect'
import { EventEmitter } from 'events'
import { type StoreConfig, createStore } from '../factories/store-factory.js'
import { logger, storeLogger, operationLogger } from '../utils/logger.js'
import {
  createOrchestrationTelemetry,
  getIncidentDashboardUrl,
} from '../utils/orchestration-telemetry.js'

export interface SyncStatusInfo {
  pendingCount: number
  localHead: string
  upstreamHead: string
  isSynced: boolean
  lastUpdatedAt: Date
  stuckSince?: Date
}

export interface NetworkStatusInfo {
  isConnected: boolean
  lastUpdatedAt: Date
  disconnectedSince?: Date
}

export interface StoreInfo {
  store: LiveStore
  config: StoreConfig
  connectedAt: Date
  lastActivity: Date
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  errorCount: number
  reconnectAttempts: number
  syncStatus?: SyncStatusInfo
  networkStatus?: NetworkStatusInfo
}

export interface StoreManagerEvents {
  storeReconnected: (data: { storeId: string; store: LiveStore }) => void
  storeDisconnected: (data: { storeId: string }) => void
}

// Configuration for sync status monitoring
const SYNC_STUCK_THRESHOLD_MS = Number(process.env.SYNC_STUCK_THRESHOLD_MS) || 60_000 // 1 minute
const NETWORK_DISCONNECT_FALLBACK_MS = Number(process.env.NETWORK_DISCONNECT_FALLBACK_MS) || 120_000 // 2 minutes - fallback if LiveStore auto-retry fails

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
      this.setupSyncStatusMonitoring(storeId, store)

      // Lazily start health checks if not already running
      // This ensures stores added via addStore() (not just initialize()) get monitored
      if (!this.healthCheckInterval) {
        this.startHealthChecks()
      }

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

  /**
   * Set up monitoring using LiveStore's networkStatus and syncState APIs.
   * - networkStatus: tracks WebSocket connectivity to sync backend (uses ping/pong)
   * - syncState: tracks local sync state (pending events, heads)
   */
  private setupSyncStatusMonitoring(storeId: string, store: LiveStore): void {
    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) return

    storeInfo.status = 'connected'

    // Monitor network status (WebSocket connectivity)
    this.setupNetworkStatusMonitoring(storeId, store)

    // Monitor sync state (pending events, heads)
    this.setupSyncStateMonitoring(storeId, store)
  }

  /**
   * Monitor store.networkStatus for WebSocket connectivity changes.
   * LiveStore uses ping/pong (default 10s) to detect silent disconnects.
   */
  private setupNetworkStatusMonitoring(storeId: string, store: LiveStore): void {
    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) return

    // networkStatus is a Subscribable on the store object
    const networkStatus = (store as any).networkStatus
    if (!networkStatus) {
      storeLogger(storeId).debug('Network status not available')
      return
    }

    // Subscribe to network status changes first
    const changesStream = (networkStatus as any).changes
    if (changesStream) {
      this.consumeNetworkStatusChanges(storeId, changesStream)
    }

    // Read initial network status (only if stream hasn't already updated it)
    Effect.runPromise(networkStatus as Effect.Effect<{ isConnected: boolean }, unknown>)
      .then(initial => {
        // Only set if stream hasn't already provided data (avoids race condition)
        if (!storeInfo.networkStatus) {
          const now = new Date()
          storeInfo.networkStatus = {
            isConnected: initial.isConnected,
            lastUpdatedAt: now,
            disconnectedSince: initial.isConnected ? undefined : now,
          }
          storeLogger(storeId).info(
            { isConnected: initial.isConnected },
            'Network status monitoring enabled'
          )
        }
      })
      .catch(error => {
        storeLogger(storeId).debug({ error }, 'Could not read initial network status')
      })
  }

  /**
   * Consume network status changes from the stream.
   */
  private consumeNetworkStatusChanges(
    storeId: string,
    changesStream: Stream.Stream<{ isConnected: boolean }, unknown>
  ): void {
    const streamEffect = Stream.runForEach(changesStream, status =>
      Effect.sync(() => {
        const storeInfo = this.stores.get(storeId)
        if (!storeInfo) return

        const now = new Date()
        const wasConnected = storeInfo.networkStatus?.isConnected ?? true

        if (status.isConnected && !wasConnected) {
          // Reconnected
          storeLogger(storeId).info('Network connection restored')
          storeInfo.networkStatus = {
            isConnected: true,
            lastUpdatedAt: now,
            disconnectedSince: undefined,
          }
          // LiveStore handles reconnection automatically, just update our status
          if (storeInfo.status === 'disconnected') {
            storeInfo.status = 'connected'
            storeInfo.reconnectAttempts = 0
          }
        } else if (!status.isConnected && wasConnected) {
          // Disconnected
          storeLogger(storeId).warn('Network connection lost - LiveStore will auto-retry')
          storeInfo.networkStatus = {
            isConnected: false,
            lastUpdatedAt: now,
            disconnectedSince: now,
          }
          storeInfo.status = 'disconnected'
          this.emit('storeDisconnected', { storeId })
        }
      })
    )

    Effect.runPromise(streamEffect).catch(error => {
      storeLogger(storeId).debug({ error }, 'Network status stream ended')
    })
  }

  /**
   * Monitor sync state for pending events (stuck sync detection).
   */
  private setupSyncStateMonitoring(storeId: string, store: LiveStore): void {
    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) return

    try {
      const internals = store[StoreInternalsSymbol]
      const syncState = internals?.clientSession?.leaderThread?.syncState

      if (!syncState) {
        storeLogger(storeId).debug('Sync state not available')
        return
      }

      Effect.runPromise(syncState as Effect.Effect<SyncState.SyncState, unknown>)
        .then(initialState => {
          this.handleSyncStateUpdate(storeId, initialState)
          storeLogger(storeId).info(
            {
              pendingCount: initialState.pending?.length ?? 0,
              localHead: this.formatHead(initialState.localHead),
              upstreamHead: this.formatHead(initialState.upstreamHead),
            },
            'Sync state monitoring enabled'
          )

          const changesStream = (syncState as any).changes as
            | Stream.Stream<SyncState.SyncState, unknown>
            | undefined
          if (changesStream) {
            this.consumeSyncStateChanges(storeId, changesStream)
          }
        })
        .catch(error => {
          storeLogger(storeId).debug({ error }, 'Could not read initial sync state')
        })
    } catch (error) {
      storeLogger(storeId).debug({ error }, 'Failed to set up sync state monitoring')
    }
  }

  /**
   * Consume sync state changes from the Effect Stream.
   */
  private consumeSyncStateChanges(
    storeId: string,
    changesStream: Stream.Stream<SyncState.SyncState, unknown>
  ): void {
    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) return

    // Use Stream.runForEach to process each sync state update
    const streamEffect = Stream.runForEach(changesStream, state =>
      Effect.sync(() => {
        // Check if store still exists
        if (this.stores.has(storeId)) {
          this.handleSyncStateUpdate(storeId, state)
        }
      })
    )

    // Run the stream consumption in the background
    Effect.runPromise(streamEffect).catch(error => {
      // Stream consumption failed - this is expected when store shuts down
      storeLogger(storeId).debug({ error }, 'Sync state stream ended')
    })
  }

  /**
   * Format event head as string for logging.
   */
  private formatHead(head: any): string {
    if (!head) return 'unknown'
    if (typeof head === 'string') return head
    if (typeof head === 'object') {
      return `e${head.global ?? '?'}.${head.client ?? '?'}r${head.rebaseGeneration ?? '?'}`
    }
    return String(head)
  }

  /**
   * Process a sync state update and detect stuck sync conditions.
   */
  private handleSyncStateUpdate(storeId: string, syncState: SyncState.SyncState): void {
    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) return

    const now = new Date()
    const pendingCount = syncState.pending?.length ?? 0
    const isSynced = pendingCount === 0

    const localHead = this.formatHead(syncState.localHead)
    const upstreamHead = this.formatHead(syncState.upstreamHead)

    const previousSyncStatus = storeInfo.syncStatus

    // Detect stuck sync - pending events not progressing
    // The key indicator of progress is upstreamHead advancing, not pending count changing
    // (pending count can increase when new events are added, but that's not sync progress)
    let stuckSince: Date | undefined = undefined
    if (pendingCount > 0) {
      if (previousSyncStatus?.stuckSince) {
        // Already stuck - check if upstreamHead advanced (real progress)
        if (previousSyncStatus.upstreamHead === upstreamHead) {
          // No progress - upstream head hasn't moved
          stuckSince = previousSyncStatus.stuckSince
        } else {
          // upstreamHead advanced, so real sync progress is happening - reset stuck timer
          stuckSince = undefined
        }
      } else {
        // Newly have pending events - start tracking
        stuckSince = now
      }
    }

    storeInfo.syncStatus = {
      pendingCount,
      localHead,
      upstreamHead,
      isSynced,
      lastUpdatedAt: now,
      stuckSince,
    }

    // Check if stuck for too long
    if (stuckSince) {
      this.handleStuckSyncRecovery(storeId, storeInfo)
    }
  }

  /**
   * Handle stuck sync recovery - extracted to avoid duplication between
   * handleSyncStateUpdate and health checks.
   */
  private handleStuckSyncRecovery(storeId: string, storeInfo: StoreInfo): void {
    if (!storeInfo.syncStatus?.stuckSince) return

    const stuckDurationMs = Date.now() - storeInfo.syncStatus.stuckSince.getTime()
    if (stuckDurationMs > SYNC_STUCK_THRESHOLD_MS) {
      storeLogger(storeId).warn(
        {
          pendingCount: storeInfo.syncStatus.pendingCount,
          stuckDurationMs,
          localHead: storeInfo.syncStatus.localHead,
          upstreamHead: storeInfo.syncStatus.upstreamHead,
        },
        'Sync appears stuck - triggering reconnection'
      )
      storeInfo.status = 'disconnected'
      this.emit('storeDisconnected', { storeId })
      this.scheduleReconnect(storeId)
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

        await storeInfo.store.shutdownPromise()
        const { store } = await createStore(storeId, storeInfo.config)

        storeInfo.store = store
        storeInfo.status = 'connected'
        storeInfo.connectedAt = new Date()
        storeInfo.errorCount = 0
        storeInfo.reconnectAttempts = 0
        storeInfo.syncStatus = undefined // Reset sync status for fresh start
        storeInfo.networkStatus = undefined // Reset network status to allow fresh monitoring

        this.setupSyncStatusMonitoring(storeId, store)
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
    // Guard against duplicate initialization
    if (this.healthCheckInterval) {
      return
    }

    const healthCheckInterval = 30000 // 30 seconds

    const runHealthCheck = () => {
      try {
        for (const [storeId, storeInfo] of this.stores) {
          // Sync our status with networkStatus
          // Note: LiveStore handles reconnection automatically via leader thread
          if (storeInfo.networkStatus) {
            if (!storeInfo.networkStatus.isConnected && storeInfo.status === 'connected') {
              // Network is disconnected but we haven't updated our status yet
              storeInfo.status = 'disconnected'
              storeLogger(storeId).warn('Network disconnected - updating status')
              this.emit('storeDisconnected', { storeId })
            } else if (storeInfo.networkStatus.isConnected && storeInfo.status === 'disconnected') {
              // Network reconnected
              storeInfo.status = 'connected'
              storeInfo.reconnectAttempts = 0
              storeLogger(storeId).info('Network reconnected - updating status')
            }

            // Check for extended disconnects - fallback if LiveStore auto-retry fails
            const disconnectedSince = storeInfo.networkStatus.disconnectedSince
            if (disconnectedSince && !storeInfo.networkStatus.isConnected) {
              const disconnectedMs = Date.now() - disconnectedSince.getTime()

              if (disconnectedMs > NETWORK_DISCONNECT_FALLBACK_MS) {
                // LiveStore auto-retry hasn't succeeded after threshold - trigger manual reconnection
                storeLogger(storeId).warn(
                  { disconnectedMs, disconnectedSince: disconnectedSince.toISOString() },
                  'Extended network disconnect - triggering manual reconnection fallback'
                )
                this.scheduleReconnect(storeId)
              } else {
                storeLogger(storeId).warn(
                  { disconnectedMs, disconnectedSince: disconnectedSince.toISOString() },
                  'Store still disconnected - LiveStore auto-retry in progress'
                )
              }
            }
          }

          // Check for stuck sync (events failing to push) as secondary indicator
          if (storeInfo.status === 'connected' && storeInfo.syncStatus?.stuckSince) {
            this.handleStuckSyncRecovery(storeId, storeInfo)
          }
        }
      } catch (error) {
        logger.error({ error }, 'Health check error - continuing to next interval')
      } finally {
        // Always schedule next health check, even if an error occurred
        this.healthCheckInterval = setTimeout(runHealthCheck, healthCheckInterval)
      }
    }

    // Start the first health check
    this.healthCheckInterval = setTimeout(runHealthCheck, healthCheckInterval)
  }

  async shutdown(): Promise<void> {
    const log = operationLogger('store_manager_shutdown')
    const telemetry = createOrchestrationTelemetry({
      operation: 'store_manager.shutdown',
      metadata: { activeStores: this.stores.size },
    })
    log.info('Shutting down store manager')

    if (this.healthCheckInterval) {
      clearTimeout(this.healthCheckInterval)
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
      networkStatus?: {
        isConnected: boolean
        lastUpdatedAt: string
        disconnectedSince?: string
        disconnectedMs?: number
      }
      syncStatus?: {
        pendingCount: number
        localHead: string
        upstreamHead: string
        isSynced: boolean
        lastUpdatedAt: string
        stuckSince?: string
        stuckDurationMs?: number
      }
    }>
  } {
    const now = Date.now()
    const storeStatuses = Array.from(this.stores.entries()).map(([storeId, info]) => ({
      storeId,
      status: info.status,
      connectedAt: info.connectedAt.toISOString(),
      lastActivity: info.lastActivity.toISOString(),
      errorCount: info.errorCount,
      reconnectAttempts: info.reconnectAttempts,
      networkStatus: info.networkStatus
        ? {
            isConnected: info.networkStatus.isConnected,
            lastUpdatedAt: info.networkStatus.lastUpdatedAt.toISOString(),
            disconnectedSince: info.networkStatus.disconnectedSince?.toISOString(),
            disconnectedMs: info.networkStatus.disconnectedSince
              ? now - info.networkStatus.disconnectedSince.getTime()
              : undefined,
          }
        : undefined,
      syncStatus: info.syncStatus
        ? {
            pendingCount: info.syncStatus.pendingCount,
            localHead: info.syncStatus.localHead,
            upstreamHead: info.syncStatus.upstreamHead,
            isSynced: info.syncStatus.isSynced,
            lastUpdatedAt: info.syncStatus.lastUpdatedAt.toISOString(),
            stuckSince: info.syncStatus.stuckSince?.toISOString(),
            stuckDurationMs: info.syncStatus.stuckSince
              ? now - info.syncStatus.stuckSince.getTime()
              : undefined,
          }
        : undefined,
    }))

    // Consider unhealthy if any store is disconnected (via networkStatus or status)
    const healthy = storeStatuses.every(
      s => s.status === 'connected' && (s.networkStatus?.isConnected ?? true)
    )

    return {
      healthy,
      stores: storeStatuses,
    }
  }
}

export const storeManager = new StoreManager()
