# Preventing Side Effects on Event Re-Processing for Chat Messages

## Status

Proposed

## Last Updated

2025-09-03

## Context

The Work Squared server agentic loop processes user chat messages by subscribing to LiveStore events. When new user messages arrive, the server triggers LLM processing that can involve expensive API calls and tool execution. However, the current implementation has critical issues with message reprocessing:

### Current Implementation Problems

1. **Async Synchronization Race**: LiveStore sync is asynchronous - the server reads "0 messages" initially during startup, then receives actual messages later via WebSocket sync. This causes the pre-population logic to miss existing messages.

2. **Multiple Server Instances**: Render's zero-downtime deployment strategy keeps the previous server instance running until the new one is fully deployed, creating a window where both instances are active and potentially processing the same messages.

3. **In-Memory State Loss**: The current solution uses an in-memory `Set<string>` to track processed message IDs, which is lost on server restart, leading to reprocessing of existing messages.

4. **Cost Impact**: Each reprocessed message triggers expensive LLM API calls ($0.01-$0.10+ per call), making this not just a technical issue but a financial one.

### Technical Root Cause

The fundamental problem is **lack of persistent state for side effect coordination**. The server needs to maintain durable state about which messages have been processed to prevent expensive non-idempotent operations from being repeated.

## Decision

We will implement **persistent tracking of processed message IDs using SQLite on Render's attached disk**.

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Server A      │    │   Shared SQLite  │    │   Server B      │
│   (Current)     │    │   (Attached Disk)│    │   (Deploying)   │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Read state    │───▶│ processed_msgs   │◄───│ • Read state    │
│ • Process msgs  │    │ - id (PK)        │    │ • Process msgs  │
│ • Update state  │───▶│ - store_id       │◄───│ • Update state  │
│ • Graceful exit │    │ - processed_at   │    │ • Startup sync  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Processing Flow

1. **Server startup**: Read existing processed message IDs from SQLite
2. **Message processing**: Before processing, check if message ID exists in SQLite
3. **State persistence**: After successful processing, insert message ID to SQLite
4. **Cleanup**: Periodically remove old entries (>30 days) to prevent unbounded growth

## Alternatives Considered

### 1. In-Memory Set with Graceful Shutdown (Current + Enhancement)

**Approach**: Enhance current in-memory solution with graceful shutdown hooks to persist state before termination.

**Pros**:
- Minimal code changes to existing solution
- Fast lookups (O(1) hash table)
- No additional infrastructure

**Cons**:
- Still vulnerable to ungraceful shutdowns (OOM kills, crash, force restart)
- Render's deployment overlaps mean graceful shutdown may not help
- Race conditions during overlapping deployments remain unsolved
- Complex coordination needed between instances

**Scale Assessment**: Would handle 10s of messages/minute easily but fails reliability requirements.

**Verdict**: ❌ **Rejected** - Doesn't solve the fundamental persistence problem

### 2. Redis/External Cache

**Approach**: Use Redis or similar external caching service to store processed message IDs.

**Pros**:
- Atomic operations (SETNX) for race condition prevention
- Built-in TTL for automatic cleanup
- High performance and proven reliability
- Multiple instances can coordinate effectively

**Cons**:
- Additional service dependency and cost (~$15/month minimum)
- Network dependency introduces failure mode
- Overkill for our scale (10s of messages/minute vs 1000s/second)
- Operational complexity (monitoring, backups, etc.)

**Scale Assessment**: Designed for 1000s/second, would handle our 10s/minute easily.

**Verdict**: 💸 **Rejected** - Over-engineered and expensive for our scale

### 3. File-Based Tracking (JSON/Text)

**Approach**: Store processed message IDs in a simple JSON file on Render's attached disk.

**Pros**:
- Simple implementation
- Persistent across deployments
- No additional services
- Easy to debug and inspect

**Cons**:
- File locking complexity for concurrent access
- Not atomic - corruption risk during crashes
- Performance degrades with file size
- Race conditions between overlapping server instances

**Scale Assessment**: Would handle 10s of messages/minute but file I/O becomes bottleneck.

**Verdict**: 🔄 **Considered** - Simple but lacks atomicity guarantees

### 4. LiveStore Event-Based Coordination

**Approach**: Use LiveStore events to coordinate processing between instances (e.g., emit "processing started" events).

**Pros**:
- Leverages existing LiveStore infrastructure
- No additional storage needed
- Consistent with event-sourced architecture

**Cons**:
- Eventually consistent - race conditions remain possible
- Complex event coordination logic
- Same async sync issues that caused current problem
- Not designed for coordination/locking use cases

**Scale Assessment**: Would handle scale but unreliable due to eventual consistency.

**Verdict**: ❌ **Rejected** - Doesn't solve eventual consistency race conditions

### 5. SQLite on Attached Disk (Recommended)

**Approach**: Use SQLite database on Render's attached disk to persistently track processed message IDs.

**Pros**:
- ACID transactions provide atomicity guarantees
- Persistent across deployments and crashes
- Minimal operational overhead (embedded database)
- Efficient for our scale (10s of messages/minute)
- Render provides attached SSD storage (persistent)
- SQLite handles concurrent access with WAL mode
- Built-in cleanup capabilities (DELETE old records)

**Cons**:
- File I/O slower than memory (but adequate for our scale)
- Potential disk space growth (mitigated by cleanup)
- Slight complexity increase over in-memory solution

**Scale Assessment**: SQLite easily handles 10s of messages/minute with room for 100x growth.

**Race Condition Handling**:
```sql
-- Atomic check-and-insert
INSERT OR IGNORE INTO processed_messages (id, store_id, processed_at) 
VALUES (?, ?, datetime('now'));

-- If rowsAffected = 1, we won processing rights
-- If rowsAffected = 0, another instance already processed it
```

**Verdict**: ✅ **Selected** - Best balance of reliability, performance, and operational simplicity

### 6. Database Event Log Pattern

**Approach**: Create an event log table tracking message processing lifecycle events.

**Pros**:
- Full audit trail of processing attempts
- Can track processing failures and retries
- Aligns with event-sourcing patterns

**Cons**:
- More complex than simple ID tracking
- Requires careful state machine management
- Higher storage overhead
- Over-engineered for current needs

**Scale Assessment**: Would handle scale well but adds unnecessary complexity.

**Verdict**: 🎯 **Future Enhancement** - Good for v2 with retry logic, but simple ID tracking suffices for v1

## See Also

- **ADR-004**: [Distributed Agentic Loop Processing](004-distributed-agentic-loop-processing.md) - Background on moving LLM processing server-side and the challenges of exactly-once processing in distributed systems

## Consequences

### Positive

- **Eliminates duplicate processing**: Persistent state survives deployments and crashes
- **Cost savings**: Prevents expensive duplicate LLM API calls
- **Race condition safety**: ACID transactions provide atomicity guarantees
- **Operational simplicity**: Embedded SQLite requires minimal maintenance
- **Debuggability**: Easy to inspect processed message state
- **Scalability**: Handles current scale (10s/minute) with room for 100x growth

### Negative

- **Disk dependency**: Adds file system I/O to message processing path
- **Storage growth**: Database grows over time (mitigated by cleanup)
- **Complexity increase**: Additional database management code
- **Recovery complexity**: Database corruption requires manual intervention

### Neutral

- **Performance**: Slight latency increase (1-2ms) per message check
- **Maintenance**: Periodic cleanup required (can be automated)
- **Monitoring**: Need to track database size and health

