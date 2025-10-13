# PR1: Task Column → Status Migration

## Overview

Replace the `columnId` field on tasks with a `status` field. This decouples task organization from the rigid column structure and enables flexible status-based views.

## Goals

- Tasks have a `status` field ('todo', 'doing', 'in_review', 'done') instead of `columnId`
- All UI components use status-based queries
- Old v1 events continue to work via updated materializers
- New v2 events use status field
- System is fully functional and testable end-to-end

## Technical Changes

### 1. Schema Changes

**File**: `packages/shared/src/livestore/schema.ts`

#### 1.1 Update Tasks Table

```typescript
const tasks = State.SQLite.table({
  name: 'tasks',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    projectId: State.SQLite.text({ nullable: true }),
    columnId: State.SQLite.text(), // KEEP for v1 compatibility - will remove in PR3
    title: State.SQLite.text({ default: '' }),
    description: State.SQLite.text({ nullable: true }),
    status: State.SQLite.text({ default: 'todo' }), // NEW FIELD
    assigneeIds: State.SQLite.text({ default: '[]' }),
    position: State.SQLite.integer({ default: 0 }),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    updatedAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    archivedAt: State.SQLite.integer({ nullable: true, schema: Schema.DateFromNumber }),
  },
})
```

**Notes**:

- Keep `columnId` temporarily for v1 event compatibility
- Add `status` field with default 'todo'
- Status values: 'todo', 'doing', 'in_review', 'done'

#### 1.2 Update Type Exports

```typescript
export type Task = State.SQLite.FromTable.RowDecoded<typeof tasks>

// Add status type for type safety
export type TaskStatus = 'todo' | 'doing' | 'in_review' | 'done'
```

### 2. Events

**File**: `packages/shared/src/livestore/events.ts`

#### 2.1 Add V2 Task Events

```typescript
// ============================================================================
// V2 TASK EVENTS - Status-based
// ============================================================================

export const taskCreatedV2 = Events.synced({
  name: 'v2.TaskCreated',
  schema: Schema.Struct({
    id: Schema.String,
    projectId: Schema.optional(Schema.String),
    title: Schema.String,
    description: Schema.Union(Schema.String, Schema.Undefined),
    status: Schema.optional(Schema.String), // 'todo' | 'doing' | 'in_review' | 'done'
    assigneeIds: Schema.Union(Schema.Array(Schema.String), Schema.Undefined),
    position: Schema.Number,
    createdAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const taskStatusChanged = Events.synced({
  name: 'v2.TaskStatusChanged',
  schema: Schema.Struct({
    taskId: Schema.String,
    toStatus: Schema.String, // 'todo' | 'doing' | 'in_review' | 'done'
    position: Schema.Number, // Position within the new status
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const taskReordered = Events.synced({
  name: 'v2.TaskReordered',
  schema: Schema.Struct({
    taskId: Schema.String,
    position: Schema.Number, // New position within same status
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const taskMovedToProjectV2 = Events.synced({
  name: 'v2.TaskMovedToProject',
  schema: Schema.Struct({
    taskId: Schema.String,
    toProjectId: Schema.optional(Schema.String),
    position: Schema.Number,
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

// Update v1.TaskUpdated to v2 (no changes needed, but version for consistency)
export const taskUpdatedV2 = Events.synced({
  name: 'v2.TaskUpdated',
  schema: Schema.Struct({
    taskId: Schema.String,
    updates: Schema.Struct({
      title: Schema.optional(Schema.String),
      description: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
      assigneeIds: Schema.optional(Schema.Array(Schema.String)),
    }),
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})
```

#### 2.2 Keep V1 Events Unchanged

Do not modify existing v1 events:

- `v1.TaskCreated` - Keep as-is
- `v1.TaskMoved` - Keep as-is
- `v1.TaskMovedToProject` - Keep as-is
- `v1.TaskUpdated` - Keep as-is
- `v1.TaskArchived` - Keep as-is
- `v1.TaskUnarchived` - Keep as-is

### 3. Materializers

**File**: `packages/shared/src/livestore/schema.ts`

#### 3.1 Update V1 Materializers (Map to New Schema)

```typescript
// ============================================================================
// V1 TASK MATERIALIZERS - Map columnId to status
// ============================================================================

'v1.TaskCreated': ({
  id,
  projectId,
  columnId,
  title,
  description,
  assigneeIds,
  position,
  createdAt,
  actorId,
}) => {
  // Strategy: Default all v1 tasks to 'todo' status
  // Alternative: Implement mapColumnIdToStatus() if you have known column mappings
  const status = 'todo'

  return [
    tasks.insert({
      id,
      projectId,
      columnId, // Keep for v1 compatibility
      title,
      description,
      status, // NEW: Map to status
      assigneeIds: assigneeIds ? JSON.stringify(assigneeIds) : '[]',
      position,
      createdAt,
      updatedAt: createdAt,
    }),
    eventsLog.insert({
      id: `task_created_${id}`,
      eventType: 'v1.TaskCreated',
      eventData: JSON.stringify({ id, title, projectId, columnId }),
      actorId,
      createdAt,
    }),
  ]
},

'v1.TaskMoved': ({ taskId, toColumnId, position, updatedAt, actorId }) => {
  // Map column movement to status change
  const toStatus = 'todo' // Or use mapColumnIdToStatus(toColumnId)

  return [
    tasks.update({
      columnId: toColumnId, // Keep for v1 compatibility
      status: toStatus, // NEW: Update status
      position,
      updatedAt
    }).where({ id: taskId }),
    eventsLog.insert({
      id: `task_moved_${taskId}_${updatedAt.getTime()}`,
      eventType: 'v1.TaskMoved',
      eventData: JSON.stringify({ taskId, toColumnId, position }),
      actorId,
      createdAt: updatedAt,
    }),
  ]
},

'v1.TaskMovedToProject': ({ taskId, toProjectId, toColumnId, position, updatedAt, actorId }) => {
  const toStatus = 'todo' // Or use mapColumnIdToStatus(toColumnId)

  return [
    tasks.update({
      projectId: toProjectId,
      columnId: toColumnId, // Keep for v1 compatibility
      status: toStatus, // NEW: Update status
      position,
      updatedAt
    }).where({ id: taskId }),
    eventsLog.insert({
      id: `task_moved_to_project_${taskId}_${updatedAt.getTime()}`,
      eventType: 'v1.TaskMovedToProject',
      eventData: JSON.stringify({ taskId, toProjectId, toColumnId, position }),
      actorId,
      createdAt: updatedAt,
    }),
  ]
},

// v1.TaskUpdated - No changes needed (doesn't touch columnId or status)
'v1.TaskUpdated': ({ taskId, title, description, assigneeIds, updatedAt, actorId }) => {
  const updates: Record<string, any> = { updatedAt }
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (assigneeIds !== undefined) updates.assigneeIds = JSON.stringify(assigneeIds)

  return [
    tasks.update(updates).where({ id: taskId }),
    eventsLog.insert({
      id: `task_updated_${taskId}_${updatedAt.getTime()}`,
      eventType: 'v1.TaskUpdated',
      eventData: JSON.stringify({ taskId, title, description, assigneeIds }),
      actorId,
      createdAt: updatedAt,
    }),
  ]
},

// v1.TaskArchived, v1.TaskUnarchived - No changes needed
```

#### 3.2 Add V2 Materializers

```typescript
// ============================================================================
// V2 TASK MATERIALIZERS - Status-based
// ============================================================================

'v2.TaskCreated': ({
  id,
  projectId,
  title,
  description,
  status,
  assigneeIds,
  position,
  createdAt,
  actorId,
}) => [
  tasks.insert({
    id,
    projectId,
    columnId: '', // Empty for v2 tasks - will be removed in PR3
    title,
    description,
    status: status || 'todo',
    assigneeIds: assigneeIds ? JSON.stringify(assigneeIds) : '[]',
    position,
    createdAt,
    updatedAt: createdAt,
  }),
  eventsLog.insert({
    id: `task_created_${id}_${createdAt.getTime()}`,
    eventType: 'v2.TaskCreated',
    eventData: JSON.stringify({ id, title, projectId, status }),
    actorId,
    createdAt,
  }),
],

'v2.TaskStatusChanged': ({ taskId, toStatus, position, updatedAt, actorId }) => [
  tasks.update({
    status: toStatus,
    position,
    updatedAt
  }).where({ id: taskId }),
  eventsLog.insert({
    id: `task_status_changed_${taskId}_${updatedAt.getTime()}`,
    eventType: 'v2.TaskStatusChanged',
    eventData: JSON.stringify({ taskId, toStatus, position }),
    actorId,
    createdAt: updatedAt,
  }),
],

'v2.TaskReordered': ({ taskId, position, updatedAt, actorId }) => [
  tasks.update({ position, updatedAt }).where({ id: taskId }),
  eventsLog.insert({
    id: `task_reordered_${taskId}_${updatedAt.getTime()}`,
    eventType: 'v2.TaskReordered',
    eventData: JSON.stringify({ taskId, position }),
    actorId,
    createdAt: updatedAt,
  }),
],

'v2.TaskMovedToProject': ({ taskId, toProjectId, position, updatedAt, actorId }) => [
  tasks.update({
    projectId: toProjectId,
    position,
    updatedAt
  }).where({ id: taskId }),
  eventsLog.insert({
    id: `task_moved_to_project_${taskId}_${updatedAt.getTime()}`,
    eventType: 'v2.TaskMovedToProject',
    eventData: JSON.stringify({ taskId, toProjectId, position }),
    actorId,
    createdAt: updatedAt,
  }),
],

'v2.TaskUpdated': ({ taskId, updates, updatedAt, actorId }) => {
  const updateData: Record<string, any> = { updatedAt }
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.assigneeIds !== undefined) updateData.assigneeIds = JSON.stringify(updates.assigneeIds)

  return [
    tasks.update(updateData).where({ id: taskId }),
    eventsLog.insert({
      id: `task_updated_${taskId}_${updatedAt.getTime()}`,
      eventType: 'v2.TaskUpdated',
      eventData: JSON.stringify({ taskId, updates }),
      actorId,
      createdAt: updatedAt,
    }),
  ]
},
```

#### 3.3 Update Events Export

```typescript
export const events = {
  ...eventsDefs,
  uiStateSet: uiState.set,
}
```

Make sure all new v2 events are exported from `events.ts`.

### 4. Queries

**File**: `packages/shared/src/livestore/queries.ts`

#### 4.1 Add Status-Based Queries

```typescript
// ============================================================================
// STATUS-BASED TASK QUERIES
// ============================================================================

/**
 * Get tasks by status for a project
 */
export const getTasksByStatus$ = (projectId: string, status: string) =>
  queryDb(
    tables.tasks
      .select()
      .where({ projectId, status, archivedAt: null })
      .orderBy([{ col: 'position', direction: 'asc' }]),
    {
      label: `getTasksByStatus:${projectId}:${status}`,
    }
  )

/**
 * Get all tasks grouped by status for a project
 * Returns tasks organized by status
 */
export const getProjectTasksByStatus$ = (projectId: string) =>
  queryDb(
    tables.tasks
      .select()
      .where({ projectId, archivedAt: null })
      .orderBy([
        { col: 'status', direction: 'asc' },
        { col: 'position', direction: 'asc' },
      ]),
    {
      label: `getProjectTasksByStatus:${projectId}`,
    }
  )

/**
 * Get task count summary by status for a project
 * Note: Returns all tasks, filtering done client-side
 */
export const getProjectStatusSummary$ = (projectId: string) =>
  queryDb(tables.tasks.select().where({ projectId, archivedAt: null }), {
    label: `getProjectStatusSummary:${projectId}`,
  })

/**
 * Get orphaned tasks by status (no project)
 */
export const getOrphanedTasksByStatus$ = (status: string) =>
  queryDb(
    tables.tasks
      .select()
      .where({ projectId: null, status, archivedAt: null })
      .orderBy([{ col: 'position', direction: 'asc' }]),
    {
      label: `getOrphanedTasksByStatus:${status}`,
    }
  )
```

#### 4.2 Keep Column Queries (Temporarily)

Keep existing column queries for now:

- `getBoardColumns$` / `getProjectColumns$`
- `getOrphanedColumns$`

These will be removed in PR3.

### 5. UI Components

#### 5.1 Update KanbanBoard Component

**File**: `packages/web/src/components/tasks/kanban/KanbanBoard.tsx`

Change from column-based to status-based:

```typescript
import React from 'react'
import { DndContext, DragOverlay, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core'
import type { Task, TaskStatus } from '@work-squared/shared/schema'
import { KanbanColumn } from './KanbanColumn/KanbanColumn.js'
import { TaskCard } from '../TaskCard/TaskCard.js'
import { RecurringTasksColumn } from '../../recurring-tasks/RecurringTasksColumn.js'

// Define status columns (replaces dynamic columns)
const STATUS_COLUMNS: { id: TaskStatus; name: string }[] = [
  { id: 'todo', name: 'To Do' },
  { id: 'doing', name: 'Doing' },
  { id: 'in_review', name: 'In Review' },
  { id: 'done', name: 'Done' },
]

interface KanbanBoardProps {
  tasksByStatus: Record<TaskStatus, Task[]> // Changed from tasksByColumn
  onTaskClick?: (taskId: string) => void
  enableDragAndDrop?: boolean
  onDragStart?: (event: DragStartEvent) => void
  onDragOver?: (event: DragOverEvent) => void
  onDragEnd?: (event: DragEndEvent) => void
  insertionPreview?: { status: TaskStatus; position: number } | null // Changed from columnId
  activeTask?: Task | null
  dragOverAddCard?: TaskStatus | null // Changed from string
  showRecurringTasks?: boolean
  projectId?: string | null
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasksByStatus,
  onTaskClick,
  enableDragAndDrop = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  insertionPreview,
  activeTask,
  dragOverAddCard,
  showRecurringTasks = false,
  projectId,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const kanbanContent = (
    <div className='flex h-full overflow-x-auto p-6 gap-6 pb-6'>
      {showRecurringTasks && <RecurringTasksColumn projectId={projectId} />}
      {STATUS_COLUMNS.map(statusColumn => (
        <KanbanColumn
          key={statusColumn.id}
          column={{ id: statusColumn.id, name: statusColumn.name }} // Simplified column object
          tasks={tasksByStatus[statusColumn.id] || []}
          insertionPreview={
            insertionPreview?.status === statusColumn.id ? insertionPreview.position : null
          }
          draggedTaskHeight={activeTask ? 76 : 0}
          draggedTaskId={activeTask?.id || null}
          showAddCardPreview={dragOverAddCard === statusColumn.id}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  )

  if (!enableDragAndDrop) {
    return kanbanContent
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {kanbanContent}
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} isDragOverlay /> : null}</DragOverlay>
    </DndContext>
  )
}
```

#### 5.2 Update KanbanColumn Component

**File**: `packages/web/src/components/tasks/kanban/KanbanColumn/KanbanColumn.tsx`

Update to work with simplified status-based columns (remove column editing features):

```typescript
interface KanbanColumnProps {
  column: { id: string; name: string } // Simplified - just id and name
  tasks: readonly Task[]
  insertionPreview: number | null
  draggedTaskHeight: number
  draggedTaskId: string | null
  showAddCardPreview: boolean
  onTaskClick?: (taskId: string) => void
}

// Remove column rename/reorder features
// Keep task rendering and drag-drop functionality
```

#### 5.3 Update ProjectBoard Container

**File**: `packages/web/src/pages/ProjectBoard.tsx` (or similar)

Update the container to use status-based queries:

```typescript
import { useQuery } from '@livestore/react'
import { getProjectTasksByStatus$ } from '@work-squared/shared/queries'
import type { TaskStatus } from '@work-squared/shared/schema'

// Inside component:
const tasks = useQuery(getProjectTasksByStatus$(projectId))

// Group tasks by status (client-side)
const tasksByStatus: Record<TaskStatus, Task[]> = {
  todo: tasks.filter(t => t.status === 'todo'),
  doing: tasks.filter(t => t.status === 'doing'),
  in_review: tasks.filter(t => t.status === 'in_review'),
  done: tasks.filter(t => t.status === 'done'),
}

// Handle drag and drop with v2 events
const handleDragEnd = (event: DragEndEvent) => {
  // ... determine new status and position ...

  store.commit(
    events.taskStatusChanged({
      taskId: event.active.id,
      toStatus: newStatus,
      position: newPosition,
      updatedAt: new Date(),
      actorId: currentUser?.id,
    })
  )
}
```

#### 5.4 Update TaskForm Component

**File**: `packages/web/src/components/tasks/TaskForm.tsx` (or similar)

Replace column selector with status dropdown:

```typescript
const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'doing', label: 'Doing' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
]

// In form:
<select name="status" value={formData.status} onChange={handleChange}>
  {STATUS_OPTIONS.map(option => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>

// On submit - use v2.TaskCreated event:
store.commit(events.taskCreatedV2({
  id: nanoid(),
  projectId,
  title: formData.title,
  description: formData.description,
  status: formData.status || 'todo',
  assigneeIds: formData.assigneeIds,
  position: calculatePosition(),
  createdAt: new Date(),
  actorId: currentUser?.id,
}))
```

### 6. Server Tools (LLM Integration)

**Files**:

- `packages/server/src/tools/tasks.ts` - Tool implementations
- `packages/server/src/tools/schemas.ts` - Tool schemas for LLM
- `packages/server/src/tools/types.ts` - TypeScript types for tool parameters and results
- `packages/server/src/services/agentic-loop/tool-formatters/task-formatter.ts` - Output formatters

#### 6.1 Update Task Tool Schemas

```typescript
// In schemas.ts
export const createTaskSchema = {
  name: 'create_task',
  description: 'Create a new task with a status (todo, doing, in_review, done)',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID of the project this task belongs to',
      },
      title: {
        type: 'string',
        description: 'Title of the task',
      },
      description: {
        type: 'string',
        description: 'Detailed description of the task',
      },
      status: {
        type: 'string',
        enum: ['todo', 'doing', 'in_review', 'done'],
        description: 'Status of the task (defaults to "todo")',
      },
      assigneeIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of user IDs assigned to this task',
      },
    },
    required: ['projectId', 'title'],
  },
}

export const moveTaskSchema = {
  name: 'move_task_status',
  description: "Change a task's status (move to different column)",
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'ID of the task to move',
      },
      toStatus: {
        type: 'string',
        enum: ['todo', 'doing', 'in_review', 'done'],
        description: 'New status for the task',
      },
    },
    required: ['taskId', 'toStatus'],
  },
}
```

#### 6.2 Update Task Tool Implementation

```typescript
// In tasks.ts
import { events } from '@work-squared/shared/schema'

export const createTask = async (store: Store, input: any) => {
  const taskId = nanoid()
  const position = await calculateNextPosition(store, input.projectId, input.status || 'todo')

  await store.commit(
    events.taskCreatedV2({
      id: taskId,
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      status: input.status || 'todo',
      assigneeIds: input.assigneeIds,
      position,
      createdAt: new Date(),
      actorId: input.actorId,
    })
  )

  return { success: true, taskId, status: input.status || 'todo' }
}

export const moveTaskStatus = async (store: Store, input: any) => {
  const task = await store.query(db => db.table('tasks').where({ id: input.taskId }).first())

  if (!task) {
    throw new Error('Task not found')
  }

  const newPosition = await calculateNextPosition(store, task.projectId, input.toStatus)

  await store.commit(
    events.taskStatusChanged({
      taskId: input.taskId,
      toStatus: input.toStatus,
      position: newPosition,
      updatedAt: new Date(),
      actorId: input.actorId,
    })
  )

  return { success: true, taskId: input.taskId, newStatus: input.toStatus }
}
```

#### 6.3 Update Tool Formatters

**File**: `packages/server/src/services/agentic-loop/tool-formatters/task-formatter.ts`

Update to show status instead of column:

```typescript
export const formatTaskCreated = (result: any) => {
  return `✓ Created task "${result.title}" with status "${result.status}"`
}

export const formatTaskStatusChanged = (result: any) => {
  return `✓ Moved task to "${result.newStatus}" status`
}
```

### 7. Testing

#### 7.1 Unit Tests

Create tests in `packages/shared/src/livestore/__tests__/task-status-migration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { createTestStore } from '../test-utils'
import { events } from '../schema'

describe('Task Status Migration', () => {
  it('v1.TaskCreated should set status to todo', async () => {
    const store = createTestStore()

    await store.commit(
      events.taskCreated({
        id: 'task-1',
        projectId: 'project-1',
        columnId: 'old-column-id',
        title: 'Test Task',
        position: 0,
        createdAt: new Date(),
      })
    )

    const tasks = await store.query(db => db.table('tasks').all())
    expect(tasks[0].status).toBe('todo')
  })

  it('v2.TaskCreated should use provided status', async () => {
    const store = createTestStore()

    await store.commit(
      events.taskCreatedV2({
        id: 'task-1',
        projectId: 'project-1',
        title: 'Test Task',
        status: 'doing',
        position: 0,
        createdAt: new Date(),
      })
    )

    const tasks = await store.query(db => db.table('tasks').all())
    expect(tasks[0].status).toBe('doing')
  })

  it('v2.TaskStatusChanged should update status and position', async () => {
    const store = createTestStore()

    await store.commit(
      events.taskCreatedV2({
        id: 'task-1',
        projectId: 'project-1',
        title: 'Test Task',
        status: 'todo',
        position: 0,
        createdAt: new Date(),
      })
    )

    await store.commit(
      events.taskStatusChanged({
        taskId: 'task-1',
        toStatus: 'done',
        position: 5,
        updatedAt: new Date(),
      })
    )

    const task = await store.query(db => db.table('tasks').where({ id: 'task-1' }).first())
    expect(task.status).toBe('done')
    expect(task.position).toBe(5)
  })

  it('should handle mixed v1 and v2 events', async () => {
    const store = createTestStore()

    // Create with v1
    await store.commit(
      events.taskCreated({
        id: 'task-1',
        projectId: 'project-1',
        columnId: 'old-column',
        title: 'V1 Task',
        position: 0,
        createdAt: new Date(),
      })
    )

    // Create with v2
    await store.commit(
      events.taskCreatedV2({
        id: 'task-2',
        projectId: 'project-1',
        title: 'V2 Task',
        status: 'doing',
        position: 0,
        createdAt: new Date(),
      })
    )

    const tasks = await store.query(db => db.table('tasks').all())
    expect(tasks).toHaveLength(2)
    expect(tasks[0].status).toBe('todo') // v1 defaults to todo
    expect(tasks[1].status).toBe('doing') // v2 uses provided status
  })
})
```

#### 7.2 Query Tests

```typescript
describe('Status-based Queries', () => {
  it('should get tasks by status', async () => {
    const store = createTestStore()

    await store.commit(
      events.taskCreatedV2({
        id: 'task-1',
        projectId: 'project-1',
        title: 'Todo Task',
        status: 'todo',
        position: 0,
        createdAt: new Date(),
      })
    )

    await store.commit(
      events.taskCreatedV2({
        id: 'task-2',
        projectId: 'project-1',
        title: 'Doing Task',
        status: 'doing',
        position: 0,
        createdAt: new Date(),
      })
    )

    const todoTasks = await store.query(getTasksByStatus$('project-1', 'todo'))
    const doingTasks = await store.query(getTasksByStatus$('project-1', 'doing'))

    expect(todoTasks).toHaveLength(1)
    expect(doingTasks).toHaveLength(1)
  })
})
```

#### 7.3 Integration Tests

Test UI components with status-based queries:

- Test KanbanBoard renders 4 status columns
- Test drag and drop between statuses
- Test task creation with status
- Test task status change

#### 7.4 E2E Tests

```typescript
describe('Task Status E2E', () => {
  it('should create task with status and move between statuses', async () => {
    // 1. Create project
    // 2. Create task with status 'todo'
    // 3. Verify task appears in 'To Do' column
    // 4. Drag task to 'Doing' column
    // 5. Verify task moved to 'Doing' status
    // 6. Verify task persists after reload
  })
})
```

### 8. Manual QA Checklist

- [ ] Create a new task (should default to 'todo' status)
- [ ] Create task with specific status (doing, in_review, done)
- [ ] Drag task between status columns
- [ ] Reorder task within same status column
- [ ] Move task to different project (preserves status)
- [ ] Edit task details (status unchanged)
- [ ] Archive and unarchive task
- [ ] Verify old tasks from v1 events appear in kanban (as 'todo')
- [ ] Test with LLM tools (create_task with status, move_task_status)
- [ ] Reload page and verify all changes persist

### 9. Migration Notes

#### Status Mapping Strategy

For v1 events, we default all tasks to `status: 'todo'`. This is the simplest approach.

**Alternative**: If you have known column IDs/names, you could implement:

```typescript
const COLUMN_TO_STATUS_MAP: Record<string, TaskStatus> = {
  'todo-column-id': 'todo',
  'doing-column-id': 'doing',
  'review-column-id': 'in_review',
  'done-column-id': 'done',
}

function mapColumnIdToStatus(columnId: string): TaskStatus {
  return COLUMN_TO_STATUS_MAP[columnId] || 'todo'
}
```

#### Backwards Compatibility

- Old v1 events replay correctly and map to `status: 'todo'`
- `columnId` field remains in table for v1 compatibility
- Column queries still work (will be removed in PR3)

### 10. Definition of Done

- [ ] All schema changes implemented
- [ ] All v2 events defined
- [ ] All v1 materializers updated to set status
- [ ] All v2 materializers implemented
- [ ] Status-based queries added
- [ ] KanbanBoard component updated to use statuses
- [ ] TaskForm updated to use status selector
- [ ] Server tools updated to use v2 events
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Manual QA completed
- [ ] `pnpm lint-all` passes
- [ ] `pnpm test` passes
- [ ] `CI=true pnpm test:e2e` passes
- [ ] Documentation updated (if needed)

## Next Steps

After this PR is merged:

- **PR2**: Add task attributes system with `task_type` field
- **PR3**: Remove columns table completely
