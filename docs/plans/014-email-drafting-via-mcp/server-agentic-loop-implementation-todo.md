# Server-Side Agentic Loop Implementation TODO

## Overview

Move the agentic loop from client-side to server-side to enable background task execution, recurring tasks, and email processing. This is a high-stakes migration that must be carefully staged to avoid breaking production LLM functionality.

**Critical Dependency**: Multi-store support must be implemented first or in parallel to avoid breaking existing client-side LLM calls.

## Phase 0: Prerequisites & Planning

**Goal**: Ensure we can move forward without breaking production

### Analysis

- [ ] Audit current client-side agentic loop implementation
  - Document all tool types and their implementations
  - Map event flows and state management
  - Identify WebSocket dependencies
  - List all LLM provider integrations

- [ ] Verify multi-store readiness
  - Confirm `packages/server` can handle multiple stores
  - Test store isolation
  - Verify event routing per store

### Decision Points

- [ ] Deployment strategy:
  - Option A: Deploy server with agentic loop disabled initially
  - Option B: Feature flag to toggle between client/server execution
  - Option C: Gradual rollout with specific stores

- [ ] Backward compatibility approach:
  - Keep client-side code as fallback
  - Version the API to support both modes
  - Plan deprecation timeline

### Tests

- [ ] Document current client-side behavior for regression testing
- [ ] Create test suite for critical paths

**QA Scenario**: Existing LLM chat functionality continues to work unchanged

**Deliverable**: Technical design document and migration plan

---

## Phase 1: Server-Side Agentic Loop Core

**Goal**: Port the agentic loop to server with feature flag control

### Backend

- [ ] Create `packages/server/src/services/agentic-loop.ts`:

  ```typescript
  class AgenticLoop {
    constructor(storeId: string)
    async execute(prompt: string, context: AgenticContext): Promise<AgenticResult>
    async handleToolCalls(tools: ToolCall[]): Promise<ToolResult[]>
  }
  ```

- [ ] Port core logic from `packages/web/src/components/chat/ChatInterface`:
  - Message handling
  - Tool call execution
  - Continuation logic (max 5 iterations)
  - Error handling

- [ ] Create `packages/server/src/services/llm-provider.ts`:
  - Braintrust integration
  - API key management
  - Rate limiting per store
  - Token counting

- [ ] Implement store-scoped execution:
  - Pass correct storeId to all operations
  - Isolate contexts between stores
  - Prevent cross-store data access

### Configuration

- [ ] Add feature flags:
  ```env
  ENABLE_SERVER_AGENTIC_LOOP=false
  SERVER_AGENTIC_STORES=workspace-123,workspace-456  # Specific stores to enable
  ```

### Tests

- [ ] Unit test: AgenticLoop class
- [ ] Unit test: Tool execution isolation
- [ ] Integration test: End-to-end prompt execution
- [ ] Test with multiple stores in parallel

**QA Scenario**: With feature flag off, client-side continues to work. With flag on for specific store, server handles LLM calls for that store only.

**Deliverable**: PR with server-side agentic loop (disabled by default)

---

## Phase 2: Tool Migration

**Goal**: Migrate all tools to server-side execution

### Backend

- [ ] Create `packages/server/src/tools/` directory structure:
  - `create-task.ts`
  - `list-projects.ts`
  - `list-documents.ts`
  - `read-document.ts`
  - `search-documents.ts`

- [ ] Port tool implementations:
  - Move from `packages/web/src/utils/llm-tools.ts`
  - Adapt to server-side LiveStore access
  - Add store validation to each tool
  - Implement proper error handling

- [ ] Create tool registry:

  ```typescript
  class ToolRegistry {
    registerTool(name: string, handler: ToolHandler): void
    getTools(storeId: string): ToolDefinition[]
    executeTool(storeId: string, name: string, args: any): Promise<any>
  }
  ```

- [ ] Implement tool authorization:
  - Verify tool access per store
  - Add audit logging
  - Rate limiting per tool

### Event Emission

- [ ] Emit tool execution events:
  - `tool.executing` - Tool starting
  - `tool.completed` - Tool finished
  - `tool.failed` - Tool error
  - Enable real-time UI updates

### Tests

- [ ] Unit test each tool in isolation
- [ ] Test tool registry and authorization
- [ ] Test event emission for UI updates
- [ ] Verify no regression in tool functionality

**QA Scenario**: All existing LLM tools work identically when executed server-side, with real-time updates in UI.

**Deliverable**: PR with server-side tool execution

---

## Phase 3: Client-Server Communication

**Goal**: Enable client to use server-side agentic loop seamlessly

### Backend

- [ ] Create REST endpoints:

  ```typescript
  POST /api/stores/:storeId/agentic/execute
  GET /api/stores/:storeId/agentic/status/:executionId
  POST /api/stores/:storeId/agentic/cancel/:executionId
  ```

- [ ] Implement WebSocket events for real-time updates:
  - Stream LLM responses
  - Tool execution progress
  - Final results

- [ ] Add execution tracking:
  - Store execution state
  - Support cancellation
  - Handle timeouts (5 min default)

### Frontend

- [ ] Update `ChatInterface.tsx`:
  - Detect if server-side is enabled
  - Route requests to server when enabled
  - Fall back to client-side if needed
  - Handle WebSocket events for streaming

- [ ] Update tool execution display:
  - Show server-side execution indicator
  - Handle latency gracefully
  - Display connection issues

- [ ] Add error handling:
  - Server unavailable
  - Timeout handling
  - Graceful degradation

### Tests

- [ ] E2E test: Client uses server agentic loop
- [ ] Test streaming responses
- [ ] Test error scenarios
- [ ] Test fallback to client-side

**QA Scenario**: User sends chat message, sees "Processing on server" indicator, receives streamed response with tool executions, identical UX to client-side.

**Deliverable**: PR with client-server integration

---

## Phase 4: Migration & Rollout

**Goal**: Safely migrate production to server-side execution

### Staged Rollout

- [ ] Stage 1: Enable for internal test store
  - Monitor performance
  - Check error rates
  - Verify tool execution

- [ ] Stage 2: Enable for 10% of stores
  - A/B test performance
  - Monitor user feedback
  - Track success metrics

- [ ] Stage 3: Enable for 50% of stores
  - Verify scalability
  - Monitor resource usage
  - Check rate limits

- [ ] Stage 4: Full rollout
  - Enable for all stores
  - Keep client-side as emergency fallback
  - Plan deprecation

### Monitoring

- [ ] Add metrics:
  - Execution duration
  - Success/failure rates
  - Tool usage per store
  - Token consumption

- [ ] Create dashboards:
  - Real-time execution status
  - Error rates by store
  - Performance comparison (client vs server)

- [ ] Set up alerts:
  - High error rates
  - Execution timeouts
  - Rate limit approaching

### Documentation

- [ ] Update architecture docs
- [ ] Create runbook for issues
- [ ] Document rollback procedure
- [ ] Update development setup

**QA Scenario**: Production traffic gradually moves to server-side with no degradation in service, full rollback possible if issues arise.

**Deliverable**: PR with monitoring and gradual rollout configuration

---

## Phase 5: Optimization & Cleanup

**Goal**: Optimize performance and remove client-side code

### Performance

- [ ] Implement caching:
  - Cache tool results where appropriate
  - Share context between executions
  - Reduce redundant API calls

- [ ] Optimize for scale:
  - Connection pooling for LLM APIs
  - Batch operations where possible
  - Implement request queuing

- [ ] Resource management:
  - Memory limits per execution
  - CPU throttling
  - Concurrent execution limits

### Cleanup

- [ ] Remove client-side agentic loop code
  - Delete old implementation
  - Clean up unused dependencies
  - Update tests

- [ ] Simplify configuration:
  - Remove feature flags
  - Clean up environment variables
  - Update documentation

### Tests

- [ ] Load test with multiple concurrent executions
- [ ] Test resource limits
- [ ] Verify no regressions after cleanup

**QA Scenario**: Server handles high load efficiently, client code is fully removed, system is simpler and more maintainable.

**Deliverable**: PR with optimizations and cleanup

---

## Critical Success Factors

### Must Maintain

- [ ] Zero downtime during migration
- [ ] No degradation in response time
- [ ] All existing tools continue to work
- [ ] Real-time streaming responses
- [ ] Multi-store isolation

### Must Avoid

- [ ] Breaking production LLM functionality
- [ ] Cross-store data leakage
- [ ] Increased error rates
- [ ] User-visible latency
- [ ] Loss of conversation context

### Rollback Plan

1. Feature flag to disable server-side execution
2. Client-side code remains as fallback
3. Environment variable to force client-side
4. Database migrations are backward compatible
5. Can rollback without data loss

## Dependencies

### Hard Dependencies

- **Multi-store support**: Must handle multiple stores before enabling server-side execution
- **WebSocket reliability**: Real-time updates must work reliably
- **LLM API access**: Server must have access to Braintrust APIs

### Soft Dependencies

- **Monitoring infrastructure**: Should have before production rollout
- **Rate limiting**: Should implement before high load
- **Caching layer**: Would improve performance but not required

## Risk Mitigation

### High Risk: Breaking Production

- **Mitigation**: Feature flags, staged rollout, client-side fallback

### High Risk: Performance Degradation

- **Mitigation**: Load testing, monitoring, gradual rollout

### Medium Risk: Increased Costs

- **Mitigation**: Token tracking, rate limiting, usage alerts

### Medium Risk: Security Issues

- **Mitigation**: Store isolation, audit logging, authorization checks

## Success Metrics

- [ ] 100% feature parity with client-side
- [ ] < 10ms additional latency
- [ ] > 99.9% success rate
- [ ] Zero cross-store data leaks
- [ ] 50% reduction in client bundle size (after cleanup)
