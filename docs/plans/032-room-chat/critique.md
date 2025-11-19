# Room Chat Plan Critique

**Reviewer**: Claude Sonnet 4.5
**Date**: 2025-11-18

## Overview

This is a well-structured plan with strong foundations. The horizontal slicing creates shippable increments, the domain model is clear, and risks are identified upfront. However, the plan needs more precision around data modeling and lifecycle management to guide implementation effectively.

## Strengths

1. **Clear horizontal slicing**: The PR breakdown creates shippable, testable increments
2. **Strong domain model**: Room abstraction with agent roster is well-defined
3. **Practical non-goals**: Appropriately defers polish and admin UI
4. **Risk awareness**: Identifies key technical challenges upfront

## Areas for Improvement

### 1. Schema Design Clarity

**Issue**: The plan mentions adding `roomId`/`roomKind` to conversations but doesn't explain:
- What `roomKind` values exist (enum?)
- How room IDs map to existing entities (is `roomId: 'life-map'` literal? What about `project:<projectId>`?)
- Whether `roomId` is unique per workspace or global

**Suggestion**: Add a schema reference table in PR1 scope:

| roomKind | roomId format | Example | Entity relationship |
|----------|---------------|---------|---------------------|
| life-map | "life-map" | life-map | None (singleton) |
| category | "category:<categorySlug>" | category:health | References category record |
| project | "project:<projectId>" | project:abc123 | References project record |

### 2. Data Migration Strategy Missing

**Issue**: Adding required columns to `conversations` without addressing existing data.

**Suggestion**: Add to PR1:
- Migration strategy for existing conversations (null? default to legacy?)
- Cleanup plan for orphaned workers/conversations
- Validation that all conversations post-migration have valid `roomId`

### 3. Incomplete Auto-provisioning Logic

**Issue**: "Auto-provision worker + conversation" is mentioned but the exact flow isn't specified:
- What happens if a worker exists but conversation doesn't (or vice versa)?
- Who owns worker lifecycle (client? server? both?)?
- How do you prevent duplicate workers across tabs/users?

**Suggestion**: Add a sequence diagram or decision tree in PR1:

```
On room mount:
1. Query worker by roomId
2. If missing → create worker event → wait for materialization
3. Query conversation by roomId
4. If missing → create conversation event → wait
5. Load conversation into chat panel
```

### 4. Worker-to-Room Binding Ambiguity

**Issue**: The plan says workers are "linked" via `events.workerAssignedToCategory` but:
- What about Life Map (no category)?
- What about projects (new relationship type)?
- How do you query "all workers for this room"?

**Suggestion**: Define a unified binding strategy:
- Option A: New `roomAssignments` table with `(workerId, roomId, roomKind)`
- Option B: Denormalize `roomId` onto workers table
- Document trade-offs and pick one for PR1

### 5. Shared Conversations Unclear

**Issue**: "Conversations remain shared across everyone in the workspace" conflicts with "users manually pick any worker" in current state.

**Clarification needed**:
- Is there ONE conversation per room globally, or one per user per room?
- If shared, how do you handle conflicting user intents (user A asks about health, user B asks about projects in same room)?
- Should this be clarified as a known limitation?

**Suggestion**: Add to non-goals:
> "Per-user conversation history. All workspace members see the same room conversation initially; personalization comes in a future release."

### 6. Project Worker Cleanup Underspecified

**Issue**: PR4 mentions "mark workers inactive / conversations archived when a project is archived/deleted" but doesn't detail:
- Who triggers this (client? server?)
- What if conversation is active when project is deleted?
- Should workers be soft-deleted or hard-deleted?

**Suggestion**: Add explicit lifecycle events:

```typescript
events.workerDeactivated({ workerId, reason: 'project_archived', timestamp })
events.conversationArchived({ conversationId, roomId })
```

### 7. Testing Strategy Too Generic

**Issue**: "Tests for schema, hooks, and room chat components" doesn't specify:
- E2E coverage expectations
- Integration test boundaries
- What regressions you're protecting against

**Suggestion**: Add test matrix to each PR:

```markdown
**PR1 Tests:**
- Unit: Room definition validation, hook de-duplication
- Integration: Worker provisioning with LiveStore
- E2E: None (behind feature flag)

**PR2 Tests:**
- E2E: Navigate to /new/life-map, send message, verify response
- Regression: Old /chat still works
```

### 8. Performance Considerations Missing

**Issue**: Auto-provisioning workers on every room mount could be expensive.

**Questions**:
- How many workers could exist (8 categories + N projects + 1 life map)?
- Should worker creation be batched/debounced?
- What's the impact on initial page load?

**Suggestion**: Add to PR1 or PR5:
- Lazy worker creation (only on first chat open, not room mount)
- Prefetch strategy for common rooms
- Metrics for worker creation latency

### 9. Navigation Context Integration Vague

**Issue**: "include `navigationContext` (already provided by `useNavigationContext`) plus new room metadata" doesn't explain:
- What fields from `navigationContext` are relevant?
- How does room metadata differ from navigation context?
- Is this client-side metadata or server-side?

**Suggestion**: Show example message payload:

```typescript
{
  type: 'user_message',
  content: 'Help me with health',
  metadata: {
    roomId: 'category:health',
    roomKind: 'category',
    navigationContext: { path: '/new/category/health', ... },
    categoryId: 'health', // room-specific
  }
}
```

### 10. Rollback Strategy Absent

**Issue**: What happens if PR2 ships and has critical bugs?

**Suggestion**: Add deployment strategy:
- Feature flag approach (env var? LiveStore flag?)
- Rollback procedure (flip flag? revert migration?)
- Monitoring criteria (error rates, chat success metrics)

## Recommended Additions

### Add to PR1 Scope:

```markdown
**Schema Design Document:**
- Room ID format specification
- Worker-to-room relationship diagram
- Migration plan for existing conversations (default roomId: 'legacy')
- Query performance considerations (indexes needed?)
```

### Add to Overview:

```markdown
**Key Constraints:**
- One worker per room (rooms are workspace-global)
- One conversation per room (shared by all workspace members)
- Worker lifecycle tied to room entity lifecycle (projects)
```

### Add New Section Before "Pull Request Breakdown":

```markdown
## Data Model

### Room Types
- **Singleton rooms**: Life Map (fixed roomId: "life-map")
- **Category rooms**: 8 fixed categories (roomId: "category:<slug>")
- **Project rooms**: Dynamic per project (roomId: "project:<id>")

### Worker Provisioning
- Workers created on-demand when room is first accessed
- Worker IDs follow pattern: `<roomKind>-<identifier>-guide`
- Workers marked inactive when parent entity (project) is archived

### Conversation Scoping
- One conversation per room per workspace (shared)
- Conversations inherit roomId/roomKind for querying
- Historical conversations from legacy chat have roomId: null
```

## Summary

The plan is fundamentally sound but needs **more precision around data modeling and lifecycle management**. The biggest gaps are:

1. **Schema details**: Exact column types, constraints, indexes
2. **Provisioning semantics**: Race conditions, idempotency, ownership
3. **Cleanup strategy**: Worker/conversation lifecycle when entities change
4. **Testing specifics**: What coverage protects against which regressions

**Recommendation**: Add these details to PR1's scope as design documents that get reviewed before code. The horizontal slicing is excellent—don't lose that! With more precision in the data model and lifecycle management, the implementation will be much smoother.

---

*Reviewed by Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)*
