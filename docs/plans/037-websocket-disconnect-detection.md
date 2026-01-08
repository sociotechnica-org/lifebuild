# 037: WebSocket Disconnect Detection and Recovery

## Problem Statement

The server occasionally stops responding to agent chat messages from LiveStore, requiring a restart to recover. Investigation revealed that WebSocket connections can silently fail without any detection mechanism, leaving subscriptions orphaned and messages unprocessed.

## Root Cause Analysis

### The Silent Disconnect Scenario

1. WebSocket connection silently fails (network hiccup, Cloudflare Durable Object timeout, etc.)
2. `StoreManager` has NO way to detect this - no event handlers exist for sync status
3. Store status remains `'connected'` indefinitely (never updated)
4. `EventProcessor` subscriptions become stale (pointing to disconnected store)
5. New messages arrive but subscription callbacks never fire
6. Server appears healthy but doesn't process messages
7. Restart fixes it (creates fresh store and subscriptions)

### Key Code Issues Identified

1. **No WebSocket Event Handlers** (`store-manager.ts:219-228`)
   - `setupStoreEventHandlers()` does nothing useful - LiveStore doesn't expose traditional event emitters
   - The `_store` parameter is unused

2. **`onSyncError: 'shutdown'` is Unmonitored** (`store-factory.ts:127`)
   - When sync error occurs, store shuts down automatically
   - StoreManager has no callback to detect this shutdown
   - EventProcessor subscriptions become orphaned
   - Status remains 'connected'

3. **Passive Health Checks** (`store-manager.ts:291-310`)
   - Only reacts IF status is already 'error' or 'disconnected'
   - But status is NEVER updated when WebSocket fails silently
   - No active probing of connection health

4. **Stale Subscriptions After Reconnection** (`store-manager.ts:253-273`)
   - When store reconnects, `storeInfo.store` is replaced with new instance
   - EventProcessor holds subscriptions to the OLD store instance
   - Those subscriptions are never cleaned up or recreated

5. **No Subscription Lifecycle Monitoring**
   - No way to detect when subscriptions become invalid
   - No mechanism to re-create subscriptions after store reconnection
   - No verification that subscriptions are still receiving updates

## Solution Design

### Short-term Fixes (Monitoring & Detection)

#### 1. Connection Health Monitoring with Heartbeat Tracking

Track the last time each subscription received an update. If no updates for a configurable period, flag as potentially disconnected.

**Files to modify:**

- `packages/server/src/services/event-processor.ts`

**Implementation:**

- Add `lastSubscriptionUpdate: Map<string, Date>` to track last callback time per store
- Update timestamp in `handleTableUpdate()`
- Add `isSubscriptionHealthy(storeId, maxSilenceMs)` method
- Expose via health endpoint

#### 2. Active Health Probe

Add an active probe that attempts to query the store to verify it's actually responsive.

**Files to modify:**

- `packages/server/src/services/store-manager.ts`

**Implementation:**

- Add `probeStoreConnection(storeId)` method that runs a simple query
- Call during health checks
- If probe fails, mark store as disconnected and trigger reconnection

### Medium-term Fixes (Recovery)

#### 3. Store Change Notification System

Enable StoreManager to notify EventProcessor when stores are reconnected, so subscriptions can be recreated.

**Files to modify:**

- `packages/server/src/services/store-manager.ts`
- `packages/server/src/services/event-processor.ts`
- `packages/server/src/services/workspace-orchestrator.ts`

**Implementation:**

- Add event emitter capability to StoreManager
- Emit `storeReconnected` event when store is replaced
- EventProcessor listens and re-subscribes to the new store instance

### Long-term Fixes (Native Sync Status API)

#### 4. LiveStore Sync Status API Integration

**Research Complete:** LiveStore 0.4.0 added a native Sync Status API (PR #967, merged Jan 7, 2026) that provides exactly what we need for disconnect detection.

**Available APIs:**

```typescript
// Synchronous getter - returns current sync state immediately
store.syncStatus(): SyncStatus

// Subscription-based updates for monitoring changes
store.subscribeSyncStatus(callback: (status: SyncStatus) => void): () => void

// Effect stream for Effect-based workflows
store.syncStatusStream(): Stream<SyncStatus>
```

**SyncStatus Type:**

```typescript
type SyncStatus = {
  localHead: string // e.g., "e5.2" or "e5.2r1"
  upstreamHead: string // e.g., "e3"
  pendingCount: number // Number of unsynced events
  isSynced: boolean // Quick check if fully synced
}
```

**Version Requirement:** `0.4.0-dev.22` or later (current project is on `0.4.0-dev.8`)

**Why This Is Better Than Query Probing:**

- Tracks actual sync pipeline state, not just query responsiveness
- Native to LiveStore - no additional overhead from probe queries
- Detects stuck sync (high `pendingCount` without progress) before queries would fail
- Provides `isSynced` boolean for simple health checks

**Files to modify:**

- `pnpm-workspace.yaml` (upgrade LiveStore version)
- `packages/server/src/services/store-manager.ts`

**Implementation:**

- Upgrade LiveStore to `0.4.0-dev.22+`
- Use `store.subscribeSyncStatus()` to monitor sync state changes
- Detect stuck sync: `pendingCount > 0 && !isSynced` for extended period (e.g., 60s)
- Trigger reconnection when sync appears stuck
- Remove query-based `probeStoreConnection()` method (superseded by native API)

## Implementation Plan

### Phase 1: Add Monitoring (Short-term)

1. Add `lastSubscriptionUpdate` tracking to EventProcessor
2. Add `isSubscriptionHealthy()` method
3. Add `probeStoreConnection()` to StoreManager
4. Update health checks to use active probing
5. Add `/debug/subscription-health` endpoint

### Phase 2: Add Recovery (Medium-term)

1. Add EventEmitter to StoreManager
2. Emit events on store reconnection
3. EventProcessor subscribes to reconnection events
4. Implement automatic re-subscription on reconnection

### Phase 3: Native Sync Status API Integration

1. Upgrade LiveStore to `0.4.0-dev.22+` in `pnpm-workspace.yaml`
2. Add `subscribeSyncStatus()` monitoring to StoreManager:
   - Subscribe to sync status on store creation
   - Track `lastSyncStatusUpdate` timestamp per store
   - Detect stuck sync: `pendingCount > 0 && !isSynced` for >60s
   - Mark store as disconnected and trigger reconnection when stuck
3. Remove query-based probing:
   - Delete `probeStoreConnection()` method
   - Remove probe logic from `startHealthChecks()`
4. Update health metrics to include sync status:
   - Add `syncStatus` (localHead, upstreamHead, pendingCount, isSynced)
   - Add `lastSyncStatusUpdate` timestamp
5. Update health endpoint to expose sync status metrics

### Phase 4: Testing

1. Unit tests for new health monitoring methods
2. Unit tests for sync status monitoring
3. Manual testing with simulated disconnects
4. Verify health endpoint exposes new metrics

## New Health Metrics

After implementation, the health endpoint should expose:

```typescript
{
  subscriptionHealth: {
    [storeId]: {
      lastUpdateAt: string,
      silenceDurationMs: number,
      isHealthy: boolean,
      // Phase 3: Native sync status (replaces probeResult)
      syncStatus: {
        localHead: string,
        upstreamHead: string,
        pendingCount: number,
        isSynced: boolean,
        lastSyncStatusUpdate: string,
        syncStaleDurationMs: number
      }
    }
  }
}
```

## Success Criteria

1. Server can detect silent WebSocket disconnections within 60 seconds
2. Health endpoint accurately reflects subscription health
3. Automatic reconnection triggers re-subscription to LiveStore
4. No manual restart required to recover from disconnects

## Risks and Mitigations

| Risk                                       | Mitigation                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| False positives during low activity        | Use reasonable silence threshold (e.g., 5 minutes)                        |
| Reconnection storm                         | Add backoff/jitter to reconnection logic                                  |
| LiveStore upgrade breaks compatibility     | Test thoroughly in dev before deploying; review LiveStore changelog       |
| Sync status API behavior differs from docs | Verify API behavior with integration tests before removing probe fallback |

## Related Research

### LiveStore GitHub Issues

| Issue                                                       | Description                                                |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| [#967](https://github.com/livestorejs/livestore/pull/967)   | PR that added the Sync Status API                          |
| [#966](https://github.com/livestorejs/livestore/issues/966) | Feature request for sync head comparison                   |
| [#961](https://github.com/livestorejs/livestore/issues/961) | WebSocket connections persist after unmount                |
| [#955](https://github.com/livestorejs/livestore/issues/955) | Leader handoff sync deadlock - shows internal sync metrics |
| [#714](https://github.com/livestorejs/livestore/issues/714) | Cloudflare DO 30s CPU eviction closes WebSocket            |
