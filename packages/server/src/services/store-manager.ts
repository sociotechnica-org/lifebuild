import type { Store as LiveStore, SyncState } from '@livestore/livestore'
import { StoreInternalsSymbol } from '@livestore/livestore'
import { Effect, Fiber, Stream } from '@livestore/utils/effect'
import * as Sentry from '@sentry/node'
import { EventEmitter } from 'events'
import { type StoreConfig, createStore } from '../factories/store-factory.js'
import { logger, storeLogger, operationLogger } from '../utils/logger.js'
import {
  createOrchestrationTelemetry,
  getIncidentDashboardUrl,
  unwrapErrorForSentry,
} from '../utils/orchestration-telemetry.js'

export type StoreConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error'

export interface StatusHistoryEntry {
  status: StoreConnectionStatus
  timestamp: Date
}

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
  timestampMs: number
  disconnectedSince?: Date
}

export interface NetworkStatusHistoryEntry {
  isConnected: boolean
  timestampMs: number
}

export interface StoreInfo {
  store: LiveStore
  config: StoreConfig
  connectedAt: Date
  lastActivity: Date
  status: StoreConnectionStatus
  lastConnectedAt: Date | null
  lastDisconnectedAt: Date | null
  lastNetworkStatusAt: Date | null
  statusHistory: StatusHistoryEntry[]
  networkStatusHistory: NetworkStatusHistoryEntry[]
  errorCount: number
  reconnectAttempts: number
  syncStatus?: SyncStatusInfo
  networkStatus?: NetworkStatusInfo
  networkStatusFiber?: ReturnType<typeof Effect.runFork>
  syncStateFiber?: ReturnType<typeof Effect.runFork>
  monitoringSessionId: number
}

export const serializeStoreConnectionFields = (
  info: StoreInfo
): {
  lastConnectedAt: string | null
  lastDisconnectedAt: string | null
  statusHistory: Array<{
    status: StoreConnectionStatus
    timestamp: string
  }>
} => ({
  lastConnectedAt: info.lastConnectedAt?.toISOString() ?? null,
  lastDisconnectedAt: info.lastDisconnectedAt?.toISOString() ?? null,
  statusHistory: info.statusHistory.map(entry => ({
    status: entry.status,
    timestamp: entry.timestamp.toISOString(),
  })),
})
// Configuration for sync status monitoring
const SYNC_STUCK_THRESHOLD_MS = Number(process.env.SYNC_STUCK_THRESHOLD_MS) || 60_000 // 1 minute
const NETWORK_DISCONNECT_FALLBACK_MS = Number(process.env.NETWORK_DISCONNECT_FALLBACK_MS) || 120_000 // 2 minutes - fallback if LiveStore auto-retry fails
const STATUS_HISTORY_LIMIT = 50

export class StoreManager extends EventEmitter {
  private stores: Map<string, StoreInfo> = new Map()
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private healthCheckInterval?: NodeJS.Timeout
  private isShuttingDown = false
  private readonly maxReconnectAttempts: number
  private readonly reconnectInterval: number
  private readonly healthCheckIntervalMs: number

  constructor(
    maxReconnectAttempts = Number(process.env.STORE_MAX_RECONNECT_ATTEMPTS) || 3,
    reconnectInterval = Number(process.env.STORE_RECONNECT_INTERVAL) || 5000
  ) {
    super()
    this.maxReconnectAttempts = maxReconnectAttempts
    this.reconnectInterval = reconnectInterval
    const parsedHealthCheck = Number(process.env.STORE_HEALTH_CHECK_INTERVAL_MS)
    this.healthCheckIntervalMs =
      Number.isFinite(parsedHealthCheck) && parsedHealthCheck > 0 ? parsedHealthCheck : 30000
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

      const now = new Date()
      const storeInfo: StoreInfo = {
        store,
        config,
        connectedAt: now,
        lastActivity: now,
        status: 'connected',
        lastConnectedAt: null,
        lastDisconnectedAt: null,
        lastNetworkStatusAt: null,
        statusHistory: [],
        networkStatusHistory: [],
        errorCount: 0,
        reconnectAttempts: 0,
        monitoringSessionId: 0,
      }

      this.recordStatusHistory(storeInfo, 'connected', now)
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

    this.stopMonitoring(storeInfo)

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

    this.stopMonitoring(storeInfo)
    // Monitor network status (WebSocket connectivity)
    this.setupNetworkStatusMonitoring(storeId, store)

    // Monitor sync state (pending events, heads)
    this.setupSyncStateMonitoring(storeId, store)
  }

  private interruptFiber(fiber?: ReturnType<typeof Effect.runFork>): void {
    if (!fiber) return
    Effect.runFork(Fiber.interrupt(fiber))
  }

  private stopMonitoring(storeInfo: StoreInfo): void {
    storeInfo.monitoringSessionId += 1
    this.interruptFiber(storeInfo.networkStatusFiber)
    this.interruptFiber(storeInfo.syncStateFiber)
    storeInfo.networkStatusFiber = undefined
    storeInfo.syncStateFiber = undefined
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
      this.consumeNetworkStatusChanges(storeId, store, changesStream)
    }

    // Read initial network status (only if stream hasn't already updated it)
    Effect.runPromise(networkStatus as Effect.Effect<{ isConnected: boolean }, unknown>)
      .then(initial => {
        // Skip if store has been replaced via reconnection (stale initial read)
        if (storeInfo.store !== store) return
        // Only set if stream hasn't already provided data (avoids race condition)
        if (!storeInfo.networkStatus) {
          const now = new Date()
          this.updateNetworkStatusTracking(storeInfo, initial.isConnected, now)
          storeLogger(storeId).info(
            { isConnected: initial.isConnected },
            'Network status monitoring enabled'
          )

          // If initially disconnected, update status immediately (cold-start disconnect)
          // This avoids waiting for the next health check (30s delay)
          if (!initial.isConnected && storeInfo.status === 'connected') {
            storeLogger(storeId).warn('Network disconnected on startup - updating status')
            if (this.updateStoreStatus(storeId, 'disconnected', now)) {
              this.captureDisconnect(storeId, storeInfo, 'startup_network_disconnected')
              this.emit('storeDisconnected', { storeId })
            }
          }
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
    originalStore: LiveStore,
    changesStream: Stream.Stream<{ isConnected: boolean }, unknown>
  ): void {
    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) return
    const sessionId = storeInfo.monitoringSessionId

    const streamEffect = Stream.runForEach(changesStream, status =>
      Effect.sync(() => {
        const storeInfo = this.stores.get(storeId)
        if (!storeInfo) return
        if (storeInfo.monitoringSessionId !== sessionId) return
        // Ignore events from a stale stream after store has been replaced via reconnection
        if (storeInfo.store !== originalStore) return

        const now = new Date()
        const wasConnected = storeInfo.networkStatus?.isConnected ?? true

        if (status.isConnected && !wasConnected) {
          // Reconnected
          storeLogger(storeId).info('Network connection restored')
          this.updateNetworkStatusTracking(storeInfo, true, now)
          // LiveStore handles reconnection automatically, just update our status
          // Also handle 'connecting' status - network may recover before our reconnect timeout fires
          if (storeInfo.status === 'disconnected' || storeInfo.status === 'connecting') {
            this.updateStoreStatus(storeId, 'connected', now)
            storeInfo.reconnectAttempts = 0
          }
        } else if (!status.isConnected && wasConnected) {
          // Disconnected
          storeLogger(storeId).warn('Network connection lost - LiveStore will auto-retry')
          this.updateNetworkStatusTracking(storeInfo, false, now)
          if (this.updateStoreStatus(storeId, 'disconnected', now)) {
            this.captureDisconnect(storeId, storeInfo, 'network_status_disconnected')
            this.emit('storeDisconnected', { storeId })
          }
        }
      })
    ).pipe(
      Effect.catchAll(error =>
        Effect.sync(() => {
          // Stream ended - check if this is from the current store or a stale (replaced) one
          const storeInfo = this.stores.get(storeId)
          if (storeInfo && storeInfo.monitoringSessionId !== sessionId) {
            storeLogger(storeId).debug({ error }, 'Network status stream stopped intentionally')
            return
          }
          if (storeInfo && storeInfo.store !== originalStore) {
            // Store was replaced via reconnection - old stream ending is expected
            storeLogger(storeId).debug(
              { error },
              'Old network status stream ended after reconnection'
            )
            return
          }

          // Stream ended unexpectedly on the current store (e.g., onSyncError: 'shutdown')
          // Treat as disconnect to ensure the store doesn't remain "connected" forever
          if (storeInfo && storeInfo.status === 'connected') {
            storeLogger(storeId).warn(
              { error },
              'Network status stream ended unexpectedly - treating as disconnect'
            )
            const now = new Date()
            this.updateNetworkStatusTracking(storeInfo, false, now)
            if (this.updateStoreStatus(storeId, 'disconnected', now)) {
              this.captureDisconnect(storeId, storeInfo, 'network_status_stream_ended', error)
              this.emit('storeDisconnected', { storeId })
            }
            this.scheduleReconnect(storeId)
          } else {
            storeLogger(storeId).debug({ error }, 'Network status stream ended')
          }
        })
      )
    )

    storeInfo.networkStatusFiber = Effect.runFork(streamEffect)
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

      // Subscribe to sync state changes first (like networkStatus monitoring)
      // This ensures monitoring works even if initial read fails
      const changesStream = (syncState as any).changes as
        | Stream.Stream<SyncState.SyncState, unknown>
        | undefined
      if (changesStream) {
        this.consumeSyncStateChanges(storeId, store, changesStream)
      }

      // Read initial sync state (only if stream hasn't already updated it)
      Effect.runPromise(syncState as Effect.Effect<SyncState.SyncState, unknown>)
        .then(initialState => {
          // Skip if store has been replaced via reconnection (stale initial read)
          if (storeInfo.store !== store) return
          // Only process if syncStatus hasn't been set by stream yet
          if (!storeInfo.syncStatus) {
            this.handleSyncStateUpdate(storeId, initialState)
            storeLogger(storeId).info(
              {
                pendingCount: initialState.pending?.length ?? 0,
                localHead: this.formatHead(initialState.localHead),
                upstreamHead: this.formatHead(initialState.upstreamHead),
              },
              'Sync state monitoring enabled'
            )
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
    originalStore: LiveStore,
    changesStream: Stream.Stream<SyncState.SyncState, unknown>
  ): void {
    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) return
    const sessionId = storeInfo.monitoringSessionId

    // Use Stream.runForEach to process each sync state update
    const streamEffect = Stream.runForEach(changesStream, state =>
      Effect.sync(() => {
        const currentInfo = this.stores.get(storeId)
        // Ignore events from a stale stream after store has been replaced via reconnection
        if (
          currentInfo &&
          currentInfo.monitoringSessionId === sessionId &&
          currentInfo.store === originalStore
        ) {
          this.handleSyncStateUpdate(storeId, state)
        }
      })
    )

    // Run the stream consumption in the background
    const streamWithLogging = streamEffect.pipe(
      Effect.catchAll(error =>
        Effect.sync(() => {
          const currentInfo = this.stores.get(storeId)
          if (currentInfo && currentInfo.monitoringSessionId !== sessionId) {
            storeLogger(storeId).debug({ error }, 'Sync state stream stopped intentionally')
            return
          }
          // Stream consumption failed - this is expected when store shuts down or reconnects
          storeLogger(storeId).debug({ error }, 'Sync state stream ended')
        })
      )
    )

    storeInfo.syncStateFiber = Effect.runFork(streamWithLogging)
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
          // upstreamHead advanced, so real sync progress is happening - restart stuck timer
          // Use `now` instead of `undefined` so remaining pending events are still monitored
          stuckSince = now
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
    // Only trigger recovery if store is still connected (prevent duplicate events)
    if (storeInfo.status !== 'connected') return

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
      if (this.updateStoreStatus(storeId, 'disconnected')) {
        this.captureDisconnect(storeId, storeInfo, 'sync_stuck')
        this.emit('storeDisconnected', { storeId })
      }
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
      this.updateStoreStatus(storeId, 'error')
      return
    }

    storeLogger(storeId).info(
      { reconnectInterval: this.reconnectInterval, attempt: storeInfo.reconnectAttempts + 1 },
      'Scheduling store reconnect'
    )
    this.updateStoreStatus(storeId, 'connecting')

    const timeout = setTimeout(async () => {
      // Re-fetch storeInfo in case store was replaced during timeout
      const currentInfo = this.stores.get(storeId)
      if (!currentInfo) {
        this.reconnectTimeouts.delete(storeId)
        return
      }

      // Check if network has recovered before proceeding with reconnection
      // This avoids unnecessary shutdown/recreation if LiveStore auto-recovered
      // But don't skip if sync is stuck - the network may be up but sync is stalled,
      // which is the exact scenario handleStuckSyncRecovery is meant to handle
      const syncStuck =
        currentInfo.syncStatus?.stuckSince &&
        Date.now() - currentInfo.syncStatus.stuckSince.getTime() > SYNC_STUCK_THRESHOLD_MS
      if (currentInfo.networkStatus?.isConnected && !syncStuck) {
        storeLogger(storeId).info('Network recovered before reconnect - skipping')
        this.updateStoreStatus(storeId, 'connected')
        currentInfo.reconnectAttempts = 0
        this.reconnectTimeouts.delete(storeId)
        return
      }

      // Keep entry in reconnectTimeouts during async work to prevent duplicate scheduling
      currentInfo.reconnectAttempts++

      try {
        storeLogger(storeId).info(
          { attempt: currentInfo.reconnectAttempts },
          'Attempting store reconnect'
        )

        this.stopMonitoring(currentInfo)
        await currentInfo.store.shutdownPromise()
        const { store } = await createStore(storeId, currentInfo.config)

        currentInfo.store = store
        this.updateStoreStatus(storeId, 'connected')
        currentInfo.connectedAt = new Date()
        currentInfo.errorCount = 0
        currentInfo.reconnectAttempts = 0
        currentInfo.syncStatus = undefined // Reset sync status for fresh start
        currentInfo.networkStatus = undefined // Reset network status to allow fresh monitoring

        this.setupSyncStatusMonitoring(storeId, store)
        storeLogger(storeId).info('Store reconnected successfully')

        // Emit event so listeners (e.g., EventProcessor) can re-subscribe
        this.emit('storeReconnected', { storeId, store })

        // Delete from map only after successful reconnection
        this.reconnectTimeouts.delete(storeId)
      } catch (error) {
        storeLogger(storeId).error(
          { error, attempt: currentInfo.reconnectAttempts },
          'Failed to reconnect store'
        )

        // Delete before retry to allow new schedule
        this.reconnectTimeouts.delete(storeId)

        if (currentInfo.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(storeId)
        } else {
          this.updateStoreStatus(storeId, 'error')
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
    const healthCheckInterval = this.healthCheckIntervalMs

    const runHealthCheck = () => {
      try {
        for (const [storeId, storeInfo] of this.stores) {
          // Sync our status with networkStatus
          // Note: LiveStore handles reconnection automatically via leader thread
          if (storeInfo.networkStatus) {
            if (!storeInfo.networkStatus.isConnected && storeInfo.status === 'connected') {
              // Network is disconnected but we haven't updated our status yet
              if (this.updateStoreStatus(storeId, 'disconnected')) {
                this.captureDisconnect(storeId, storeInfo, 'health_check_network_disconnected')
                this.emit('storeDisconnected', { storeId })
              }
              storeLogger(storeId).warn('Network disconnected - updating status')
            } else if (storeInfo.networkStatus.isConnected && storeInfo.status === 'disconnected') {
              // Network reconnected
              this.updateStoreStatus(storeId, 'connected')
              storeInfo.reconnectAttempts = 0
              storeLogger(storeId).info('Network reconnected - updating status')
            }

            // Check for extended disconnects - fallback if LiveStore auto-retry fails
            // Skip stores in 'error' status (max reconnect attempts exhausted) to avoid noisy logs
            const disconnectedSince = storeInfo.networkStatus.disconnectedSince
            if (
              disconnectedSince &&
              !storeInfo.networkStatus.isConnected &&
              storeInfo.status !== 'error'
            ) {
              const disconnectedMs = Date.now() - disconnectedSince.getTime()

              if (disconnectedMs > NETWORK_DISCONNECT_FALLBACK_MS) {
                // LiveStore auto-retry hasn't succeeded after threshold - trigger manual reconnection
                storeLogger(storeId).warn(
                  { disconnectedMs, disconnectedSince: disconnectedSince.toISOString() },
                  'Extended network disconnect - triggering manual reconnection fallback'
                )
                this.scheduleReconnect(storeId)
              } else if (storeInfo.status !== 'connecting') {
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
        // Schedule next health check unless shutdown is in progress
        if (!this.isShuttingDown) {
          this.healthCheckInterval = setTimeout(runHealthCheck, healthCheckInterval)
        }
      }
    }

    // Start the first health check
    this.healthCheckInterval = setTimeout(runHealthCheck, healthCheckInterval)
  }

  private captureDisconnect(
    storeId: string,
    storeInfo: StoreInfo,
    reason: string,
    error?: unknown
  ): void {
    if (this.isShuttingDown) {
      return
    }
    const syncUrl = storeInfo.config.syncUrl ?? 'unknown'
    const unwrappedError = error ? unwrapErrorForSentry(error) : undefined
    const errorToCapture =
      unwrappedError instanceof Error
        ? unwrappedError
        : error
          ? new Error(`Store disconnected: ${reason} (${String(error)})`)
          : new Error(`Store disconnected: ${reason}`)
    Sentry.withScope(scope => {
      scope.setTag('storeId', storeId)
      scope.setTag('syncUrl', syncUrl)
      scope.setTag('reason', reason)
      if (error) {
        scope.setContext('disconnectError', {
          message:
            unwrappedError instanceof Error
              ? unwrappedError.message
              : unwrappedError
                ? String(unwrappedError)
                : String(error),
        })
      }
      Sentry.captureException(errorToCapture)
    })
  }

  async shutdown(): Promise<void> {
    const log = operationLogger('store_manager_shutdown')
    const telemetry = createOrchestrationTelemetry({
      operation: 'store_manager.shutdown',
      metadata: { activeStores: this.stores.size },
    })
    log.info('Shutting down store manager')

    // Set shutdown flag to prevent health check from rescheduling
    this.isShuttingDown = true

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
      status: StoreConnectionStatus
      connectedAt: string
      lastConnectedAt?: string | null
      lastDisconnectedAt?: string | null
      statusHistory?: Array<{
        status: StoreConnectionStatus
        timestamp: string
      }>
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
      ...serializeStoreConnectionFields(info),
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
    const now = Date.now()
    const result = new Map<
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
    >()

    for (const [storeId, info] of this.stores.entries()) {
      const offlineDurationMs =
        info.networkStatus?.isConnected === false && info.networkStatus.disconnectedSince
          ? now - info.networkStatus.disconnectedSince.getTime()
          : null
      result.set(storeId, {
        status: info.status,
        networkStatus: info.networkStatus ?? null,
        lastNetworkStatusAt: info.lastNetworkStatusAt?.toISOString() ?? null,
        lastConnectedAt: info.lastConnectedAt?.toISOString() ?? null,
        lastDisconnectedAt: info.lastDisconnectedAt?.toISOString() ?? null,
        offlineDurationMs,
        history: info.networkStatusHistory,
      })
    }

    return result
  }

  private recordStatusHistory(
    storeInfo: StoreInfo,
    status: StoreConnectionStatus,
    timestamp: Date
  ): void {
    storeInfo.status = status
    storeInfo.statusHistory.push({ status, timestamp })

    if (status === 'connected') {
      storeInfo.lastConnectedAt = timestamp
    } else if (status === 'disconnected') {
      storeInfo.lastDisconnectedAt = timestamp
    }

    if (storeInfo.statusHistory.length > STATUS_HISTORY_LIMIT) {
      storeInfo.statusHistory.splice(0, storeInfo.statusHistory.length - STATUS_HISTORY_LIMIT)
    }
  }

  private updateNetworkStatusTracking(
    storeInfo: StoreInfo,
    isConnected: boolean,
    timestamp: Date
  ): void {
    storeInfo.networkStatus = {
      isConnected,
      lastUpdatedAt: timestamp,
      timestampMs: timestamp.getTime(),
      disconnectedSince: isConnected ? undefined : timestamp,
    }
    storeInfo.lastNetworkStatusAt = timestamp
    storeInfo.networkStatusHistory.push({
      isConnected,
      timestampMs: timestamp.getTime(),
    })
    if (storeInfo.networkStatusHistory.length > STATUS_HISTORY_LIMIT) {
      storeInfo.networkStatusHistory.splice(
        0,
        storeInfo.networkStatusHistory.length - STATUS_HISTORY_LIMIT
      )
    }
  }

  private updateStoreStatus(
    storeId: string,
    status: StoreConnectionStatus,
    timestamp: Date = new Date()
  ): boolean {
    const storeInfo = this.stores.get(storeId)
    if (!storeInfo) return false
    if (storeInfo.status === status) return false

    this.recordStatusHistory(storeInfo, status, timestamp)
    return true
  }
}

export const storeManager = new StoreManager()
