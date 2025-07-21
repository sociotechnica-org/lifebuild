# Move Agentic Loop Processing to Node.js Service

## Status

Proposed

## Last Updated

2025-07-10

## Context

Work Squared currently implements the agentic loop (LLM + tool calling) in the React frontend using `useEffect` to watch for new user messages. This approach has significant problems in multi-client scenarios:

### Current Implementation Issues

1. **Duplicate Processing**: Each browser tab/client processes the same user message independently
2. **Race Conditions**: Multiple clients execute tools simultaneously, creating duplicate tasks/documents
3. **Resource Waste**: Multiple LLM API calls for the same conversation
4. **Coordination Complexity**: No clear ownership of who should process what

### Technical Root Cause

The current `ChatInterface.tsx` uses a reactive pattern appropriate for UI updates but problematic for side effects:

```typescript
// This runs in EVERY tab that has the conversation open
React.useEffect(() => {
  const unsubscribe = store.subscribe(userMessagesQuery, {
    onUpdate: async messages => {
      // Find unanswered messages and process them
      // Multiple tabs all try to "help" by processing
    },
  })
}, [selectedConversationId])
```

This violates the principle that **side effects should have single ownership** while **UI updates should be reactive**.

### Distributed Systems Challenge

This is a classic distributed coordination problem. The LiveStore documentation acknowledges this gap:

> TODO: Document how to safely run side-effects as response to LiveStore events.
>
> - Run side-effect only once globally (will require some kind of global transaction)

### Options Evaluated

**1. Client-side coordination**
Event-based locking where clients compete for processing rights using LiveStore events. One approach would emit "processing started" events as locks, with clients checking for existing locks before processing. This keeps the current architecture but adds coordination complexity.

Trade-offs: maintains immediate client-side tool execution and zero additional infrastructure, but introduces race conditions, lock timeout management, and "split-brain" scenarios where multiple clients think they won the lock.

**2. Server-side processing in Cloudflare Worker**
Move the entire agentic loop into the existing Cloudflare Worker that currently handles LLM API proxying. This centralizes processing without additional services.

Trade-offs: leverages existing infrastructure and eliminates client coordination issues, but hits the 30-second Worker timeout limit for complex agentic loops and loses the immediate LiveStore integration benefit since Workers can't directly access the SQLite store.

**3. Node.js service with LiveStore node adapter**
Create a dedicated Node.js service that subscribes to LiveStore events and processes agentic loops with direct store access. This service would be the single authority for message processing while clients remain purely reactive.

Trade-offs: provides proper architectural separation and eliminates all coordination issues with direct LiveStore integration, but adds operational complexity of another service and introduces network latency between user input and processing.

**4. Hybrid approach**
Keep tool execution client-side for immediate feedback but move coordination server-side. A lightweight coordination service would assign message processing to specific clients, combining the benefits of immediate tool execution with centralized coordination.

Trade-offs: maintains immediate tool feedback and reduces server load, but still requires complex client coordination and doesn't solve the fundamental problem of multiple processors for the same logical operation.

## Decision

We will move agentic loop processing to a dedicated Node.js service using the LiveStore node adapter.

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│  CF Worker   │     │  Node.js    │
│  (CF Pages) │     │  (WebSocket) │◀────│  (Agentic)  │
├─────────────┤     ├──────────────┤     ├─────────────┤
│ • UI updates│     │ • Event relay│     │ • LLM calls │
│ • User input│     │ • WebSocket  │     │ • Tool exec │
│ • Real-time │     │ • Sync logic │     │ • Loop coord│
└─────────────┘     └──────────────┘     └─────────────┘
         │                  │                   │
         └──────────────────┴───────────────────┴
                            │
                      ┌─────▼─────┐
                      │ LiveStore │
                      │ (SQLite)  │
                      └───────────┘
```

### Processing Flow

1. **User sends message** → Frontend commits `chatMessageSent` event
2. **Node.js service detects** new user message via LiveStore subscription
3. **Service processes** agentic loop (LLM → tools → continuation)
4. **All results flow** through LiveStore events back to all clients
5. **Clients reactively update** UI based on assistant messages and tool results

### Event-Sourcing and LLM Processing Challenges

Moving to server-side processing introduces a fundamental challenge: **LLM calls are non-idempotent side effects in an eventually consistent system**.

#### The Core Problem

**LLM calls cannot be treated as typical event-sourced operations** because:

1. **Non-idempotent**: Calling the same LLM twice costs money and may return different results
2. **Eventually consistent replicas**: Each Node.js instance operates on its local SQLite view with network sync latency
3. **No distributed locking**: LiveStore's eventual consistency cannot provide reliable coordination between instances

#### Race Condition Example

```
Time 0: Both Node.js A and B see user message status = "pending" in local SQLite
Time 1: Node.js A starts LLM processing, emits "processingStarted"
Time 2: Node.js B starts LLM processing (A's event hasn't synced yet)
Time 3: Both events sync - duplicate LLM calls have occurred
```

#### Required Solution Pattern

**Command/Event Separation**: Separate user input (immutable events) from LLM execution (stateful commands):

```typescript
// Events: Immutable facts about what happened
chatMessageSent        → User sent a message
llmProcessingRequested → System should process this message
llmResponseReceived    → LLM returned a response

// State: Processing coordination
llmProcessingStarted   → Instance X claimed this request
llmProcessingCompleted → Processing finished successfully
```

This requires **exactly-once processing guarantees** that are complex to implement correctly across multiple eventually consistent replicas.

### Concurrency Handling

Given the event-sourcing challenges above, we must carefully consider how to handle concurrent processing without reintroducing race conditions.

**Approaches considered:**

**Single Node.js instance with async processing**: Use JavaScript's async/await and event loop to process multiple agentic loops concurrently within one Node.js process. This completely eliminates coordination complexity while still allowing concurrent processing of different conversations.

**Multiple Node.js instances with distributed coordination**: Deploy multiple instances that coordinate through LiveStore events or external systems. However, this reintroduces the exact coordination problems we're trying to solve and requires complex distributed locking mechanisms.

**Per-conversation assignment**: Pre-assign conversations to specific instances to avoid coordination. This works but adds operational complexity and uneven load distribution.

#### Recommended Approach: Single Instance Initially

The recommended approach is **async processing within a single service initially** for critical reasons:

1. **Eliminates race conditions**: No coordination needed between instances
2. **Sufficient concurrency**: JavaScript's event loop handles I/O-bound LLM calls efficiently
3. **Operational simplicity**: No distributed coordination to debug or maintain
4. **Clear scaling path**: Scale up (more powerful hardware) before scaling out

**Scaling considerations**: A single Node.js instance can handle hundreds of concurrent LLM API calls since most time is spent waiting for network I/O. When scaling out becomes necessary, implement proper distributed coordination (external queue system, leader election, etc.) rather than trying to coordinate through eventually consistent LiveStore events.

## Consequences

### Positive

- **Exactly-once processing**: Single instance eliminates all coordination complexity and race conditions
- **Proper separation**: UI updates remain reactive, side effects have clear ownership
- **Better error handling**: Centralized retry logic, timeout management
- **Performance**: No wasted API calls or duplicate tool execution
- **Operational simplicity**: No distributed coordination to debug or maintain
- **Debugging**: Centralized logs for all agentic loop processing
- **LiveStore integration**: Direct access to store using node adapter
- **Cost efficiency**: Eliminates duplicate LLM API calls that cost real money

### Negative

- **Architectural complexity**: Adds another service to maintain and deploy
- **Network dependency**: Clients depend on Node.js service being available in order to process messages to the LLM
- **Development overhead**: Need to run Node.js service locally
- **Tool invocation location**: Tool logic is invoked on the server. While this introduces latency (covered above), write operations still occur via LiveStore events, preserving client-side reactivity.

### Neutral

- **LiveStore patterns**: Leverages existing event-driven architecture
- **Deployment**: Can use existing Render.com infrastructure from ADR-002
- **Migration path**: Can move back to client-side if needed
