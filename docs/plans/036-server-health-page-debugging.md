# Plan 036: Server Health Page & Debugging Improvements

## Overview

When agents fail to respond to user messages, diagnosing the root cause is difficult. The current health page (`packages/server`) provides high-level metrics but lacks the granular visibility needed to trace individual messages through the processing pipeline or understand why a specific message wasn't processed.

This plan outlines improvements to the health page, debug endpoints, and logging infrastructure to make agent response issues easier to diagnose.

## Current Implementation Assessment

### Health Endpoints (packages/server/src/index.ts)

| Endpoint      | Purpose                                |
| ------------- | -------------------------------------- |
| `GET /`       | HTML dashboard with basic store status |
| `GET /health` | JSON health status with global metrics |
| `GET /stores` | Detailed per-store information         |

### What's Available Today

- **Global metrics**: `systemHealth`, `activeLLMCalls`, `queuedMessages`, `errorRate`, `avgResponseTime`
- **Per-store stats**: `errorCount`, `lastError`, `bufferSize`, `activeConversations`
- **LiveStore totals**: `chatMessages`, `userMessages`, `assistantMessages`, `pendingUserMessages`
- **Processed message tracking**: SQLite-based deduplication with counts

### What's Missing

1. **Message-level tracing** - Cannot follow a specific message through the pipeline
2. **Non-response diagnostics** - No visibility into _why_ a message wasn't processed
3. **Real-time loop visibility** - Cannot see agentic loop iteration state mid-flight
4. **Actionable error context** - Errors lack sufficient context for diagnosis
5. **Conversation state inspection** - No way to examine active conversation details

## Identified Risks

- **Debugging blind spots**: Without message-level tracing, issues require log diving and guesswork
- **Slow incident response**: Time to diagnose agent failures is too high
- **Memory overhead**: In-memory tracking of message lifecycles requires careful limits
- **Security exposure**: Debug endpoints should not expose sensitive message content in production

## Recommended Direction

### 1. Message Lifecycle Tracking

Create a new service to track each message through processing stages:

**New file:** `packages/server/src/services/message-lifecycle-tracker.ts`

```typescript
interface MessageLifecycle {
  messageId: string
  storeId: string
  conversationId: string
  createdAt: Date
  stages: {
    received?: { timestamp: Date }
    buffered?: { timestamp: Date; bufferSize: number }
    dedupeChecked?: { timestamp: Date; wasDuplicate: boolean }
    queued?: { timestamp: Date; queuePosition: number }
    processingStarted?: { timestamp: Date }
    iterations?: Array<{
      number: number
      timestamp: Date
      hadToolCalls: boolean
      toolNames?: string[]
      durationMs: number
    }>
    completed?: { timestamp: Date; responseMessageId?: string }
    error?: { timestamp: Date; message: string; code: string; stack?: string }
  }
  currentStage: string
  elapsedMs: number
}
```

Configuration:

- `DEBUG_MESSAGE_HISTORY_SIZE` env var (default: 100) - messages to retain
- `DEBUG_MESSAGE_TTL_MS` env var (default: 300000 / 5 min) - auto-cleanup threshold
- Ring buffer implementation to bound memory usage

### 2. Non-Response Diagnostics

For each pending user message, diagnose why it hasn't been responded to:

```typescript
type NonResponseReason =
  | { reason: 'message_too_old'; cutoffTimestamp: string }
  | { reason: 'already_processed'; processedAt: string }
  | { reason: 'queued_waiting'; position: number; aheadCount: number }
  | { reason: 'rate_limited'; activeCalls: number; maxCalls: number }
  | { reason: 'store_disconnected'; lastConnectedAt: string }
  | { reason: 'llm_disabled'; missingConfig: string[] }
  | { reason: 'processing_in_progress'; iteration: number; elapsedMs: number }
  | { reason: 'stuck_in_loop'; repeatedToolCall: string; count: number }
  | { reason: 'error_occurred'; error: string; occurredAt: string }
  | { reason: 'unknown' }
```

### 3. New Debug Endpoints

**Add to `packages/server/src/index.ts`:**

| Endpoint                         | Purpose                                    | Response                                  |
| -------------------------------- | ------------------------------------------ | ----------------------------------------- |
| `GET /debug/messages`            | List recent message lifecycles             | Array of MessageLifecycle (last N)        |
| `GET /debug/messages/:messageId` | Trace specific message                     | Single MessageLifecycle with full detail  |
| `GET /debug/pending`             | Pending messages with non-response reasons | Array of { messageId, reason, details }   |
| `GET /debug/conversations`       | Active conversations with state            | Array of conversation summaries           |
| `GET /debug/conversations/:id`   | Deep dive into conversation                | Full conversation state including history |
| `GET /debug/errors`              | Recent errors with context                 | Array of enriched error objects           |

Security consideration: These endpoints should be protected in production (e.g., require `SERVER_BYPASS_TOKEN` header or disable via `DISABLE_DEBUG_ENDPOINTS=true`).

### 4. Enhanced HTML Dashboard

Update the HTML dashboard at `GET /` to include:

**Sections:**

1. **System Overview** (existing, enhanced)
   - Health status with color coding (green/yellow/red)
   - Active LLM calls gauge with visual indicator
   - Queue depth with trend indicator

2. **Pending Messages Panel** (new)
   - List of pending user messages
   - Non-response reason for each
   - Time waiting
   - Quick action links to detailed view

3. **Active Conversations Panel** (new)
   - Each active conversation showing:
     - Conversation ID (truncated)
     - Current iteration number
     - Last tool called (if any)
     - Elapsed time with warning if > 30s

4. **Recent Errors Panel** (new)
   - Last 10 errors
   - Timestamp, store, conversation, error message
   - Expandable for full stack trace

5. **Message Search** (new)
   - Input field to search by message ID
   - Shows full lifecycle when found

### 5. Enhanced Logging with Correlation IDs

**Update:** `packages/server/src/utils/logger.ts`

Add correlation ID support that flows through the entire pipeline:

```typescript
// Generate correlation ID when message received
const correlationId = `msg_${messageId}_${Date.now()}`

// All subsequent logs include it
logger.info(
  {
    correlationId,
    stage: 'event_processor',
    action: 'message_received',
    storeId,
    conversationId,
    messageId,
  },
  'User message received'
)

// Later in agentic loop
logger.info(
  {
    correlationId,
    stage: 'agentic_loop',
    iteration: 3,
    toolCalls: ['createProject'],
    durationMs: 1234,
  },
  'Completed iteration with tool calls'
)
```

**Key log points to instrument:**

- Message received in EventProcessor
- Message buffered
- Dedupe check result
- Message queued (with position)
- Processing started
- Each iteration start/complete
- Tool execution start/complete
- Final response generated
- Error occurred (with full context)

### 6. Error Context Enhancement

**Update:** `packages/server/src/services/agentic-loop/agentic-loop.ts`

Enhance error objects to include:

```typescript
interface EnrichedError {
  message: string
  code: string
  stack?: string
  context: {
    correlationId: string
    storeId: string
    conversationId: string
    messageId: string
    iteration: number
    lastToolCall?: { name: string; args: unknown }
    historyLength: number
    elapsedMs: number
    retryCount: number
  }
  timestamp: Date
}
```

Store last N errors in memory (configurable, default 50) for `/debug/errors` endpoint.

## Implementation Plan

### Phase 1: Foundation (P0)

1. **Create MessageLifecycleTracker service**
   - Ring buffer implementation
   - Stage tracking methods
   - Query methods for debug endpoints
   - Files: `packages/server/src/services/message-lifecycle-tracker.ts`

2. **Add correlation ID to logger**
   - Update logger utility with correlation support
   - Add `withCorrelationId()` helper
   - Files: `packages/server/src/utils/logger.ts`

3. **Instrument EventProcessor with lifecycle tracking**
   - Track message through buffer → dedupe → queue → process stages
   - Files: `packages/server/src/services/event-processor.ts`

4. **Instrument AgenticLoop with lifecycle tracking**
   - Track iterations, tool calls, completion/error
   - Files: `packages/server/src/services/agentic-loop/agentic-loop.ts`

### Phase 2: Debug Endpoints (P1)

5. **Add `/debug/messages` and `/debug/messages/:messageId` endpoints**
   - Query MessageLifecycleTracker
   - Files: `packages/server/src/index.ts`

6. **Create NonResponseDiagnostics service**
   - Analyze pending messages and determine reasons
   - Files: `packages/server/src/services/response-diagnostics.ts`

7. **Add `/debug/pending` endpoint**
   - Return pending messages with diagnostic reasons
   - Files: `packages/server/src/index.ts`

8. **Add `/debug/errors` endpoint**
   - Return recent enriched errors
   - Files: `packages/server/src/index.ts`

### Phase 3: Dashboard Enhancement (P2)

9. **Update HTML dashboard with new panels**
   - Pending messages panel
   - Active conversations panel
   - Recent errors panel
   - Files: `packages/server/src/index.ts`

10. **Add message search to dashboard**
    - Client-side search input
    - Fetch from `/debug/messages/:messageId`
    - Files: `packages/server/src/index.ts`

### Phase 4: Active Conversations (P2)

11. **Add `/debug/conversations` endpoint**
    - List active conversations with summary state
    - Files: `packages/server/src/index.ts`

12. **Add `/debug/conversations/:id` endpoint**
    - Deep conversation state (excluding sensitive content in prod)
    - Files: `packages/server/src/index.ts`

### Phase 5: Real-time Stream (P3 - Future)

13. **Add `/debug/stream` SSE endpoint**
    - Real-time event stream for debugging
    - Files: `packages/server/src/index.ts`

## Configuration

New environment variables:

| Variable                     | Default | Description                            |
| ---------------------------- | ------- | -------------------------------------- |
| `DEBUG_MESSAGE_HISTORY_SIZE` | 100     | Number of message lifecycles to retain |
| `DEBUG_MESSAGE_TTL_MS`       | 300000  | Auto-cleanup threshold (5 min)         |
| `DEBUG_ERROR_HISTORY_SIZE`   | 50      | Number of errors to retain             |
| `DISABLE_DEBUG_ENDPOINTS`    | false   | Disable /debug/\* in production        |

## Open Questions & Follow-Up

1. **Security review**: Should debug endpoints require authentication even in development?
2. **Memory limits**: Is 100 messages + 50 errors acceptable memory overhead?
3. **Log verbosity**: Should correlation ID logging be opt-in via `LOG_LEVEL=trace`?
4. **Dashboard framework**: Should we use a simple templating library or keep raw HTML?
5. **Metrics integration**: Should lifecycle tracking feed into future OTEL metrics (Plan 018)?

## Success Criteria

After implementation, operators should be able to:

1. Find any message by ID and see its complete journey through the system
2. Immediately understand why a pending message hasn't been processed
3. See active conversation state including current iteration and elapsed time
4. View recent errors with full context without searching logs
5. Correlate log entries across the entire message processing pipeline
