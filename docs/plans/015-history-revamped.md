# History Panel Re-enablement Plan

## Overview

The HistoryPanel was disabled due to materializer hash mismatch issues caused by impure materializers that called `logEvent()`. Now that the `eventsLog` table is no longer populated due to the materializer fix, we need to re-enable history tracking with:

1. **Selective event filtering** - Only show events that users care about
2. **Actor tracking** - Show who performed each action (user or worker)
3. **Alternative logging strategy** - Since materializers no longer populate eventsLog

## Current State Analysis

### What Was Disabled

- `HistoryPanel.tsx` still exists and uses `getAllEvents$` query
- The query expects `eventsLog` table with `id`, `eventType`, `eventData`, `createdAt`
- The eventsLog table is no longer populated due to materializer purification

### Event Categorization Analysis

Based on the 45+ events in `events.ts`, here's my categorization for what should appear in History:

#### ✅ **HIGH PRIORITY - Should Show in History**

These are actions users would want to track:

**Project & Structure Management:**

- `v1.ProjectCreated` - "Project 'X' was created"

**Task Management:**

- `v1.TaskCreated` - "Task 'X' created in column Y"
- `v1.TaskMoved` - "Task 'X' moved to column Y"
- `v1.TaskMovedToProject` - "Task 'X' moved to project Y"
- `v1.TaskUpdated` - "Task 'X' updated" (if significant fields changed)
- `v1.TaskArchived` - "Task 'X' archived"
- `v1.TaskUnarchived` - "Task 'X' restored"

**Document Management:**

- `v1.DocumentCreated` - "Document 'X' created"
- `v1.DocumentUpdated` - "Document 'X' updated" (title changes only, not content)
- `v1.DocumentArchived` - "Document 'X' archived"
- `v1.DocumentAddedToProject` - "Document 'X' added to project Y"
- `v1.DocumentRemovedFromProject` - "Document 'X' removed from project Y"

**Worker & Automation:**

- `v1.WorkerCreated` - "Worker 'X' created"
- `v1.WorkerUpdated` - "Worker 'X' updated" (name/role changes)
- `v1.WorkerAssignedToProject` - "Worker 'X' assigned to project Y"
- `v1.RecurringTaskCreated` - "Recurring task 'X' created"
- `v1.RecurringTaskEnabled` - "Recurring task 'X' enabled"
- `v1.RecurringTaskDisabled` - "Recurring task 'X' disabled"
- `v1.TaskExecutionCompleted` - "Automated task completed" (with output summary)
- `v1.TaskExecutionFailed` - "Automated task failed"

**Team & Collaboration:**

- `v1.UserCreated` - "User 'X' joined"
- `v1.CommentAdded` - "Comment added to task X"
- `v1.ContactCreated` - "Contact 'X' added"
- `v1.ProjectContactAdded` - "Contact 'X' added to project Y"

#### ⚠️ **MEDIUM PRIORITY - Conditional/Filtered**

Show these only under certain conditions:

- `v1.ConversationCreated` - Only if user-initiated, not auto-created
- `v1.ChatMessageSent` - Only show user messages, not assistant responses
- `v1.SettingUpdated` - Only show important settings changes

#### ❌ **LOW PRIORITY - Should NOT Show**

These are too noisy or not user-relevant:

**Internal/Technical Events:**

- `v1.UserSynced` - Internal sync operation
- `v1.LLMResponseReceived` - Too noisy
- `v1.LLMResponseStarted` - Internal processing
- `v1.LLMResponseCompleted` - Internal processing
- `v1.ConversationModelUpdated` - Minor setting change
- `v1.ColumnReordered` - Too frequent/minor
- `v1.RecurringTaskExecute` - Internal trigger event
- `v1.TaskExecutionStarted` - Show completion, not start

**Frequent Updates:**

- Most `v1.*Updated` events for minor field changes
- `v1.RecurringTaskUpdated` - Unless major changes
- `v1.ColumnCreated` / `v1.ColumnRenamed` / `v1.ColumnReordered` - Too noisy, not meaningful yet

## Actor Tracking Requirements

Currently, events don't include actor information. We need to:

1. **Add actor field to new events** going forward
2. **Infer actors** for existing events where possible
3. **Support multiple actor types:**
   - `user:{userId}` - Human user actions
   - `worker:{workerId}` - Worker/automation actions
   - `system` - System-initiated actions

### Implementation Strategy ✅ **UPDATED**

**Materializer Array Approach (Clean & Pure):**
Use LiveStore materializers' ability to return arrays of db actions to populate eventsLog:

```typescript
// In schema.ts materializers - PURE functions only
const materializers = State.SQLite.materializers(events, {
  'v1.ProjectCreated': ({ id, name, description, createdAt, actorId }) => [
    // Main table insert
    boards.insert({ id, name, description, createdAt, updatedAt: createdAt }),
    // History log insert (pure - no UUID generation or function calls)
    eventsLog.insert({
      id: `project_created_${id}`, // Deterministic ID based on event data
      eventType: 'v1.ProjectCreated',
      eventData: JSON.stringify({ id, name, description }),
      actorId, // Nullable field from event
      createdAt,
    }),
  ],
})
```

**Key Benefits:**

- ✅ Pure functions - no hash mismatch issues
- ✅ Deterministic IDs based on event data
- ✅ Single transaction for main data + history log
- ✅ Real-time updates via LiveStore queries

## Technical Implementation Plan

### Phase 1: Foundation (Day 1)

1. **Create HistoryEvent interface** with actor support
2. **Define HISTORY_RELEVANT_EVENTS** constant with filtered event types
3. **Implement actor inference logic** for existing events
4. **Choose and implement logging strategy** (Option A recommended)

### Phase 2: Enhanced UI (Day 2)

1. **Update HistoryPanel** to show filtered events with actors
2. **Create human-readable event descriptions** with actor attribution
3. **Add filtering/search capabilities** (by actor, date, event type)
4. **Implement real-time updates** using LiveStore reactivity

### Phase 3: Polish (Day 3)

1. **Add event details modal** for complex events
2. **Group related events** (e.g., bulk operations)
3. **Performance optimization** for large history
4. **Add settings** to control what events to show

## Data Structure Design

### New HistoryEvent Interface

```typescript
interface HistoryEvent {
  id: string
  type: string
  timestamp: Date
  data: any
  actor: {
    type: 'user' | 'worker' | 'system'
    id: string | null
    name: string
  }
  description: string // Human-readable description
  relatedEntities?: {
    // For linking to related objects
    projectId?: string
    taskId?: string
    documentId?: string
  }
}
```

### Event Description Templates

```typescript
const eventDescriptions = {
  'v1.ProjectCreated': (data, actor) => `${actor.name} created project "${data.name}"`,
  'v1.TaskCreated': (data, actor) => `${actor.name} created task "${data.title}"`,
  'v1.WorkerAssignedToProject': (data, actor) => `Worker "${data.workerId}" was assigned to project`,
  // ... more templates
}
```

## Questions for Clarification

1. **Actor Context**: How do we determine the current actor context? Is there a session/user context we can access?

2. **Worker Actions**: For worker-initiated events, do we have access to which specific worker performed the action?

3. **Real-time Updates**: Should the history panel update in real-time as events occur, or is it okay to refresh on page load?

4. **Event Retention**: How long should we keep history events? Should there be a cleanup/archiving strategy?

5. **Performance**: Given that some workspaces might have thousands of events, do we need pagination or infinite scroll?

6. **Filtering UI**: Should users be able to filter by specific actors, date ranges, or event types?

## Success Criteria

- ✅ History panel shows meaningful events users care about
- ✅ Each event clearly shows who performed the action
- ✅ No performance impact on main application
- ✅ Real-time or near-real-time updates
- ✅ Clean, readable event descriptions
- ✅ No crashes related to materializer hash mismatches

## Risk Assessment

**Low Risk:**

- Using LiveStore event stream (Option A) - well-supported feature
- Event filtering - straightforward logic

**Medium Risk:**

- Actor inference for existing events - may require heuristics
- Performance with large event volumes

**High Risk:**

- None identified - this is primarily a UI enhancement using existing data

## Next Steps

1. **Review and approve this plan** with any clarifications needed
2. **Choose logging strategy** (recommend Option A)
3. **Begin Phase 1 implementation** starting with event filtering
