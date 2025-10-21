# PR2: Task Attributes - Flexible Metadata System

## Status: 📋 Planning

## Context

PR1 successfully migrated tasks from column-based to status-based organization. This established the foundation for flexible task management. PR2 introduces a flexible attributes system to tasks, enabling extensible metadata without schema changes.

## Goals

1. Add `attributes` JSON field to tasks table
2. Implement attribute merge semantics (partial updates)
3. Demonstrate the system with ONE concrete example: `priority` attribute
4. Prove the architecture works end-to-end (schema → events → UI → LLM tools)
5. Establish patterns for future attribute additions

## Design Decisions & Rationale

### Why Start with `priority` Instead of `task_type`?

The original plan suggested starting with `task_type` (design, advance, connect, operate, discover), but `priority` is a better first attribute:

**Advantages of `priority`:**

- **Universal applicability**: Every task benefits from priority (high, normal, low)
- **Immediate user value**: Priority is a common mental model users already have
- **Simple enum**: Easy to validate, easy to UI (dropdown)
- **Demonstrates sorting/filtering**: Natural use case for Kanban grouping
- **Low cognitive load**: Users understand priority without training

**Why defer `task_type`:**

- Domain-specific taxonomy (design/advance/connect/operate/discover)
- Requires explanation and training
- Less universal - not all tasks fit these categories
- Can be added as second attribute once system is proven

### Attribute Merge Semantics

```typescript
// Partial update - preserves existing attributes
store.commit(
  events.taskAttributesUpdated({
    taskId: '123',
    attributes: { priority: 'high' }, // Only updates priority, preserves others
    updatedAt: new Date(),
  })
)

// Full replace - only when creating
store.commit(
  events.taskCreatedV2({
    // ...
    attributes: { priority: 'normal', customField: 'value' }, // Sets initial state
  })
)
```

**Rationale:**

- Merge semantics prevent accidental data loss
- Multiple systems can update different attributes independently
- Follows JSON Patch principles
- Future-proof for plugins/extensions

### Priority Values

```typescript
type TaskPriority = 'low' | 'normal' | 'high' | 'critical'
```

**Design choices:**

- 4 levels provide good granularity without overwhelming users
- `normal` as default (most tasks are normal priority)
- `critical` for urgent/blocking items
- Enum ensures type safety and UI consistency

## Schema Changes

### Tasks Table Update

```typescript
// In packages/shared/src/livestore/schema.ts

export const tasks = SQLite.table(
  'tasks',
  {
    // ... existing fields ...
    attributes: Schema.Object({
      priority: Schema.optional(Schema.Literal('low', 'normal', 'high', 'critical')),
      // Future attributes can be added here without breaking changes
    }).default({}),
  },
  [],
  { name: 'tasks' }
)
```

**Type export:**

```typescript
export type Task = State.SQLite.FromTable.RowDecoded<typeof tasks>
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical'
```

## Events

### New Event: `v2.TaskAttributesUpdated`

```typescript
// In packages/shared/src/livestore/events.ts

export const taskAttributesUpdated = Event.make('v2.TaskAttributesUpdated', {
  taskId: Schema.String,
  attributes: Schema.Object({
    priority: Schema.optional(Schema.Literal('low', 'normal', 'high', 'critical')),
    // Extensible for future attributes
  }),
  updatedAt: Schema.Date,
  actorId: Schema.String,
})
```

### Update Event: `v2.TaskCreatedV2`

```typescript
// Update existing v2.TaskCreatedV2 to accept optional attributes
export const taskCreatedV2 = Event.make('v2.TaskCreatedV2', {
  // ... existing fields ...
  attributes: Schema.optional(
    Schema.Object({
      priority: Schema.optional(Schema.Literal('low', 'normal', 'high', 'critical')),
    })
  ),
})
```

## Materializers

### v1 Materializers (Backward Compatibility)

```typescript
// All v1 task events initialize empty attributes
'v1.TaskCreated': ({ id, projectId, columnId, title, description, assigneeIds, position, createdAt, actorId }) => [
  tasks.insert({
    // ... existing fields ...
    attributes: {},  // v1 tasks have no attributes
  }),
  eventsLog.insert({ /* ... */ })
]
```

### v2 Materializers

```typescript
// v2.TaskCreatedV2 - accept optional attributes
'v2.TaskCreatedV2': ({ id, projectId, title, description, status, assigneeIds, attributes, position, createdAt, actorId }) => [
  tasks.insert({
    id,
    projectId,
    title,
    description,
    status: status || 'todo',
    assigneeIds: assigneeIds ? JSON.stringify(assigneeIds) : '[]',
    attributes: attributes || {},  // Default to empty object
    position,
    createdAt,
    updatedAt: createdAt,
  }),
  eventsLog.insert({ /* ... */ })
]

// v2.TaskAttributesUpdated - merge semantics
'v2.TaskAttributesUpdated': ({ taskId, attributes, updatedAt, actorId }) => [
  tasks.update({
    // Merge operation - preserves existing attributes, updates specified ones
    attributes: (currentRow: any) => ({ ...currentRow.attributes, ...attributes }),
    updatedAt,
  }).where({ id: taskId }),
  eventsLog.insert({ /* ... */ })
]
```

**Key points:**

- Merge preserves unrelated attributes (future-proof)
- LiveStore handles JSON serialization automatically
- Type-safe through Schema.Literal for priority values

## Queries

Tasks already return all fields including attributes. No new queries needed, but we can add convenience queries:

```typescript
// In packages/shared/src/livestore/queries.ts

/**
 * Get tasks filtered by priority
 */
export const getTasksByPriority$ = (projectId: string, priority: TaskPriority) =>
  live(get => {
    const tasks = get(getProjectTasks$(projectId))
    return tasks.filter(task => task.attributes?.priority === priority)
  })

/**
 * Get task priority summary for a project
 */
export const getProjectPrioritySummary$ = (projectId: string) =>
  live(get => {
    const tasks = get(getProjectTasks$(projectId))
    return {
      critical: tasks.filter(t => t.attributes?.priority === 'critical').length,
      high: tasks.filter(t => t.attributes?.priority === 'high').length,
      normal: tasks.filter(t => t.attributes?.priority === 'normal').length,
      low: tasks.filter(t => t.attributes?.priority === 'low').length,
      none: tasks.filter(t => !t.attributes?.priority).length,
    }
  })
```

## UI Components

### Priority Selector Component

```tsx
// packages/web/src/components/tasks/PrioritySelector/PrioritySelector.tsx

import React from 'react'
import type { TaskPriority } from '@work-squared/shared/schema'

export interface PrioritySelectorProps {
  value?: TaskPriority
  onChange: (priority: TaskPriority | undefined) => void
  placeholder?: string
  showNone?: boolean // Allow clearing priority
}

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select priority',
  showNone = true,
}) => {
  const priorities: Array<{ value: TaskPriority | undefined; label: string; color: string }> = [
    ...(showNone ? [{ value: undefined, label: 'None', color: 'text-gray-500' }] : []),
    { value: 'critical' as const, label: 'Critical', color: 'text-red-600' },
    { value: 'high' as const, label: 'High', color: 'text-orange-600' },
    { value: 'normal' as const, label: 'Normal', color: 'text-blue-600' },
    { value: 'low' as const, label: 'Low', color: 'text-gray-600' },
  ]

  return (
    <select
      value={value || ''}
      onChange={e => onChange((e.target.value as TaskPriority) || undefined)}
      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
    >
      <option value=''>{placeholder}</option>
      {priorities.map(({ value: pValue, label, color }) => (
        <option key={pValue || 'none'} value={pValue || ''} className={color}>
          {label}
        </option>
      ))}
    </select>
  )
}
```

### Priority Badge Component

```tsx
// packages/web/src/components/tasks/PriorityBadge/PriorityBadge.tsx

import React from 'react'
import type { TaskPriority } from '@work-squared/shared/schema'

export interface PriorityBadgeProps {
  priority?: TaskPriority
  size?: 'sm' | 'md' | 'lg'
}

const PRIORITY_STYLES: Record<TaskPriority, { bg: string; text: string }> = {
  critical: { bg: 'bg-red-100', text: 'text-red-800' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800' },
  normal: { bg: 'bg-blue-100', text: 'text-blue-800' },
  low: { bg: 'bg-gray-100', text: 'text-gray-800' },
}

const SIZE_STYLES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  if (!priority) return null

  const { bg, text } = PRIORITY_STYLES[priority]
  const sizeClass = SIZE_STYLES[size]

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${bg} ${text} ${sizeClass}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}
```

### Update CreateTaskModal

```tsx
// packages/web/src/components/tasks/CreateTaskModal.tsx
// Add priority selector after status selection

import { PrioritySelector } from './PrioritySelector/PrioritySelector.js'

// Add state
const [selectedPriority, setSelectedPriority] = useState<TaskPriority | undefined>(undefined)

// Update handleSubmit
store.commit(
  events.taskCreatedV2({
    // ... existing fields ...
    attributes: selectedPriority ? { priority: selectedPriority } : undefined,
  })
)

// Add to form
<div>
  <label htmlFor='task-priority' className='block text-sm font-medium text-gray-900 mb-2'>
    Priority
  </label>
  <PrioritySelector
    value={selectedPriority}
    onChange={setSelectedPriority}
    placeholder='Select priority (optional)'
  />
</div>
```

### Update TaskCard

```tsx
// packages/web/src/components/tasks/TaskCard/TaskCard.tsx
// Add priority badge to task card display

import { PriorityBadge } from '../PriorityBadge/PriorityBadge.js'

// In card render
;<div className='flex items-center gap-2'>
  <PriorityBadge priority={task.attributes?.priority} size='sm' />
  {/* existing content */}
</div>
```

### Update TaskModal (Detail View)

```tsx
// packages/web/src/components/tasks/TaskModal/TaskModal.tsx
// Add priority selector to task details

import { PrioritySelector } from '../PrioritySelector/PrioritySelector.js'

// Add priority editing capability
const handlePriorityChange = (priority: TaskPriority | undefined) => {
  store.commit(
    events.taskAttributesUpdated({
      taskId: task.id,
      attributes: { priority },
      updatedAt: new Date(),
      actorId: userId,
    })
  )
}

// Add to details section
;<div>
  <label className='block text-sm font-medium text-gray-900 mb-2'>Priority</label>
  <PrioritySelector value={task.attributes?.priority} onChange={handlePriorityChange} />
</div>
```

## Server Tools

### Update `create_task` Tool

```typescript
// packages/server/src/tools/schemas.ts

export const CreateTaskSchema = Schema.Object({
  // ... existing fields ...
  priority: Schema.optional(Schema.Literal('low', 'normal', 'high', 'critical')),
})

// packages/server/src/tools/tasks.ts

function createTaskCore(store: Store, params: CreateTaskParams): CreateTaskResult {
  const { priority, ...rest } = params

  // Build attributes object
  const attributes: Record<string, any> = {}
  if (priority) {
    attributes.priority = priority
  }

  store.commit(
    events.taskCreatedV2({
      // ... existing fields ...
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    })
  )

  return {
    success: true,
    taskId,
    taskTitle: title.trim(),
    projectName: targetProject.name,
    status,
    priority, // Include in result
    assigneeNames,
  }
}
```

### Add `update_task_priority` Tool

```typescript
// packages/server/src/tools/schemas.ts

export const UpdateTaskPrioritySchema = Schema.Object({
  taskId: Schema.String.annotations({ description: 'ID of the task to update' }),
  priority: Schema.Literal('low', 'normal', 'high', 'critical').annotations({
    description: 'New priority level for the task',
  }),
})

// packages/server/src/tools/tasks.ts

function updateTaskPriorityCore(store: Store, params: UpdateTaskPriorityParams): UpdateTaskPriorityResult {
  const { taskId, priority } = params

  // Verify task exists
  const tasks = store.query(getTaskById$(taskId))
  validators.requireEntity(tasks, 'Task', taskId)

  // Update priority using attributes event
  store.commit(
    events.taskAttributesUpdated({
      taskId,
      attributes: { priority },
      updatedAt: new Date(),
    })
  )

  return {
    success: true,
    task: {
      id: taskId,
      priority,
    },
  }
}

export const updateTaskPriority = wrapToolFunction(updateTaskPriorityCore)
```

### Update Tool Index

```typescript
// packages/server/src/tools/index.ts

export {
  createTask,
  updateTask,
  updateTaskPriority, // NEW
  moveTaskWithinProject,
  moveTaskToProject,
  orphanTask,
  archiveTask,
  unarchiveTask,
  getTaskById,
  getProjectTasks,
  getOrphanedTasks,
} from './tasks.js'
```

### Update Task Formatter

```typescript
// packages/server/src/services/agentic-loop/tool-formatters/task-formatter.ts

export class TaskFormatter {
  static task(
    task: { id: string; title: string; status?: string; priority?: string },
    options?: ChorusFormatterOptions
  ): string {
    const parts = [ChorusFormatter.task(task.id, options)]

    if (task.status) {
      parts.push(`[${task.status}]`)
    }

    if (task.priority && task.priority !== 'normal') {
      // Only show priority if not normal (reduce noise)
      parts.push(`(${task.priority} priority)`)
    }

    return parts.join(' ')
  }

  // ... rest of formatters ...
}
```

## Implementation Checklist

### Phase 1: Schema & Events

- [ ] Add `attributes` field to tasks table schema
- [ ] Add `TaskPriority` type export
- [ ] Add `v2.TaskAttributesUpdated` event definition
- [ ] Update `v2.TaskCreatedV2` event to accept optional attributes
- [ ] Update v1 materializers to initialize `attributes: {}`
- [ ] Add `v2.TaskAttributesUpdated` materializer with merge semantics
- [ ] Update `v2.TaskCreatedV2` materializer to handle attributes
- [ ] Run `pnpm lint-all` and `pnpm test`

### Phase 2: Queries (Optional)

- [ ] Add `getTasksByPriority$` query
- [ ] Add `getProjectPrioritySummary$` query
- [ ] Add tests for new queries
- [ ] Run `pnpm lint-all` and `pnpm test`

### Phase 3: UI Components

- [ ] Create `PrioritySelector` component
- [ ] Create `PriorityBadge` component
- [ ] Create Storybook stories for both components
- [ ] Update `CreateTaskModal` to include priority selector
- [ ] Update `TaskCard` to display priority badge
- [ ] Update `TaskModal` to allow priority editing
- [ ] Test priority selection and display in UI
- [ ] Run `pnpm lint-all` and `pnpm test`

### Phase 4: Server Tools

- [ ] Add `priority` parameter to `create_task` tool schema
- [ ] Update `createTaskCore` to handle priority attribute
- [ ] Add `update_task_priority` tool schema
- [ ] Implement `updateTaskPriorityCore` function
- [ ] Export new tool from index
- [ ] Update `TaskFormatter` to show priority in LLM responses
- [ ] Update tool result types to include priority
- [ ] Add tests for priority handling
- [ ] Run `pnpm lint-all` and `pnpm test`

### Phase 5: Testing & Documentation

- [ ] Test creating task with priority via UI
- [ ] Test updating task priority via UI
- [ ] Test creating task with priority via LLM
- [ ] Test updating task priority via LLM
- [ ] Test priority badge display on kanban board
- [ ] Test priority filtering (if implemented)
- [ ] Test attribute merge (doesn't overwrite other future attributes)
- [ ] Run full test suite: `CI=true pnpm test:e2e`
- [ ] Update this plan doc with completion notes

## Testing Strategy

### Unit Tests

```typescript
// Test attribute merge semantics
describe('v2.TaskAttributesUpdated materializer', () => {
  it('should merge new attributes with existing attributes', async () => {
    const store = createTestStore()

    // Create task with priority
    await store.mutate([
      events.taskCreatedV2({
        id: '1',
        projectId: 'p1',
        title: 'Test',
        status: 'todo',
        attributes: { priority: 'high', customField: 'value' },
        position: 0,
        createdAt: new Date(),
      }),
    ])

    // Update only priority
    await store.mutate([
      events.taskAttributesUpdated({
        taskId: '1',
        attributes: { priority: 'low' },
        updatedAt: new Date(),
      }),
    ])

    const tasks = await store.query(db => db.table('tasks').all())
    expect(tasks[0].attributes).toEqual({
      priority: 'low',
      customField: 'value', // Preserved!
    })
  })
})
```

### Integration Tests

- Create task with priority, verify in DB
- Update task priority, verify merge behavior
- Create task without priority, verify default behavior
- Test v1 events still work (create task without attributes)

### E2E Tests

```typescript
// e2e/task-priority.spec.ts
test('should create and update task priority', async ({ page }) => {
  await page.goto('/projects/test-project')

  // Create task with high priority
  await page.click('[data-testid="create-task-button"]')
  await page.fill('[data-testid="task-title"]', 'High priority task')
  await page.selectOption('[data-testid="task-priority"]', 'high')
  await page.click('[data-testid="create-task-submit"]')

  // Verify badge appears
  await expect(page.locator('[data-testid="priority-badge"]:has-text("High")')).toBeVisible()

  // Update priority
  await page.click('[data-testid="task-card"]:has-text("High priority task")')
  await page.selectOption('[data-testid="task-priority"]', 'critical')

  // Verify update
  await expect(page.locator('[data-testid="priority-badge"]:has-text("Critical")')).toBeVisible()
})
```

### Manual QA Checklist

- [ ] Create task without priority (UI)
- [ ] Create task with each priority level (UI)
- [ ] Update task priority through detail modal (UI)
- [ ] Verify priority badge appears on kanban cards
- [ ] Create task with priority via LLM chat
- [ ] Update task priority via LLM chat
- [ ] Verify LLM displays priority in task summaries
- [ ] Test with mixed priority and non-priority tasks
- [ ] Verify data persists across page reload

## Success Criteria

- [ ] All unit tests passing (315+ tests)
- [ ] All E2E tests passing (27+ tests)
- [ ] All CI checks green (eslint, prettier, typecheck, storybook)
- [ ] Priority can be set during task creation (UI and LLM)
- [ ] Priority can be updated on existing tasks (UI and LLM)
- [ ] Priority badge displays correctly on kanban cards
- [ ] Attribute merge preserves unrelated attributes
- [ ] No breaking changes to existing functionality
- [ ] Storybook stories demonstrate all priority states

## Future Enhancements (Not in PR2)

Once PR2 is complete, we can easily add more attributes:

1. **Task Type** (`design`, `advance`, `connect`, `operate`, `discover`)
2. **Complexity** (`simple`, `complicated`, `complex`, `chaotic`)
3. **Urgency** (`low`, `normal`, `high`, `critical`)
4. **Scale** (`micro`, `minor`, `major`, `epic`)
5. **Custom Attributes** - User-defined fields

Each new attribute follows the same pattern:

1. Add to Schema.Object in task attributes
2. (Optional) Create new UI component or reuse PrioritySelector pattern
3. (Optional) Add LLM tool parameter
4. Test and deploy

## Notes & Learnings from PR1

**What went well:**

- Incremental event migration worked perfectly (v1 + v2 coexist)
- Materializer updates for backward compatibility
- Large integer positioning strategy (POSITION_GAP=1000)
- Comprehensive testing caught issues early

**What to watch out for:**

- Type safety with optional fields (use `as TaskPriority` assertions carefully)
- Array vs object return types from queries
- React context lifecycle (hooks inside providers)
- Position calculation edge cases

**Patterns to reuse:**

- Event versioning (v1 vs v2)
- Materializer backward compatibility
- Storybook with LiveStore provider pattern
- TodoWrite for progress tracking

## Risk Mitigation

**Risk:** Attribute schema too rigid, hard to extend
**Mitigation:** Use Schema.Object with optional fields, demonstrate extensibility

**Risk:** Performance issues with JSON attributes
**Mitigation:** LiveStore handles JSON efficiently, test with large task sets

**Risk:** UI complexity with too many attribute selectors
**Mitigation:** Start with one (priority), prove the pattern, then add more

**Risk:** Breaking changes to existing data
**Mitigation:** All v1 events initialize empty attributes, no data loss

## Open Questions

1. Should priority filter be part of PR2 or deferred?
   - **Decision:** Defer to PR3 when we add multiple attributes and filtering becomes more valuable

2. Should we use priority for sorting tasks within status columns?
   - **Decision:** Defer to PR3. PR2 focuses on proving the attribute system works.

3. Should "None" be an explicit priority value or undefined?
   - **Decision:** Use `undefined` for no priority. Cleaner semantics, works with optional fields.

4. Should we add priority colors to kanban columns?
   - **Decision:** Not in PR2. Keep it simple with just badges. Consider for PR3.

## Timeline Estimate

**Not providing time estimates per user guidelines.** Focus on incremental delivery:

1. Schema + Events (first commit)
2. Queries (second commit)
3. UI Components (third commit)
4. Server Tools (fourth commit)
5. Testing + Documentation (final commit)

Each commit should be fully tested and deployable.

## Related Documents

- [Main Migration Plan](./README.md)
- [PR1 Completion Notes](./PR1-task-status-migration.md)
- [LiveStore Patterns](https://docs.livestore.dev/llms.txt)
