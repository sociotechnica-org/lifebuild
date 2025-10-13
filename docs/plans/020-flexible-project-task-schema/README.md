# Plan 020: Flexible Project & Task Schema Migration

## Goal

Migrate the LiveStore schema from a rigid column-based task organization to a flexible, attribute-driven system that supports customizable project categories, task statuses, and extensible metadata attributes.

## Current State

### Problems with Current Schema

1. **Rigid Column Structure**: Tasks are tied to `columnId`, which conflates status with database structure
2. **Board vs Project Confusion**: `boards` table exists alongside project terminology
3. **Limited Extensibility**: No way to add custom attributes to projects or tasks without schema changes
4. **Inflexible Categorization**: No support for project categories (life areas) or custom task attributes
5. **Kanban Limitations**: Board can only display by column, not by any arbitrary attribute

### Current Schema (v1)

```typescript
// Tables
boards (really projects)
  - id, name, description, createdAt, updatedAt, deletedAt

columns
  - id, projectId, name, position, createdAt, updatedAt

tasks
  - id, projectId, columnId, title, description, assigneeIds, position, createdAt, updatedAt, archivedAt
```

## Desired State

### New Capabilities

1. **Status-Based Tasks**: Replace `columnId` with `status` field ('todo', 'doing', 'in_review', 'done')
2. **Project Categories**: 8 predefined life area categories (Health & Well-Being, Relationships, Finances, Personal Growth & Learning, Leisure & Lifestyle, Spirituality & Meaning, Home & Environment, Contribution & Service)
3. **Flexible Attributes**: JSON-based attributes on both projects and tasks that can be extended over time
4. **Future Attribute Support**: Scale (micro, minor, major, epic), complexity (simple, complicated, complex, chaotic), urgency (low, normal, high, critical), etc.
5. **Flexible Kanban Views**: Ability to group/filter by any attribute (starting with status)

### New Schema (v2)

```typescript
// Tables
projects (renamed from boards)
  - id, name, description, category, attributes (JSON), createdAt, updatedAt, archivedAt

tasks (updated)
  - id, projectId, title, description, status, assigneeIds, attributes (JSON), position, createdAt, updatedAt, archivedAt

projectCategories (new)
  - id, name, description, colorHex, position, createdAt, updatedAt
```

## Migration Strategy

### Key Principle: Event Sourcing Compatibility

Per LiveStore principles, we **cannot** remove old events. Instead:

1. **Keep all v1 events** - They remain in the codebase forever
2. **Add new v2 events** - New structure with status, categories, attributes
3. **Update v1 materializers** - Map old events to new table structure
4. **Add v2 materializers** - Handle new events properly
5. **Deprecate columns table** - v1 materializers for column events become no-ops

### Phase 1: Schema Changes

#### 1.1 Update Tables in `packages/shared/src/livestore/schema.ts`

- Remove `columns` table from exports (keep definition for reference)
- Rename `boards` → `projects` (update all references)
- Update `tasks` table:
  - Remove `columnId` column
  - Add `status` column (default: 'todo')
  - Add `attributes` column (JSON, default: '{}')
- Add `projects` table:
  - Add `category` column (nullable, references projectCategories.id)
  - Add `attributes` column (JSON, default: '{}')
  - Add `archivedAt` column (nullable)
- Add `projectCategories` table (new)

#### 1.2 Update Type Exports

```typescript
export type Project = State.SQLite.FromTable.RowDecoded<typeof projects>
export type Task = State.SQLite.FromTable.RowDecoded<typeof tasks>
export type ProjectCategory = State.SQLite.FromTable.RowDecoded<typeof projectCategories>

// Deprecated - will be removed in future version
export type Board = Project // Alias for backwards compatibility
export type Column = never // No longer exists
```

### Phase 2: Add V2 Events in `packages/shared/src/livestore/events.ts`

#### 2.1 Project Events

- `v2.ProjectCreated` - Add category, attributes fields
- `v2.ProjectUpdated` - Support updating category
- `v2.ProjectAttributesUpdated` - Merge new attributes with existing (partial update)
- `v2.ProjectArchived` - Soft delete project
- `v2.ProjectUnarchived` - Restore archived project

#### 2.2 Task Events

- `v2.TaskCreated` - Replace columnId with status, add attributes
- `v2.TaskUpdated` - Update title, description, assigneeIds (no status change)
- `v2.TaskStatusChanged` - Move task to different status with new position
- `v2.TaskReordered` - Change position within same status
- `v2.TaskMovedToProject` - Move task to different project (keeps status)
- `v2.TaskAttributesUpdated` - Merge new attributes with existing (partial update)

#### 2.3 Project Category Events

- `v2.ProjectCategoryCreated` - Create new category (for future custom categories)
- `v2.ProjectCategoryUpdated` - Update category metadata

### Phase 3: Update V1 Materializers

#### 3.1 Column Event Materializers (Deprecate)

```typescript
'v1.ColumnCreated': () => [], // No-op - columns no longer exist
'v1.ColumnRenamed': () => [], // No-op
'v1.ColumnReordered': () => [], // No-op
```

#### 3.2 Task Event Materializers (Map to New Schema)

```typescript
'v1.TaskCreated': ({ id, projectId, columnId, title, description, assigneeIds, position, createdAt, actorId }) => {
  // Map columnId to status - default all old tasks to 'todo'
  // Future enhancement: Create mapping based on known column IDs/names
  const status = 'todo'

  return [
    tasks.insert({
      id,
      projectId,
      title,
      description,
      status,
      assigneeIds: assigneeIds ? JSON.stringify(assigneeIds) : '[]',
      attributes: {}, // v1 tasks have no attributes
      position,
      createdAt,
      updatedAt: createdAt,
    }),
    eventsLog.insert({ /* ... */ })
  ]
}

'v1.TaskMoved': ({ taskId, toColumnId, position, updatedAt, actorId }) => {
  // Map column movement to status change
  const toStatus = 'todo' // Or use mapping function

  return [
    tasks.update({ status: toStatus, position, updatedAt }).where({ id: taskId }),
    eventsLog.insert({ /* ... */ })
  ]
}

'v1.TaskMovedToProject': ({ taskId, toProjectId, toColumnId, position, updatedAt, actorId }) => {
  const toStatus = 'todo' // Or use mapping function

  return [
    tasks.update({ projectId: toProjectId, status: toStatus, position, updatedAt }).where({ id: taskId }),
    eventsLog.insert({ /* ... */ })
  ]
}

// v1.TaskUpdated, v1.TaskArchived, v1.TaskUnarchived remain mostly unchanged
```

#### 3.3 Project Event Materializers (Add New Fields)

```typescript
'v1.ProjectCreated': ({ id, name, description, createdAt, actorId }) => [
  projects.insert({
    id,
    name,
    description,
    category: null, // v1 projects have no category
    attributes: {}, // v1 projects have no attributes
    createdAt,
    updatedAt: createdAt,
  }),
  eventsLog.insert({ /* ... */ })
]
```

### Phase 4: Add V2 Materializers

#### 4.1 Project Materializers

```typescript
'v2.ProjectCreated': ({ id, name, description, category, attributes, createdAt, actorId }) => [
  projects.insert({
    id,
    name,
    description,
    category,
    attributes: attributes || {},
    createdAt,
    updatedAt: createdAt,
  }),
  eventsLog.insert({ /* ... */ })
]

'v2.ProjectUpdated': ({ id, updates, updatedAt, actorId }) => {
  const updateData: Record<string, any> = { updatedAt }
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.category !== undefined) updateData.category = updates.category

  return [
    projects.update(updateData).where({ id }),
    eventsLog.insert({ /* ... */ })
  ]
}

'v2.ProjectAttributesUpdated': ({ id, attributes, updatedAt, actorId }) => [
  projects.update({
    // Merge operation - preserves existing attributes, adds/updates specified ones
    attributes: (currentRow: any) => ({ ...currentRow.attributes, ...attributes }),
    updatedAt,
  }).where({ id }),
  eventsLog.insert({ /* ... */ })
]

'v2.ProjectArchived': ({ id, archivedAt, actorId }) => [
  projects.update({ archivedAt }).where({ id }),
  eventsLog.insert({ /* ... */ })
]

'v2.ProjectUnarchived': ({ id, unarchivedAt, actorId }) => [
  projects.update({ archivedAt: null, updatedAt: unarchivedAt }).where({ id }),
  eventsLog.insert({ /* ... */ })
]
```

#### 4.2 Task Materializers

```typescript
'v2.TaskCreated': ({ id, projectId, title, description, status, assigneeIds, attributes, position, createdAt, actorId }) => [
  tasks.insert({
    id,
    projectId,
    title,
    description,
    status: status || 'todo',
    assigneeIds: assigneeIds ? JSON.stringify(assigneeIds) : '[]',
    attributes: attributes || {},
    position,
    createdAt,
    updatedAt: createdAt,
  }),
  eventsLog.insert({ /* ... */ })
]

'v2.TaskUpdated': ({ taskId, updates, updatedAt, actorId }) => {
  const updateData: Record<string, any> = { updatedAt }
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.assigneeIds !== undefined) updateData.assigneeIds = JSON.stringify(updates.assigneeIds)

  return [
    tasks.update(updateData).where({ id: taskId }),
    eventsLog.insert({ /* ... */ })
  ]
}

'v2.TaskStatusChanged': ({ taskId, toStatus, position, updatedAt, actorId }) => [
  tasks.update({ status: toStatus, position, updatedAt }).where({ id: taskId }),
  eventsLog.insert({ /* ... */ })
]

'v2.TaskReordered': ({ taskId, position, updatedAt, actorId }) => [
  tasks.update({ position, updatedAt }).where({ id: taskId }),
  eventsLog.insert({ /* ... */ })
]

'v2.TaskMovedToProject': ({ taskId, toProjectId, position, updatedAt, actorId }) => [
  tasks.update({ projectId: toProjectId, position, updatedAt }).where({ id: taskId }),
  eventsLog.insert({ /* ... */ })
]

'v2.TaskAttributesUpdated': ({ taskId, attributes, updatedAt, actorId }) => [
  tasks.update({
    // Merge operation - preserves existing attributes, adds/updates specified ones
    attributes: (currentRow: any) => ({ ...currentRow.attributes, ...attributes }),
    updatedAt,
  }).where({ id: taskId }),
  eventsLog.insert({ /* ... */ })
]
```

#### 4.3 Project Category Materializers

```typescript
'v2.ProjectCategoryCreated': ({ id, name, description, colorHex, position, createdAt }) =>
  projectCategories.insert({
    id,
    name,
    description,
    colorHex,
    position,
    createdAt,
  })

'v2.ProjectCategoryUpdated': ({ id, updates, updatedAt }) => {
  const updateData: Record<string, any> = { updatedAt }
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.colorHex !== undefined) updateData.colorHex = updates.colorHex
  if (updates.position !== undefined) updateData.position = updates.position

  return projectCategories.update(updateData).where({ id })
}
```

## Implementation Order

Each phase is a separate PR that results in a fully working, testable system. After each phase, we run:
- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`
- Manual QA in the UI

### PR 1: Task Column → Status Migration

**Goal**: Replace `columnId` with `status` field. Tasks now have status instead of belonging to columns.

**Changes**:
1. **Schema** (packages/shared/src/livestore/schema.ts)
   - Add `status` field to `tasks` table (default: 'todo')
   - Keep `columnId` temporarily for v1 compatibility
   - Update `Task` type export

2. **Events** (packages/shared/src/livestore/events.ts)
   - Add `v2.TaskCreated` with `status` field (no columnId)
   - Add `v2.TaskStatusChanged` (replaces TaskMoved)
   - Add `v2.TaskReordered` (position change within same status)
   - Keep all v1 events

3. **Materializers** (packages/shared/src/livestore/schema.ts)
   - Update `v1.TaskCreated`: Set `status: 'todo'`, still accept columnId
   - Update `v1.TaskMoved`: Update `status` field instead of columnId
   - Update `v1.TaskMovedToProject`: Update status field
   - Add `v2.TaskCreated`: Use status, no columnId
   - Add `v2.TaskStatusChanged`: Update status + position
   - Add `v2.TaskReordered`: Update position only

4. **Queries** (packages/shared/src/queries.ts)
   - Add `getTasksByStatus$(projectId, status)`
   - Add `getProjectStatusSummary$(projectId)`
   - Keep column queries working for now

5. **UI Components** (packages/web/src/components/)
   - Update `KanbanBoard` to use status-based queries
   - Replace column headers with status labels
   - Update drag-and-drop to use `v2.TaskStatusChanged`
   - Update `TaskForm` to use status dropdown instead of column selector
   - Update task creation to use `v2.TaskCreated`

6. **Server Tools** (packages/server/src/tools/)
   - Update `create_task` tool to use status instead of columnId
   - Update `move_task` to use `v2.TaskStatusChanged`
   - Update tool schemas and formatters

**Testing**:
- Create tasks with status
- Move tasks between statuses
- Drag and drop tasks
- Verify position ordering within status
- Test with LLM tools
- Verify old v1 events still work

**Result**: Tasks use status field, columns deprecated for tasks. Everything works end-to-end.

---

### PR 2: Task Attributes - Single Field (task_type)

**Goal**: Add flexible attributes system to tasks, starting with one concrete example: `task_type`.

**Changes**:
1. **Schema** (packages/shared/src/livestore/schema.ts)
   - Add `attributes` field to `tasks` table (JSON, default: '{}')
   - Update `Task` type export

2. **Events** (packages/shared/src/livestore/events.ts)
   - Add `v2.TaskAttributesUpdated` event
   - Update `v2.TaskCreated` to accept optional `attributes` field

3. **Materializers** (packages/shared/src/livestore/schema.ts)
   - Update `v1.TaskCreated`: Set `attributes: {}`
   - Update `v2.TaskCreated`: Accept attributes, default to {}
   - Add `v2.TaskAttributesUpdated`: Merge attributes (partial update)

4. **Queries** (packages/shared/src/queries.ts)
   - Tasks already return attributes, no query changes needed
   - Add `getTasksByType$(projectId, taskType)` for filtering

5. **UI Components** (packages/web/src/components/)
   - Add `TaskTypeSelector` component (design, advance, connect, operate, discover)
   - Update `TaskForm` to include task type selector
   - Update task detail view to show task type
   - Optional: Add task type badge/indicator on kanban cards
   - Optional: Add filter by task type to kanban board

6. **Server Tools** (packages/server/src/tools/)
   - Update `create_task` to accept `task_type` parameter
   - Update `update_task` to accept `task_type` parameter (uses TaskAttributesUpdated)
   - Update formatters to show task type

**Testing**:
- Create task with task_type
- Update task's task_type
- Verify task_type persists across reloads
- Filter tasks by task_type
- Test attribute merge (doesn't overwrite other attributes)
- Test with LLM tools

**Result**: Tasks have attributes system working with concrete example. Can add more attributes incrementally.

---

### PR 3: Remove Columns Completely

**Goal**: Clean up columns table and all column-related code now that tasks use status.

**Changes**:
1. **Schema** (packages/shared/src/livestore/schema.ts)
   - Remove `columns` table from exports
   - Remove `columnId` from tasks table (migration complete)
   - Remove `Column` type export

2. **Materializers** (packages/shared/src/livestore/schema.ts)
   - Update column event materializers to no-ops:
     - `v1.ColumnCreated`: return []
     - `v1.ColumnRenamed`: return []
     - `v1.ColumnReordered`: return []

3. **Queries** (packages/shared/src/queries.ts)
   - Remove column-related queries
   - Remove any remaining column references

4. **UI Components** (packages/web/src/components/)
   - Remove any remaining column components/references
   - Remove column management UI

5. **Server Tools** (packages/server/src/tools/)
   - Remove column-related tools if any exist

**Testing**:
- Verify old v1 column events don't break event replay
- Verify everything still works without columns
- Full regression testing of task CRUD

**Result**: Columns completely removed, codebase cleaner. Tasks fully on status-based system.

---

### PR 4: Project Categories

**Goal**: Add 8 predefined life area categories to projects.

**Changes**:
1. **Schema** (packages/shared/src/livestore/schema.ts)
   - Add `projectCategories` table
   - Add `category` field to `projects` table (references projectCategories.id)
   - Add `archivedAt` field to `projects` table (for future archiving support)
   - Update type exports

2. **Events** (packages/shared/src/livestore/events.ts)
   - Add `v2.ProjectCategoryCreated`
   - Add `v2.ProjectCategoryUpdated`
   - Add `v2.ProjectCreated` with category field
   - Add `v2.ProjectUpdated` with category support

3. **Materializers** (packages/shared/src/livestore/schema.ts)
   - Update `v1.ProjectCreated`: Set `category: null`
   - Add `v2.ProjectCreated`: Support category
   - Add `v2.ProjectUpdated`: Support category updates
   - Add category event materializers

4. **Bootstrap** (packages/shared/src/livestore/bootstrap.ts)
   - Create `DEFAULT_PROJECT_CATEGORIES` constant
   - Create `seedProjectCategories()` function
   - Call during first-time setup

5. **Queries** (packages/shared/src/queries.ts)
   - Add `getProjectWithCategory$(projectId)`
   - Add `getProjectsByCategory$(categoryId)`

6. **UI Components** (packages/web/src/components/)
   - Add `ProjectCategorySelector` component
   - Update `ProjectForm` to include category selector
   - Update project detail view to show category
   - Optional: Add category colors/badges to project cards
   - Optional: Add filter by category

7. **Server Tools** (packages/server/src/tools/)
   - Update `create_project` to accept category
   - Update `update_project` to support category changes
   - Update formatters

**Testing**:
- Create project with category
- Update project category
- View projects by category
- Verify 8 categories seeded on first run
- Test with LLM tools

**Result**: Projects have category system working with 8 life areas.

---

### PR 5: Project Attributes - Extensible Fields

**Goal**: Add flexible attributes system to projects.

**Changes**:
1. **Schema** (packages/shared/src/livestore/schema.ts)
   - Add `attributes` field to `projects` table (JSON, default: '{}')
   - Update `Project` type export

2. **Events** (packages/shared/src/livestore/events.ts)
   - Add `v2.ProjectAttributesUpdated`
   - Update `v2.ProjectCreated` to accept optional attributes

3. **Materializers** (packages/shared/src/livestore/schema.ts)
   - Update `v1.ProjectCreated`: Set `attributes: {}`
   - Update `v2.ProjectCreated`: Accept attributes
   - Add `v2.ProjectAttributesUpdated`: Merge attributes

4. **UI Components** (packages/web/src/components/)
   - Add generic attributes editor component
   - Update `ProjectForm` to show attributes panel
   - Example attributes: scale, complexity, urgency

5. **Server Tools** (packages/server/src/tools/)
   - Update project tools to support custom attributes

**Testing**:
- Add custom attributes to project
- Update attributes incrementally
- Verify attribute merge semantics
- Test with LLM tools

**Result**: Projects have full attribute system. Foundation complete for future custom attributes.

---

### PR 6: Project Archiving (Optional)

**Goal**: Add archive/unarchive functionality for projects (schema already supports it).

**Note**: The `archivedAt` field is already in the projects table from PR 4, but no events/UI exist to use it yet.

**Changes**:
1. **Events** (packages/shared/src/livestore/events.ts)
   - Add `v2.ProjectArchived`
   - Add `v2.ProjectUnarchived`

2. **Materializers** (packages/shared/src/livestore/schema.ts)
   - Add archive/unarchive materializers

3. **Queries** (packages/shared/src/queries.ts)
   - Update project queries to filter archived by default
   - Add `getArchivedProjects$()` query

4. **UI Components** (packages/web/src/components/)
   - Add archive/unarchive actions
   - Add archived projects view

5. **Server Tools** (packages/server/src/tools/)
   - Add archive/unarchive tools

**Testing**:
- Archive projects
- Unarchive projects
- Verify archived projects hidden from main views
- Test with LLM tools

**Result**: Complete project lifecycle management with archiving.

**Alternative**: This PR could be skipped or done much later since archiving is not critical for the core functionality.

## Migration Impact

### Breaking Changes

- Column-related queries will return empty results
- Column IDs are no longer valid references
- Board terminology fully replaced with Project

### Backwards Compatibility

- Old v1 events continue to work (materialized to new schema)
- Existing data migrated via v1 materializers
- Type alias `Board = Project` maintains compatibility

### Data Migration

No manual data migration needed - LiveStore's event replay will automatically:
1. Process old v1 events through updated materializers
2. Map columnId references to status='todo'
3. Initialize empty attributes objects
4. Preserve all existing task and project data

## Future Enhancements

Once this migration is complete, we can easily add:

1. **Custom Task Statuses** - Allow users to define their own statuses
2. **Custom Attributes** - UI for defining and managing custom attributes
3. **Flexible Kanban Views** - Group by any attribute (assignee, priority, etc.)
4. **Advanced Filtering** - Filter by multiple attributes simultaneously
5. **Project Templates** - Pre-configured categories and attributes for common project types

## Testing Strategy

### Unit Tests

- Test v1 materializers correctly map to new schema
- Test v2 materializers handle all field combinations
- Test attribute merge semantics
- Test status transitions

### Integration Tests

- Test event replay with mixed v1/v2 events
- Test UI components with migrated data
- Test server tools with new events

### E2E Tests

- Create project with category
- Create task with status
- Move task between statuses
- Update task attributes
- Verify data persistence across page reloads

## Success Criteria

- All existing data successfully migrated
- No data loss during migration
- All tests passing (unit, integration, e2e)
- UI reflects new status-based task organization
- LLM tools working with new events
- Documentation updated
