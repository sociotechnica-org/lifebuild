# PR3: Remove Columns Completely

## Status: 🚧 In Progress

## Context

PR1 successfully migrated tasks from column-based to status-based organization. PR2 added a flexible attributes system with priority support. Now PR3 completes the cleanup by removing all column-related code, making the codebase cleaner and fully committed to the status-based system.

## Completed Work Review

### PR1 Accomplishments

- ✅ Added `status` field to tasks ('todo' | 'doing' | 'in_review' | 'done')
- ✅ Created v2 task events (TaskCreated, TaskStatusChanged, TaskReordered, TaskMovedToProject)
- ✅ Updated v1 materializers to map `columnId` → `status: 'todo'`
- ✅ Kept `columnId` field temporarily for backwards compatibility
- ✅ Added status-based queries
- ✅ All tests passing, merged successfully

### PR2 Accomplishments

- ✅ Added `attributes` JSON field to tasks
- ✅ Implemented `priority` attribute ('low' | 'normal' | 'high' | 'critical')
- ✅ Created `v2.TaskAttributesUpdated` event
- ✅ Updated materializers with proper attribute handling
- ✅ Fixed TaskModal to display status instead of column
- ✅ All tests passing, merged successfully

### Current State

The codebase still has:

- ❌ `columns` table definition (unused but present)
- ❌ `columnId` field in tasks table
- ❌ `Column` type export
- ❌ Column event materializers (still inserting to columns table)
- ❌ Column-related queries
- ❌ Test files referencing columns

## Goals

1. **Remove columns table** from schema exports and database
2. **Remove columnId field** from tasks table (migration complete)
3. **Remove Column type** export and all references
4. **Convert column materializers to no-ops** (preserve event history)
5. **Remove column queries** from queries module
6. **Clean up test files** to remove column dependencies
7. **Ensure backwards compatibility** - old v1 column events must not break event replay

## Design Decisions & Challenges

### Challenge 1: Event Sourcing Compatibility

**Problem:** We cannot delete old events, but columns table still receives inserts from v1 events.

**Solution:**

- Convert v1 column event materializers to no-ops (return empty array)
- This preserves event history without side effects
- Old v1.ColumnCreated events will replay successfully but do nothing

### Challenge 2: Backwards Compatibility for Tests

**Problem:** Many test files create mock columns and reference columnId.

**Solution:**

- Remove `columnId` from Task type
- Update all test utilities (createMockTask) to remove columnId
- Search and replace all columnId references in tests
- Tests should use status-based mocking instead

### Challenge 3: Minimizing Disruption

**Problem:** Want to remove columns cleanly without breaking anything.

**Solution:**

- Make this PR focused and surgical - only column removal
- Don't change unrelated code
- Run full test suite after each change
- Commit incrementally for easier rollback if needed

## Implementation Plan

### Phase 1: Schema Cleanup

**Files to modify:**

- `packages/shared/src/livestore/schema.ts`

**Changes:**

1. Remove `columns` table from `tables` object (but keep definition as comment for reference)
2. Remove `columnId` field from `tasks` table schema
3. Remove `Column` type export
4. Update column event materializers to no-ops:
   ```typescript
   'v1.ColumnCreated': () => [], // No-op - columns no longer exist
   'v1.ColumnRenamed': () => [], // No-op
   'v1.ColumnReordered': () => [], // No-op
   ```
5. Remove `columnId` from v1.TaskCreated materializer:
   ```typescript
   'v1.TaskCreated': ({ id, projectId, columnId, title, description, assigneeIds, position, createdAt, actorId }) => {
     const status = 'todo'
     return [
       tasks.insert({
         id,
         projectId,
         // columnId removed
         title,
         description,
         status,
         assigneeIds: assigneeIds ? JSON.stringify(assigneeIds) : undefined,
         attributes: null,
         position,
         createdAt,
         updatedAt: createdAt,
       }),
       eventsLog.insert({ /* ... */ })
     ]
   }
   ```
6. Remove `columnId: ''` from v2.TaskCreated materializer:
   ```typescript
   'v2.TaskCreated': ({ id, projectId, title, description, status, assigneeIds, attributes, position, createdAt, actorId }) => [
     tasks.insert({
       id,
       projectId,
       // columnId: '' removed
       title,
       description,
       status: status || 'todo',
       assigneeIds: assigneeIds ? JSON.stringify(assigneeIds) : '[]',
       attributes: attributes || null,
       position,
       createdAt,
       updatedAt: createdAt,
     }),
     eventsLog.insert({ /* ... */ })
   ]
   ```

### Phase 2: Queries Cleanup

**Files to modify:**

- `packages/shared/src/livestore/queries.ts`

**Changes:**

1. Remove column-related queries:
   - `getBoardColumns$`
   - `getBoardColumnsOptional$`
   - `getColumnById$`
   - Any other column queries
2. Keep all status-based queries (these are the replacements)

### Phase 3: Test Utilities Cleanup

**Files to modify:**

- `packages/web/tests/test-utils.tsx`
- `packages/web/src/utils/taskReordering.test.ts`
- `packages/web/src/components/tasks/TaskModal/TaskModal.test.tsx`
- `packages/web/src/components/tasks/TaskModal/TaskModal.comment.test.tsx`

**Changes:**

1. Update `createMockTask` to remove `columnId` field
2. Update `createMockColumn` - mark as deprecated or remove entirely
3. Search all test files for `columnId` references and remove
4. Update any test assertions that check for column-related behavior

### Phase 4: Component Cleanup (if any remain)

**Files to check:**

- `packages/web/src/components/**/*.tsx`
- `packages/web/src/utils/*.ts`

**Changes:**

1. Search for any remaining `Column` type imports
2. Search for any remaining `columnId` property access
3. Remove any column-related UI components if they exist
4. Update any props interfaces that reference columns

### Phase 5: Type Cleanup

**Files to modify:**

- Any files importing `Column` type

**Changes:**

1. Remove `import type { Column } from '@work-squared/shared/schema'`
2. Replace with status-based alternatives if needed

## Testing Strategy

### After Each Phase

Run incrementally after each file change:

```bash
pnpm --filter @work-squared/shared typecheck
pnpm --filter @work-squared/web typecheck
pnpm test
```

### Final Verification

Before committing:

```bash
# Full quality checks
pnpm lint-all

# All unit tests
pnpm test

# E2E tests (optional but recommended)
CI=true pnpm test:e2e
```

### Manual QA Checklist

- [ ] Create new task with status
- [ ] Move task between statuses
- [ ] Drag and drop tasks
- [ ] View task details in TaskModal
- [ ] Verify position ordering within status
- [ ] Check that old tasks (from before migration) still appear correctly
- [ ] Test with LLM tools (create_task, move_task)

### Event Replay Testing

**Critical:** Verify that old v1 events don't break:

```typescript
// Test that v1.ColumnCreated events replay without errors
const store = createTestStore()
await store.mutate([
  events.columnCreated({
    id: 'col-1',
    projectId: 'proj-1',
    name: 'To Do',
    position: 0,
    createdAt: new Date(),
  }),
])
// Should succeed (no-op) without throwing

// Test that v1.TaskCreated events with columnId still work
await store.mutate([
  events.taskCreated({
    id: 'task-1',
    projectId: 'proj-1',
    columnId: 'col-1', // old event has columnId
    title: 'Old Task',
    description: '',
    assigneeIds: [],
    position: 0,
    createdAt: new Date(),
  }),
])

// Verify task was created with status='todo'
const tasks = await store.query(db => db.table('tasks').all())
expect(tasks[0].status).toBe('todo')
expect(tasks[0].columnId).toBeUndefined() // columnId should not exist
```

## Success Criteria

- [ ] `columns` table removed from schema
- [ ] `columnId` field removed from tasks table
- [ ] `Column` type export removed
- [ ] All column event materializers are no-ops
- [ ] All column queries removed
- [ ] All test files updated (no columnId references)
- [ ] All unit tests passing (467+ tests)
- [ ] All E2E tests passing (27+ tests)
- [ ] All CI checks green (eslint, prettier, typecheck, storybook)
- [ ] No TypeScript errors
- [ ] No linting warnings about columns
- [ ] Old v1 events replay successfully
- [ ] Manual QA passes

## Migration Impact

### Breaking Changes

- **`Column` type removed** - Any code importing this type will break
- **Column queries removed** - Code calling `getBoardColumns$` will break
- **`columnId` field removed** - Direct access to `task.columnId` will break

### Backwards Compatibility

- ✅ **Old v1 column events still work** - Materializers convert to no-ops
- ✅ **Old v1 task events work** - Materializer accepts columnId but ignores it
- ✅ **Event replay works** - All historical events replay successfully
- ✅ **Existing data preserved** - Tasks with status field continue to work

### Migration Guide for External Code

If any external code depends on columns:

```typescript
// Before (columns-based)
const columns = useQuery(getBoardColumns$(projectId))
const tasksInColumn = tasks.filter(t => t.columnId === 'col-1')

// After (status-based)
const statuses = ['todo', 'doing', 'in_review', 'done']
const tasksInStatus = tasks.filter(t => t.status === 'todo')

// Or use built-in query
const tasksByStatus = useQuery(getProjectTasksByStatus$(projectId))
```

## Risks & Mitigation

### Risk 1: Breaking Event Replay

**Risk:** Old events might fail to replay if materializers aren't properly updated.

**Mitigation:**

- Test event replay explicitly with old v1 events
- Materializers accept columnId parameter but don't use it
- No-op materializers return empty array (valid LiveStore response)

### Risk 2: Missing Column References

**Risk:** We might miss some column references in obscure files.

**Mitigation:**

- Use comprehensive grep searches
- TypeScript will catch missing imports/types
- Run full test suite to catch runtime issues
- Manual QA in UI

### Risk 3: Test Failures

**Risk:** Tests might break in unexpected ways.

**Mitigation:**

- Run tests after each file modification
- Fix incrementally rather than big-bang
- Keep git history clean for easy rollback

## Implementation Checklist

### Schema Phase

- [ ] Comment out `columns` table from exports
- [ ] Remove `columnId` from tasks table schema
- [ ] Remove `Column` type export
- [ ] Convert column materializers to no-ops
- [ ] Remove `columnId` from v1.TaskCreated materializer
- [ ] Remove `columnId` from v2.TaskCreated materializer
- [ ] Run typecheck and tests

### Queries Phase

- [ ] Remove `getBoardColumns$`
- [ ] Remove `getBoardColumnsOptional$`
- [ ] Remove `getColumnById$`
- [ ] Run typecheck and tests

### Test Utils Phase

- [ ] Remove `columnId` from createMockTask
- [ ] Remove or deprecate createMockColumn
- [ ] Run tests

### Test Files Phase

- [ ] Update taskReordering.test.ts
- [ ] Update TaskModal.test.tsx
- [ ] Update TaskModal.comment.test.tsx
- [ ] Search for any other test files with column references
- [ ] Run all tests

### Component Phase

- [ ] Search components for Column imports
- [ ] Search components for columnId property access
- [ ] Remove any remaining references
- [ ] Run typecheck and tests

### Final Verification

- [ ] Run `pnpm lint-all`
- [ ] Run `pnpm test`
- [ ] Run `CI=true pnpm test:e2e` (optional)
- [ ] Manual QA checklist complete
- [ ] Event replay test passes

## Commit Strategy

Make incremental commits:

1. `refactor(schema): remove columns table and columnId field`
2. `refactor(queries): remove column-related queries`
3. `test: update test utilities to remove columnId`
4. `test: update test files to remove column references`
5. `refactor: remove remaining column type imports`

Then create a single PR with all commits.

## Related Documents

- [Main Migration Plan](./README.md)
- [PR1: Task Status Migration](../PR1-task-status-migration.md)
- [PR2: Task Attributes](./PR2-task-attributes.md)
- [LiveStore Patterns](https://docs.livestore.dev/llms.txt)

## Notes

- This PR is purely cleanup - no new functionality
- Should be the quickest PR of the migration
- Once complete, the codebase is fully committed to status-based tasks
- Sets the stage for PR4 (Project Categories) and beyond
