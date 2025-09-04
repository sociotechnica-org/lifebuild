# Multi-Store Server Implementation TODO

## Overview

Implement support for monitoring and processing multiple LiveStore instances from a single Node.js server using environment variable configuration. This enables the server to handle recurring tasks and email processing across multiple Work Squared workspaces.

## Phase 1: Store Management Infrastructure ✅

### Core Store Manager

#### 1.1 Create Store Manager Service

- [x] Create `packages/server/src/services/store-manager.ts`:

  ```typescript
  class StoreManager {
    private stores: Map<string, LiveStore>

    initialize(storeIds: string[]): Promise<void>
    getStore(storeId: string): LiveStore | null
    getAllStores(): Map<string, LiveStore>
    addStore(storeId: string): Promise<LiveStore>
    removeStore(storeId: string): Promise<void>
  }
  ```

#### 1.2 Store Factory Implementation

- [x] Create `packages/server/src/factories/store-factory.ts`:
  ```typescript
  createStore(storeId: string, config: StoreConfig): Promise<LiveStore>
  validateStoreId(storeId: string): boolean
  getStoreConfig(storeId: string): StoreConfig
  ```

#### 1.3 Store Lifecycle Management

- [x] Implement store initialization on startup
- [x] Handle store connection errors
- [x] Implement reconnection logic
- [x] Add health checks per store
- [x] Clean up resources on shutdown

### Configuration

#### 1.4 Environment Variable Configuration

- [x] Update `packages/server/.env.example`:

  ```env
  # Comma-separated list of store IDs to monitor
  STORE_IDS=workspace-123,workspace-456,workspace-789

  # Store connection settings
  STORE_CONNECTION_TIMEOUT=30000
  STORE_RECONNECT_INTERVAL=5000
  STORE_MAX_RECONNECT_ATTEMPTS=3
  ```

#### 1.5 Configuration Parser

- [x] Create `packages/server/src/config/stores.ts`:
  - Parse comma-separated store IDs
  - Validate store ID format
  - Handle empty/invalid configurations
  - Support optional store-specific settings

### Tests

#### 1.6 Store Manager Tests

- [x] Test multi-store initialization
- [x] Test store addition/removal
- [x] Test error handling
- [x] Test reconnection logic
- [x] Test resource cleanup

**Deliverable**: ✅ PR #138 - feat: Implement multi-store server infrastructure (Phase 1)

---

## Phase 2: Event Processing per Store ✅

### Event Monitoring

#### 2.1 Create Per-Store Event Monitors

- [x] Update `packages/server/src/services/event-processor.ts`:
  ```typescript
  class EventProcessor {
    startMonitoring(storeId: string, store: LiveStore): void
    stopMonitoring(storeId: string): void
    handleEvent(storeId: string, event: Event): Promise<void>
  }
  ```

#### 2.2 Event Routing

- [x] Route events to store-specific handlers
- [x] Maintain event processing state per store
- [x] Implement event buffering during reconnects
- [x] Handle backpressure per store

#### 2.3 Isolation Between Stores

- [x] Ensure events from one store don't affect others
- [x] Separate error handling per store
- [x] Independent processing queues
- [x] Store-specific logging context

### WebSocket Management

#### 2.4 Multi-Store WebSocket Connections

- [x] Create WebSocket connection per store
- [x] Handle connection lifecycle independently
- [x] Implement connection pooling
- [x] Monitor connection health

#### 2.5 Event Distribution

- [x] Emit events to correct store's WebSocket
- [x] Handle store-specific subscriptions
- [x] Manage bandwidth per connection
- [x] Implement fair scheduling

### Tests

#### 2.6 Event Processing Tests

- [x] Test isolated event processing
- [x] Test concurrent event handling
- [x] Test error isolation
- [x] Test WebSocket management

**Deliverable**: ✅ PR #143 - feat: implement Phase 2 multi-store event processing per store

---

## ~~Phase 3: Agentic Loop per Store~~ **CANCELLED - OVER-ARCHITECTED**

**Decision**: No "Agent Manager" needed. The existing `AgenticLoop` class already handles store isolation by taking a specific `Store` instance in its constructor. Task execution can use `new AgenticLoop(store, llmProvider)` directly.

---

## Phase 3: Render Cron Job Task Scheduler

### Clean Architecture with Cron Jobs

**Render Cron Job Approach**: Separate task processing from real-time chat monitoring for better reliability and testability.

**Architecture**:
```
Main Server (packages/server/src/server.ts):
├── EventProcessor - monitors chat messages 
├── WebSocket handling
└── Real-time user interactions

Cron Job Script (packages/server/src/scripts/process-tasks.ts):  
├── Runs every 5 minutes via Render cron job
├── Uses same StoreManager + multi-store infrastructure
├── Processes all stores independently
└── Exits after completion
```

### Implementation

- [ ] Create `packages/server/src/scripts/process-tasks.ts`:
  - Standalone script that connects to all configured stores
  - Uses existing `StoreManager` for multi-store support
  - Runs `TaskScheduler` for each store
  - Clean exit when complete

- [ ] Create `packages/server/src/services/processed-task-tracker.ts`:
  - Extend proven `ProcessedMessageTracker` pattern
  - SQLite table: `processed_task_executions` with composite key 
  - Atomic `INSERT OR IGNORE` for task execution claiming

- [ ] Create `packages/server/src/services/task-scheduler.ts`:
  - Use existing `AgenticLoop` class with store context
  - Query due tasks with 10-minute window (catch missed executions)
  - Emit execution events back to LiveStore for UI updates

### Render Configuration

**Cron Job Setup**:
- **Schedule**: `*/5 * * * *` (every 5 minutes)
- **Command**: `pnpm --filter @work-squared/server run process-tasks`  
- **Environment**: Share environment group with main server
- **Benefits**: Single-run guarantee, cost efficiency, easy local testing

### Tests & Local Development

- [ ] **Easy local testing**: `pnpm --filter @work-squared/server run process-tasks`
- [ ] Test SQLite deduplication prevents duplicate executions
- [ ] Test multi-store processing in single script run
- [ ] Test catch-up after missed cron runs

**Deliverable**: Clean cron job architecture using existing multi-store patterns

---

## Phase 5: Monitoring & Operations

### Metrics Collection

#### 5.1 Per-Store Metrics

- [ ] Create `packages/server/src/monitoring/metrics.ts`:
  ```typescript
  interface StoreMetrics {
    storeId: string
    eventsProcessed: number
    tasksExecuted: number
    errorsCount: number
    lastActivity: Date
  }
  ```

#### 5.2 Aggregate Metrics

- [ ] Total stores monitored
- [ ] Total events across all stores
- [ ] Resource usage per store
- [ ] Error rates by store

### Health Monitoring

#### 5.3 Store Health Checks

- [ ] Create `/health` endpoint with store details
- [ ] Monitor connection status per store
- [ ] Track processing lag per store
- [ ] Alert on unhealthy stores

#### 5.4 Operational Dashboard

- [ ] Create admin view for multi-store status
- [ ] Display store metrics
- [ ] Show active connections
- [ ] Include error logs per store

### Logging

#### 5.5 Structured Logging

- [ ] Add storeId to all log entries
- [ ] Create store-specific log streams
- [ ] Implement log rotation per store
- [ ] Add correlation IDs

### Alerts

#### 5.6 Store-Specific Alerts

- [ ] Alert on store connection loss
- [ ] Alert on processing failures
- [ ] Alert on resource exhaustion
- [ ] Create alert routing rules

**Deliverable**: PR with monitoring and operational tools

---

## Phase 6: Production Hardening

### Scalability

#### 6.1 Dynamic Store Management

- [ ] Support adding stores without restart
- [ ] Implement graceful store removal
- [ ] Handle store migrations
- [ ] Support store pausing

#### 6.2 Load Balancing

- [ ] Implement store sharding strategy
- [ ] Support multiple server instances
- [ ] Create store assignment logic
- [ ] Handle failover scenarios

### Reliability

#### 6.3 Failure Recovery

- [ ] Implement store-level circuit breakers
- [ ] Add exponential backoff per store
- [ ] Create failure isolation
- [ ] Implement automated recovery

#### 6.4 Data Consistency

- [ ] Ensure event ordering per store
- [ ] Handle duplicate events
- [ ] Implement idempotency
- [ ] Add transaction support

### Security

#### 6.5 Store Isolation

- [ ] Validate store access permissions
- [ ] Implement store-level rate limiting
- [ ] Add audit logging
- [ ] Enforce resource quotas

### Documentation

#### 6.6 Operations Guide

- [ ] Document multi-store configuration
- [ ] Create troubleshooting guide
- [ ] Add performance tuning guide
- [ ] Include disaster recovery procedures

**Deliverable**: PR with production hardening features

---

## Clarifying Questions

### Configuration

1. Should store IDs be validated against a registry?
2. What's the maximum number of stores per server?
3. Should we support store-specific configuration overrides?
4. How do we handle store ID changes/renames?

### Resource Management

1. What are acceptable resource limits per store?
2. Should we implement store quotas?
3. How do we prioritize stores under load?
4. What's the strategy for resource exhaustion?

### Operations

1. How do we handle planned maintenance per store?
2. Should stores be pausable/resumable?
3. What's the process for adding new stores?
4. How do we handle store decommissioning?

### Monitoring

1. What metrics are critical per store?
2. How long should we retain per-store metrics?
3. What alerting thresholds make sense?
4. Should we aggregate metrics across stores?

### Security

1. How do we validate store ownership?
2. Should there be access control per store?
3. What audit events need tracking?
4. How do we handle suspicious activity?

## Success Criteria

- [ ] Server can monitor multiple stores concurrently
- [ ] Events are processed independently per store
- [ ] Recurring tasks execute for all stores
- [ ] Store failures don't affect other stores
- [ ] Performance scales linearly with stores
- [ ] Clear operational visibility per store
- [ ] Easy to add/remove stores via config
- [ ] Resource usage is predictable and bounded

## Technical Notes

- Start with environment variable configuration
- Use Map for O(1) store lookups
- Implement connection pooling early
- Add storeId to all async contexts
- Use structured logging from the start
- Design for eventual dynamic management
- Consider memory usage with many stores
- Plan for horizontal scaling needs
