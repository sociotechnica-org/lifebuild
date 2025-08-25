# Multi-Store Server Implementation TODO

## Overview

Implement support for monitoring and processing multiple LiveStore instances from a single Node.js server using environment variable configuration. This enables the server to handle recurring tasks and email processing across multiple Work Squared workspaces.

## Phase 1: Store Management Infrastructure

### Core Store Manager

#### 1.1 Create Store Manager Service

- [ ] Create `packages/server/src/services/store-manager.ts`:

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

- [ ] Create `packages/server/src/factories/store-factory.ts`:
  ```typescript
  createStore(storeId: string, config: StoreConfig): Promise<LiveStore>
  validateStoreId(storeId: string): boolean
  getStoreConfig(storeId: string): StoreConfig
  ```

#### 1.3 Store Lifecycle Management

- [ ] Implement store initialization on startup
- [ ] Handle store connection errors
- [ ] Implement reconnection logic
- [ ] Add health checks per store
- [ ] Clean up resources on shutdown

### Configuration

#### 1.4 Environment Variable Configuration

- [ ] Update `packages/server/.env.example`:

  ```env
  # Comma-separated list of store IDs to monitor
  STORE_IDS=workspace-123,workspace-456,workspace-789

  # Store connection settings
  STORE_CONNECTION_TIMEOUT=30000
  STORE_RECONNECT_INTERVAL=5000
  STORE_MAX_RECONNECT_ATTEMPTS=3
  ```

#### 1.5 Configuration Parser

- [ ] Create `packages/server/src/config/stores.ts`:
  - Parse comma-separated store IDs
  - Validate store ID format
  - Handle empty/invalid configurations
  - Support optional store-specific settings

### Tests

#### 1.6 Store Manager Tests

- [ ] Test multi-store initialization
- [ ] Test store addition/removal
- [ ] Test error handling
- [ ] Test reconnection logic
- [ ] Test resource cleanup

**Deliverable**: PR with basic multi-store management infrastructure

---

## Phase 2: Event Processing per Store

### Event Monitoring

#### 2.1 Create Per-Store Event Monitors

- [ ] Update `packages/server/src/services/event-processor.ts`:
  ```typescript
  class EventProcessor {
    startMonitoring(storeId: string, store: LiveStore): void
    stopMonitoring(storeId: string): void
    handleEvent(storeId: string, event: Event): Promise<void>
  }
  ```

#### 2.2 Event Routing

- [ ] Route events to store-specific handlers
- [ ] Maintain event processing state per store
- [ ] Implement event buffering during reconnects
- [ ] Handle backpressure per store

#### 2.3 Isolation Between Stores

- [ ] Ensure events from one store don't affect others
- [ ] Separate error handling per store
- [ ] Independent processing queues
- [ ] Store-specific logging context

### WebSocket Management

#### 2.4 Multi-Store WebSocket Connections

- [ ] Create WebSocket connection per store
- [ ] Handle connection lifecycle independently
- [ ] Implement connection pooling
- [ ] Monitor connection health

#### 2.5 Event Distribution

- [ ] Emit events to correct store's WebSocket
- [ ] Handle store-specific subscriptions
- [ ] Manage bandwidth per connection
- [ ] Implement fair scheduling

### Tests

#### 2.6 Event Processing Tests

- [ ] Test isolated event processing
- [ ] Test concurrent event handling
- [ ] Test error isolation
- [ ] Test WebSocket management

**Deliverable**: PR with per-store event processing

---

## Phase 3: Agentic Loop per Store

### Store-Specific Agents

#### 3.1 Create Store-Scoped Agent Manager

- [ ] Update `packages/server/src/services/agent-manager.ts`:
  ```typescript
  class AgentManager {
    createAgent(storeId: string, workerId: string): Agent
    getAgent(storeId: string, workerId: string): Agent | null
    executeForStore(storeId: string, prompt: string): Promise<Result>
  }
  ```

#### 3.2 Context Isolation

- [ ] Maintain separate context per store
- [ ] Store-specific tool access
- [ ] Isolated conversation history
- [ ] Per-store system prompts

#### 3.3 Resource Management

- [ ] Limit concurrent agents per store
- [ ] Implement per-store rate limiting
- [ ] Queue management per workspace
- [ ] Memory management for contexts

### Tool Execution

#### 3.4 Store-Scoped Tools

- [ ] Pass correct store to tool executors
- [ ] Validate tool access per store
- [ ] Store-specific tool configuration
- [ ] Audit tool usage per workspace

#### 3.5 Cross-Store Protection

- [ ] Prevent tools from accessing wrong store
- [ ] Validate storeId in all operations
- [ ] Implement access control checks
- [ ] Log cross-store attempt warnings

### Tests

#### 3.6 Agent Isolation Tests

- [ ] Test agent creation per store
- [ ] Test context isolation
- [ ] Test tool execution scoping
- [ ] Test resource limits

**Deliverable**: PR with store-scoped agentic processing

---

## Phase 4: Recurring Task Execution per Store

### Task Scheduler

#### 4.1 Multi-Store Task Scheduler

- [ ] Create `packages/server/src/services/task-scheduler.ts`:
  ```typescript
  class TaskScheduler {
    scheduleForStore(storeId: string): void
    checkTasksForStore(storeId: string): Promise<RecurringTask[]>
    executeTask(storeId: string, task: RecurringTask): Promise<void>
  }
  ```

#### 4.2 Scheduling Logic

- [ ] Check each store independently
- [ ] Maintain execution state per store
- [ ] Handle overlapping schedules
- [ ] Implement fair execution ordering

#### 4.3 Execution Isolation

- [ ] Execute tasks in store context
- [ ] Prevent task interference
- [ ] Store-specific execution history
- [ ] Independent failure handling

### Performance Optimization

#### 4.4 Efficient Store Checking

- [ ] Stagger store checks to avoid thundering herd
- [ ] Implement adaptive check intervals
- [ ] Cache query results appropriately
- [ ] Monitor check performance

#### 4.5 Resource Pooling

- [ ] Share LLM connections across stores
- [ ] Pool database connections
- [ ] Implement request batching
- [ ] Monitor resource usage

### Tests

#### 4.6 Scheduler Tests

- [ ] Test multi-store scheduling
- [ ] Test execution isolation
- [ ] Test performance with many stores
- [ ] Test failure scenarios

**Deliverable**: PR with multi-store recurring task execution

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
