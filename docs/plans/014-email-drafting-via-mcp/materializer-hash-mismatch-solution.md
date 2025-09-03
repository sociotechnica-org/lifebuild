# Materializer Hash Mismatch Solution

## Root Cause Identified ✅

The multi-store server materializer hash mismatch is caused by **complex materializers with function calls**. LiveStore cannot consistently hash materializers that:

1. **Call other functions** (like `logEvent()`)
2. **Return arrays of operations** (`[insert(), logEvent()]`)
3. **Use global functions** (`crypto.randomUUID()`, `JSON.stringify()`)
4. **Have side effects** (logging, external state changes)

## Proof of Concept

Created isolated reproduction in `/Users/jessmartin/Documents/code/node-web-monorepo-example/`:

- ❌ **Complex materializers**: Caused immediate materializer hash mismatch
- ✅ **Simple materializers**: Work perfectly with same events and monorepo structure

## The Fix

### Current Problematic Pattern in `packages/shared/src/livestore/schema.ts`:

```typescript
// ❌ CAUSES HASH MISMATCH
const materializers = State.SQLite.materializers(events, {
  'v1.ChatMessageSent': ({ id, conversationId, message, role, createdAt }) => [
    chatMessages.insert({ id, conversationId, message, role, createdAt }),
    logEvent('v1.ChatMessageSent', { id, conversationId, message, role, createdAt }, createdAt), // ← Function call breaks it
  ],
  'v1.ProjectCreated': ({ id, name, description, createdAt }) => [
    boards.insert({ id, name, description, createdAt, updatedAt: createdAt }),
    logEvent('v1.ProjectCreated', { id, name, description, createdAt }, createdAt), // ← Function call breaks it
  ],
})
```

### Fixed Pattern:

```typescript
// ✅ WORKS - Simple, pure materializers
const materializers = State.SQLite.materializers(events, {
  'v1.ChatMessageSent': ({ id, conversationId, message, role, createdAt }) =>
    chatMessages.insert({ id, conversationId, message, role, createdAt }), // Single operation only

  'v1.ProjectCreated': ({ id, name, description, createdAt }) =>
    boards.insert({ id, name, description, createdAt, updatedAt: createdAt }), // Single operation only
})
```

## Implementation Plan

### 1. Remove Function Calls from Materializers

**Replace this pattern:**

```typescript
'v1.EventName': (data) => [
  mainTable.insert(data),
  logEvent('v1.EventName', data),
],
```

**With this pattern:**

```typescript
'v1.EventName': (data) =>
  mainTable.insert(data),
```

### 2. Alternative Logging Strategy

If event logging is required, consider these approaches:

#### Option A: Database Triggers (Recommended)

Use SQLite triggers to automatically log to `eventsLog` table when main tables are updated.

#### Option B: Application-Level Event Tracking

Track events at the application level after successful commits:

```typescript
// In the application code (not materializers)
store.commit(event)
await logEventToDatabase(event.type, event)
```

#### Option C: Separate Event Stream

Use LiveStore's built-in event stream for auditing instead of custom logging.

### 3. Specific Changes Needed in Work Squared

**File**: `packages/shared/src/livestore/schema.ts`

**Events to fix** (remove `logEvent()` calls):

- `v1.ChatMessageSent`
- `v1.ProjectCreated`
- `v1.TaskCreated`
- `v1.ConversationCreated`
- `v1.DocumentCreated`
- `v1.SettingUpdated`

**Pattern**: Change from `[operation, logEvent()]` to `operation`

### 4. Testing

After implementing the fix:

1. **Test locally**: Multi-store server should no longer crash with materializer hash mismatch
2. **Verify event flow**: Events should still materialize correctly to main tables
3. **Check missing logs**: Implement alternative logging if event audit trail is required

## Breaking Changes

⚠️ **Event logging will be temporarily disabled** until alternative logging strategy is implemented.

If event audit trail is critical, implement Option A (database triggers) before deploying the materializer fixes.

## Benefits

- ✅ Multi-store server will work with web clients
- ✅ No more materializer hash mismatch crashes
- ✅ Cleaner, more predictable materializer functions
- ✅ Better LiveStore compatibility across adapters
