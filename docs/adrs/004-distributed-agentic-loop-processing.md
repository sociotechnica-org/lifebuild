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
Event-based locking where clients compete for processing rights using LiveStore events. One approach would emit "processing started" events as locks, with clients checking for existing locks before processing. This keeps the current architecture but adds coordination complexity. Trade-offs: maintains immediate client-side tool execution and zero additional infrastructure, but introduces race conditions, lock timeout management, and "split-brain" scenarios where multiple clients think they won the lock.

**2. Server-side processing in Cloudflare Worker**
Move the entire agentic loop into the existing Cloudflare Worker that currently handles LLM API proxying. This centralizes processing without additional services. Trade-offs: leverages existing infrastructure and eliminates client coordination issues, but hits the 30-second Worker timeout limit for complex agentic loops and loses the immediate LiveStore integration benefit since Workers can't directly access the SQLite store.

**3. Node.js service with LiveStore node adapter**
Create a dedicated Node.js service that subscribes to LiveStore events and processes agentic loops with direct store access. This service would be the single authority for message processing while clients remain purely reactive. Trade-offs: provides proper architectural separation and eliminates all coordination issues with direct LiveStore integration, but adds operational complexity of another service and introduces network latency between user input and processing.

**4. Hybrid approach**
Keep tool execution client-side for immediate feedback but move coordination server-side. A lightweight coordination service would assign message processing to specific clients, combining the benefits of immediate tool execution with centralized coordination. Trade-offs: maintains immediate tool feedback and reduces server load, but still requires complex client coordination and doesn't solve the fundamental problem of multiple processors for the same logical operation.

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
         │                   │                   │
         └───────────────────┴───────────────────┴
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

### Concurrency Handling

A single Node.js service processing messages sequentially would create a bottleneck, especially for long-running agentic loops. We need to handle multiple simultaneous conversations without reintroducing race conditions.

**Approaches considered:**

**Per-conversation processing queues**: Each conversation gets its own processing queue, allowing multiple conversations to process concurrently while maintaining order within each conversation. This prevents blocking and maintains message ordering per conversation.

**Multiple Node.js instances with work distribution**: Deploy multiple instances that coordinate through LiveStore events, similar to the current multi-client problem but with proper coordination mechanisms. Instances could claim conversations or use a distributed work queue pattern.

**Async processing within single service**: Use JavaScript's async/await and event loop to process multiple agentic loops concurrently within one Node.js process. This is the simplest approach and likely sufficient given that most processing time is spent waiting for LLM API calls.

The recommended approach is **async processing within a single service initially**, scaling to multiple instances with coordination as needed. JavaScript's event loop handles I/O-bound operations (LLM calls) efficiently, and we can process multiple conversations concurrently without complex coordination.

## Consequences

### Positive

- **Single processor**: Only one service processes each message, eliminating duplication
- **Proper separation**: UI updates remain reactive, side effects have clear ownership
- **Better error handling**: Centralized retry logic, timeout management
- **Performance**: No wasted API calls or duplicate tool execution
- **Scalability**: Can add more processor instances with coordination
- **Debugging**: Centralized logs for all agentic loop processing
- **LiveStore integration**: Direct access to store using node adapter

### Negative

- **Architectural complexity**: Adds another service to maintain and deploy
- **Network dependency**: Clients depend on Node.js service being available
- **Development overhead**: Need to run Node.js service locally
- **Latency**: Additional round-trip through Node.js service
- **Tool execution location**: Tools run on server, not immediately client-side

### Neutral

- **LiveStore patterns**: Leverages existing event-driven architecture
- **Deployment**: Can use existing Render.com infrastructure from ADR-002
- **Migration path**: Can move back to client-side if needed
