# Server-Side Agentic Loop Implementation TODO

## Overview

**UPDATED APPROACH**: Hard cutover from client-side to server-side agentic loop execution. Multi-store support is already implemented and deployed to production.

This migration moves ALL LLM tool execution to the server, removing the complex client-side agentic loop entirely. The client will become much simpler - just sending user messages to the server and displaying responses.

**Status**: Multi-store support is complete through Phase 2 and deployed to production.

## Implementation Plan - Event-Driven Architecture

**Goal**: Move all agentic loop execution to server using LiveStore events (NO REST APIs)

### Phase 1: Server Infrastructure ✅

**Status**: ✅ COMPLETE - Multi-store server is deployed and ready

- [x] Multi-store support (Phase 2 complete per multiplayer plan)
- [x] Store isolation and event routing
- [x] Health endpoints and monitoring

### Phase 2: Move Core Components to Server

- [ ] Move `packages/shared/src/llm/agentic-loop/` → `packages/server/src/services/agentic-loop/`
- [ ] Move `packages/shared/src/llm-tools/` → `packages/server/src/tools/`
- [ ] Create direct Braintrust integration in server (no proxy)
- [ ] Adapt agentic loop to work with LiveStore events instead of HTTP

### Phase 3: Event-Driven Chat Processing

**No REST endpoints** - Everything flows through LiveStore events:

- [ ] Extend `EventProcessor` to watch for `chatMessageSent` events
- [ ] When user message detected → trigger agentic loop with worker context
- [ ] Tool execution creates normal LiveStore events (`task.created`, etc.)
- [ ] LLM responses become `llmResponseReceived` events
- [ ] Add progress events (`agenticLoopStarted`, `toolExecutionStarted`, etc.)

### Phase 4: Client Simplification

- [ ] Remove all agentic loop logic from `ChatInterface.tsx` (lines 34-450)
- [ ] Keep only UI and message sending via `events.chatMessageSent()`
- [ ] All responses come via existing LiveStore subscriptions
- [ ] Add UI for new progress/status events

### Phase 5: Worker Cleanup

- [ ] Remove LLM proxy from `packages/worker/functions/_worker.ts`
- [ ] Clean up Braintrust integration (lines 152-351)
- [ ] Remove tool schemas import

### Phase 6: Shared Package Cleanup

- [ ] Remove `packages/shared/src/llm/` directory (moved to server)
- [ ] Remove `packages/shared/src/llm-tools/` directory (moved to server)
- [ ] Update imports across codebase

**Benefits of Event-Driven Approach**:

- ✅ No HTTP APIs needed - pure LiveStore event flows
- ✅ Multi-store infrastructure already exists and is tested
- ✅ Real-time updates via existing WebSocket subscriptions
- ✅ Removes 400+ lines of complex client code
- ✅ Direct Braintrust integration (no proxy overhead)
- ✅ Natural fit for recurring task execution
- ✅ Consistent with existing LiveStore patterns

## Critical Success Factors

### Must Maintain

- [ ] Zero downtime during migration
- [ ] No degradation in response time
- [ ] All existing tools continue to work
- [ ] Real-time streaming responses (via WebSocket events)
- [ ] Multi-store isolation (already implemented)

### Must Avoid

- [ ] Breaking production LLM functionality
- [ ] Cross-store data leakage (prevented by existing multi-store isolation)
- [ ] Increased error rates
- [ ] User-visible latency
- [ ] Loss of conversation context

### Migration Approach

**Event-Driven Cutover**: Since this uses existing LiveStore event infrastructure:

1. Deploy server with chat message event processing
2. Update client to stop running agentic loop locally
3. Remove client-side agentic loop code in same deployment
4. No backward compatibility needed - same events, different processor

**Flow**:

- User types message → `events.chatMessageSent()` (same as before)
- Server EventProcessor detects event → runs agentic loop
- Tool execution creates events → `task.created`, `document.updated`, etc.
- LLM responses → `events.llmResponseReceived()` (same as before)
- Client displays updates → via existing LiveStore subscriptions

## Dependencies

### Prerequisites ✅

- [x] **Multi-store server**: Deployed and handling multiple stores in production
- [x] **LiveStore integration**: Server has access to all store operations
- [x] **WebSocket events**: Real-time updates already working via LiveStore

### Environment Variables Needed

```env
# Server (.env)
BRAINTRUST_API_KEY=xxx
BRAINTRUST_PROJECT_ID=xxx
VITE_LLM_MAX_ITERATIONS=15
```

## Success Metrics

- [ ] 100% feature parity with client-side execution
- [ ] No increase in response latency
- [ ] All existing tools work identically
- [ ] Zero cross-store data leaks (maintained by existing isolation)
- [ ] Significant reduction in client bundle size
- [ ] Cleaner, more maintainable codebase
