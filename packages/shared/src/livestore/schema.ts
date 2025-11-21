import { makeSchema, Schema, SessionIdSymbol, State } from '@livestore/livestore'
import { DEFAULT_MODEL } from '../models.js'
import {
  createDefaultLifecycleState,
  deriveLifecycleFromAttributes,
  parseProjectLifecycleState,
  ProjectLifecycleStateSchema,
} from '../lifecycle.js'
import type { PlanningAttributes } from '../types.js'
import { Filter } from '../types'
import * as eventsDefs from './events'

/**
 * LiveStore allows you to freely define your app state as SQLite tables (sometimes referred to as "read model")
 * and even supports arbitary schema changes without the need for manual schema migrations.
 *
 * Your app doesn't directly write to those tables, but instead commits events which are then materialized
 * into state (i.e. SQLite tables).
 *
 * LiveStore doesn't sync tables directly, but syncs events instead which are then materialized into the tables
 * resulting in the same state.
 *
 * See docs to learn more: https://next.livestore.dev/docs/reference/state
 */

const chatMessages = State.SQLite.table({
  name: 'chatMessages',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    conversationId: State.SQLite.text(),
    message: State.SQLite.text({ default: '' }),
    role: State.SQLite.text({ default: 'user' }),
    modelId: State.SQLite.text({ nullable: true }),
    responseToMessageId: State.SQLite.text({ nullable: true }), // For assistant responses only
    navigationContext: State.SQLite.text({ nullable: true }), // JSON string of NavigationContext
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    llmMetadata: State.SQLite.text({
      nullable: true,
      schema: Schema.parseJson(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
    }),
  },
})

const projects = State.SQLite.table({
  name: 'projects',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ default: '' }),
    description: State.SQLite.text({ nullable: true }),
    category: State.SQLite.text({ nullable: true }), // PR4: 'health' | 'relationships' | 'finances' | etc.
    attributes: State.SQLite.text({
      // PR4: Flexible attributes for future extensibility (PR5)
      nullable: true,
      schema: Schema.parseJson(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
    }),
    projectLifecycleState: State.SQLite.text({
      nullable: true,
      schema: Schema.parseJson(ProjectLifecycleStateSchema),
    }),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    updatedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
    archivedAt: State.SQLite.integer({
      // PR4: For project archiving (used in PR6)
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
})

// PR3: columns table definition removed - migration to status-based tasks complete
// Kept as comment for reference - columns functionality replaced by task.status field
/*
const columns = State.SQLite.table({
  name: 'columns',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    projectId: State.SQLite.text({ nullable: true }),
    name: State.SQLite.text({ default: '' }),
    position: State.SQLite.integer({ default: 0 }),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    updatedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
  },
})
*/

const users = State.SQLite.table({
  name: 'users',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    email: State.SQLite.text({ nullable: true }),
    name: State.SQLite.text({ default: '' }),
    avatarUrl: State.SQLite.text({ nullable: true }),
    isAdmin: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    syncedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
})

const tasks = State.SQLite.table({
  name: 'tasks',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    projectId: State.SQLite.text({ nullable: true }),
    // PR3: columnId removed - migration to status-based tasks complete
    title: State.SQLite.text({ default: '' }),
    description: State.SQLite.text({ nullable: true }),
    status: State.SQLite.text({ default: 'todo' }), // 'todo' | 'doing' | 'in_review' | 'done'
    assigneeIds: State.SQLite.text({ default: '[]' }), // JSON array of user IDs
    attributes: State.SQLite.text({
      // PR2: Flexible attributes system - stores JSON object with optional priority, etc.
      nullable: true,
      schema: Schema.parseJson(
        Schema.Struct({
          priority: Schema.optional(Schema.Literal('low', 'normal', 'high', 'critical')),
          // Future attributes can be added here
        })
      ),
    }),
    position: State.SQLite.integer({ default: 0 }),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    updatedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    archivedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
})

const conversations = State.SQLite.table({
  name: 'conversations',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    title: State.SQLite.text({ default: '' }),
    model: State.SQLite.text({ default: DEFAULT_MODEL }),
    workerId: State.SQLite.text({ nullable: true }),
    roomId: State.SQLite.text({ nullable: true }),
    roomKind: State.SQLite.text({ nullable: true }),
    scope: State.SQLite.text({ default: 'workspace' }),
    processingState: State.SQLite.text({ default: 'idle' }), // 'idle' | 'processing'
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    updatedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
  },
})

const comments = State.SQLite.table({
  name: 'comments',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    taskId: State.SQLite.text(),
    authorId: State.SQLite.text(),
    content: State.SQLite.text({ default: '' }),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
  },
})

const documents = State.SQLite.table({
  name: 'documents',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    title: State.SQLite.text({ default: '' }),
    content: State.SQLite.text({ default: '' }),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    updatedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    archivedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
})

const documentProjects = State.SQLite.table({
  name: 'documentProjects',
  columns: {
    documentId: State.SQLite.text(),
    projectId: State.SQLite.text(),
  },
})

const workers = State.SQLite.table({
  name: 'workers',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ default: '' }),
    roleDescription: State.SQLite.text({ nullable: true }),
    systemPrompt: State.SQLite.text({ default: '' }),
    avatar: State.SQLite.text({ nullable: true }),
    defaultModel: State.SQLite.text({ default: DEFAULT_MODEL }),
    roomId: State.SQLite.text({ nullable: true }),
    roomKind: State.SQLite.text({ nullable: true }),
    status: State.SQLite.text({ default: 'active' }),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    updatedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
      nullable: true,
    }),
    isActive: State.SQLite.boolean({ default: true }),
  },
})

const workerProjects = State.SQLite.table({
  name: 'workerProjects',
  columns: {
    workerId: State.SQLite.text(),
    projectId: State.SQLite.text(),
  },
})

const workerCategories = State.SQLite.table({
  name: 'workerCategories',
  columns: {
    workerId: State.SQLite.text(),
    category: State.SQLite.text(), // 'health' | 'relationships' | 'finances' | etc.
  },
})

const eventsLog = State.SQLite.table({
  name: 'eventsLog',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    eventType: State.SQLite.text(),
    eventData: State.SQLite.text(), // JSON string of the event data
    actorId: State.SQLite.text({ nullable: true }), // Who performed the action
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
  },
})

const recurringTasks = State.SQLite.table({
  name: 'recurringTasks',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ default: '' }),
    description: State.SQLite.text({ nullable: true }),
    prompt: State.SQLite.text({ default: '' }),
    intervalHours: State.SQLite.integer({ default: 24 }),
    assigneeIds: State.SQLite.text({ default: '[]' }), // JSON array of user IDs
    lastExecutedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
    nextExecutionAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
    enabled: State.SQLite.boolean({ default: true }),
    projectId: State.SQLite.text({ nullable: true }),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    updatedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
  },
})

const settings = State.SQLite.table({
  name: 'settings',
  columns: {
    key: State.SQLite.text({ primaryKey: true }), // e.g., 'instanceName', 'systemPrompt'
    value: State.SQLite.text(),
    updatedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
  },
})

const contacts = State.SQLite.table({
  name: 'contacts',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ default: '' }),
    email: State.SQLite.text({ nullable: true }),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    updatedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
})

const projectContacts = State.SQLite.table({
  name: 'projectContacts',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    projectId: State.SQLite.text(),
    contactId: State.SQLite.text(),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
  },
})

const taskExecutions = State.SQLite.table({
  name: 'taskExecutions',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    recurringTaskId: State.SQLite.text(),
    startedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    completedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
    status: State.SQLite.text({ default: 'pending' }), // 'pending', 'running', 'completed', 'failed'
    output: State.SQLite.text({ nullable: true }),
    createdTaskIds: State.SQLite.text({ default: '[]' }), // JSON array of created task IDs
  },
})

const uiState = State.SQLite.clientDocument({
  name: 'uiState',
  schema: Schema.Struct({
    filter: Filter,
  }),
  default: {
    id: SessionIdSymbol,
    value: { filter: 'all' as Filter },
  },
})

export type ChatMessage = State.SQLite.FromTable.RowDecoded<typeof chatMessages>
export type Project = State.SQLite.FromTable.RowDecoded<typeof projects>
// ProjectCategory type defined in constants.ts
export type Board = Project // Backwards compatibility alias (deprecated)
// Column type removed - PR3: migration to status-based tasks complete
export type User = State.SQLite.FromTable.RowDecoded<typeof users>
export type Task = State.SQLite.FromTable.RowDecoded<typeof tasks>
export type TaskStatus = 'todo' | 'doing' | 'in_review' | 'done'
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical'
export type Conversation = State.SQLite.FromTable.RowDecoded<typeof conversations>
export type Comment = State.SQLite.FromTable.RowDecoded<typeof comments>
export type Document = State.SQLite.FromTable.RowDecoded<typeof documents>
export type DocumentProject = State.SQLite.FromTable.RowDecoded<typeof documentProjects>
export type Worker = State.SQLite.FromTable.RowDecoded<typeof workers>
export type WorkerProject = State.SQLite.FromTable.RowDecoded<typeof workerProjects>
export type WorkerCategory = State.SQLite.FromTable.RowDecoded<typeof workerCategories>
export type RecurringTask = State.SQLite.FromTable.RowDecoded<typeof recurringTasks>
export type EventsLog = State.SQLite.FromTable.RowDecoded<typeof eventsLog>
export type Setting = State.SQLite.FromTable.RowDecoded<typeof settings>
export type Contact = State.SQLite.FromTable.RowDecoded<typeof contacts>
export type ProjectContact = State.SQLite.FromTable.RowDecoded<typeof projectContacts>
export type TaskExecution = State.SQLite.FromTable.RowDecoded<typeof taskExecutions>
export type UiState = typeof uiState.default.value

export const events = {
  ...eventsDefs,
  uiStateSet: uiState.set,
}

export const tables = {
  uiState,
  chatMessages,
  projects,
  // columns removed - PR3: migration to status-based tasks complete
  users,
  tasks,
  conversations,
  comments,
  documents,
  documentProjects,
  workers,
  workerProjects,
  workerCategories,
  recurringTasks,
  eventsLog,
  settings,
  contacts,
  projectContacts,
  taskExecutions,
}

const buildLifecycleState = (lifecycleState: unknown, attributes: unknown, timestamp: Date) => {
  const parsedLifecycle = parseProjectLifecycleState(lifecycleState)
  if (parsedLifecycle) return parsedLifecycle

  return deriveLifecycleFromAttributes(
    (attributes as PlanningAttributes | null | undefined) ?? null,
    createDefaultLifecycleState({ lastEditedAt: timestamp.getTime() }),
    timestamp.getTime()
  )
}

// PR3: Helper function to map v1 columnId to status for backwards compatibility
//
// IMPORTANT LIMITATION: This is a best-effort mapping that works for standard column names
// (e.g., "Todo", "Doing", "In Review", "Done") but will NOT work for opaque column IDs
// (e.g., UUIDs or "${projectId}-col-${position}"). For opaque IDs, all tasks will default
// to 'todo' status, which means historical column state may be lost during event replay.
//
// This trade-off was accepted because:
// 1. The columns table has been removed (PR3), so we can't look up original column names
// 2. v1 events only contain columnId, not column name
// 3. PR1 already migrated existing tasks to status='todo', so this only affects event replay
// 4. Most column IDs in this codebase used semantic names matching DEFAULT_KANBAN_COLUMNS
//
// If exact column preservation is critical for your deployment, consider:
// - Maintaining a hardcoded mapping table of known column IDs → status
// - Storing column metadata separately before migrating to PR3
function mapColumnIdToStatus(columnId: string): 'todo' | 'doing' | 'in_review' | 'done' {
  const columnName = columnId.toLowerCase()

  // Try to match standard column names (case-insensitive)
  if (columnName.includes('doing') || columnName.includes('progress')) return 'doing'
  if (columnName.includes('review')) return 'in_review'
  if (columnName.includes('done') || columnName.includes('complete')) return 'done'

  // Default to 'todo' for unknown/opaque column IDs
  // This is a known limitation - see documentation above
  return 'todo'
}

const materializers = State.SQLite.materializers(events, {
  'v1.ChatMessageSent': ({ id, conversationId, message, role, navigationContext, createdAt }) =>
    chatMessages.insert({ id, conversationId, message, role, navigationContext, createdAt }),
  'v1.ProjectCreated': ({ id, name, description, createdAt, actorId, lifecycleState }) => [
    projects.insert({
      id,
      name,
      description,
      category: null, // PR4: v1 projects have no category
      attributes: null, // PR4: v1 projects have no attributes
      projectLifecycleState: buildLifecycleState(lifecycleState, null, createdAt),
      createdAt,
      updatedAt: createdAt,
    }),
    eventsLog.insert({
      id: `project_created_${id}`,
      eventType: 'v1.ProjectCreated',
      eventData: JSON.stringify({ id, name, description }),
      actorId,
      createdAt,
    }),
  ],
  // PR3: Column materializers converted to no-ops - preserves event history without side effects
  'v1.ColumnCreated': () => [], // No-op - columns no longer exist
  'v1.ColumnRenamed': () => [], // No-op - columns no longer exist
  'v1.ColumnReordered': () => [], // No-op - columns no longer exist
  'v1.TaskCreated': ({
    id,
    projectId,
    columnId, // PR3: Accept columnId and map to appropriate status
    title,
    description,
    assigneeIds,
    position,
    createdAt,
    actorId,
  }) => {
    // Map v1 columnId to status to preserve original column state
    const status = mapColumnIdToStatus(columnId)

    return [
      tasks.insert({
        id,
        projectId,
        // PR3: columnId field removed from tasks table
        title,
        description,
        status, // Map to status
        assigneeIds: assigneeIds ? JSON.stringify(assigneeIds) : undefined,
        attributes: null, // PR2: v1 tasks have no attributes
        position,
        createdAt,
        updatedAt: createdAt,
      }),
      eventsLog.insert({
        id: `task_created_${id}`,
        eventType: 'v1.TaskCreated',
        eventData: JSON.stringify({ id, title, description, projectId, columnId }),
        actorId,
        createdAt,
      }),
    ]
  },
  'v1.TaskMoved': ({ taskId, toColumnId, position, updatedAt, actorId }) => {
    // PR3: Map toColumnId to status to preserve original column state
    const toStatus = mapColumnIdToStatus(toColumnId)

    return [
      tasks.update({ status: toStatus, position, updatedAt }).where({ id: taskId }),
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
    // PR3: Map toColumnId to status to preserve original column state
    const toStatus = mapColumnIdToStatus(toColumnId)

    return [
      tasks
        .update({
          projectId: toProjectId,
          status: toStatus,
          position,
          updatedAt,
        })
        .where({ id: taskId }),
      eventsLog.insert({
        id: `task_moved_to_project_${taskId}_${updatedAt.getTime()}`,
        eventType: 'v1.TaskMovedToProject',
        eventData: JSON.stringify({ taskId, toProjectId, toColumnId, position }),
        actorId,
        createdAt: updatedAt,
      }),
    ]
  },
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
  'v1.UserCreated': ({ id, name, avatarUrl, createdAt, actorId }) => [
    users.insert({ id, name, avatarUrl, createdAt }),
    eventsLog.insert({
      id: `user_created_${id}`,
      eventType: 'v1.UserCreated',
      eventData: JSON.stringify({ id, name }),
      actorId,
      createdAt,
    }),
  ],
  'v1.UserSynced': ({ id, email, name, avatarUrl, isAdmin, syncedAt }) => [
    users.delete().where({ id }),
    users.insert({ id, email, name, avatarUrl, isAdmin, createdAt: syncedAt, syncedAt }),
  ],
  'v1.ConversationCreated': ({ id, title, model, workerId, createdAt }) =>
    conversations.insert({
      id,
      title,
      model,
      workerId,
      scope: 'workspace',
      createdAt,
      updatedAt: createdAt,
    }),
  'v2.ConversationCreated': ({ id, title, model, workerId, roomId, roomKind, scope, createdAt }) =>
    conversations.insert({
      id,
      title,
      model,
      workerId,
      roomId,
      roomKind,
      scope: scope ?? 'workspace',
      createdAt,
      updatedAt: createdAt,
    }),
  'v1.ConversationModelUpdated': ({ id, model, updatedAt }) =>
    conversations.update({ model, updatedAt }).where({ id }),
  'v1.LLMResponseReceived': ({
    id,
    conversationId,
    message,
    role,
    modelId,
    responseToMessageId,
    createdAt,
    llmMetadata,
  }) =>
    chatMessages.insert({
      id,
      conversationId,
      message,
      role,
      modelId,
      responseToMessageId,
      createdAt,
      llmMetadata,
    }),
  'v1.LLMResponseStarted': ({ conversationId }) => [
    conversations.update({ processingState: 'processing' }).where({ id: conversationId }),
  ],
  'v1.LLMResponseCompleted': ({ conversationId }) => [
    conversations.update({ processingState: 'idle' }).where({ id: conversationId }),
  ],
  'v1.CommentAdded': ({ id, taskId, authorId, content, createdAt, actorId }) => [
    comments.insert({ id, taskId, authorId, content, createdAt }),
    eventsLog.insert({
      id: `comment_added_${id}`,
      eventType: 'v1.CommentAdded',
      eventData: JSON.stringify({ id, taskId, authorId, content }),
      actorId,
      createdAt,
    }),
  ],
  'v1.TaskArchived': ({ taskId, archivedAt, actorId }) => [
    tasks.update({ archivedAt }).where({ id: taskId }),
    eventsLog.insert({
      id: `task_archived_${taskId}_${archivedAt.getTime()}`,
      eventType: 'v1.TaskArchived',
      eventData: JSON.stringify({ taskId }),
      actorId,
      createdAt: archivedAt,
    }),
  ],
  'v1.TaskUnarchived': ({ taskId }) => tasks.update({ archivedAt: null }).where({ id: taskId }),
  'v1.DocumentCreated': ({ id, title, content, createdAt, actorId }) => [
    documents.insert({ id, title, content, createdAt, updatedAt: createdAt, archivedAt: null }),
    eventsLog.insert({
      id: `document_created_${id}`,
      eventType: 'v1.DocumentCreated',
      eventData: JSON.stringify({ id, title }),
      actorId,
      createdAt,
    }),
  ],
  'v1.DocumentUpdated': ({ id, updates, updatedAt, actorId }) => {
    const updateData: Record<string, any> = { updatedAt }
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.content !== undefined) updateData.content = updates.content

    return [
      documents.update(updateData).where({ id }),
      eventsLog.insert({
        id: `document_updated_${id}_${updatedAt.getTime()}`,
        eventType: 'v1.DocumentUpdated',
        eventData: JSON.stringify({ id, updates }),
        actorId,
        createdAt: updatedAt,
      }),
    ]
  },
  'v1.DocumentArchived': ({ id, archivedAt, actorId }) => [
    documents.update({ archivedAt }).where({ id }),
    eventsLog.insert({
      id: `document_archived_${id}_${archivedAt.getTime()}`,
      eventType: 'v1.DocumentArchived',
      eventData: JSON.stringify({ id }),
      actorId,
      createdAt: archivedAt,
    }),
  ],
  'v1.DocumentAddedToProject': ({ documentId, projectId }) =>
    documentProjects.insert({ documentId, projectId }),
  'v1.DocumentRemovedFromProject': ({ documentId, projectId }) =>
    documentProjects.delete().where({ documentId, projectId }),
  'v1.WorkerCreated': ({
    id,
    name,
    roleDescription,
    systemPrompt,
    avatar,
    defaultModel,
    createdAt,
    actorId,
  }) => [
    workers.insert({
      id,
      name,
      roleDescription,
      systemPrompt,
      avatar,
      defaultModel,
      status: 'active',
      createdAt,
      updatedAt: createdAt,
      isActive: true,
    }),
    eventsLog.insert({
      id: `worker_created_${id}`,
      eventType: 'v1.WorkerCreated',
      eventData: JSON.stringify({ id, name, roleDescription }),
      actorId,
      createdAt,
    }),
  ],
  'v2.WorkerCreated': ({
    id,
    name,
    roleDescription,
    systemPrompt,
    avatar,
    defaultModel,
    createdAt,
    actorId,
    roomId,
    roomKind,
    status,
  }) => [
    workers.insert({
      id,
      name,
      roleDescription,
      systemPrompt,
      avatar,
      defaultModel,
      roomId,
      roomKind,
      status: status ?? 'active',
      createdAt,
      updatedAt: createdAt,
      isActive: (status ?? 'active') === 'active',
    }),
    eventsLog.insert({
      id: `worker_created_${id}`,
      eventType: 'v2.WorkerCreated',
      eventData: JSON.stringify({ id, name, roleDescription, roomId, roomKind }),
      actorId,
      createdAt,
    }),
  ],
  'v1.WorkerUpdated': ({ id, updates, updatedAt, actorId }) => {
    // Allow null values to clear optional fields, but filter out undefined values
    const processedUpdates: Record<string, any> = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )
    // Always include the updatedAt timestamp
    processedUpdates.updatedAt = updatedAt

    return [
      workers.update(processedUpdates).where({ id }),
      eventsLog.insert({
        id: `worker_updated_${id}_${updatedAt.getTime()}`,
        eventType: 'v1.WorkerUpdated',
        eventData: JSON.stringify({ id, updates }),
        actorId,
        createdAt: updatedAt,
      }),
    ]
  },
  'v2.WorkerUpdated': ({ id, updates, updatedAt, actorId }) => {
    const processedUpdates: Record<string, any> = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )
    processedUpdates.updatedAt = updatedAt
    if (updates.status !== undefined) {
      processedUpdates.isActive = updates.status === 'active'
    }

    return [
      workers.update(processedUpdates).where({ id }),
      eventsLog.insert({
        id: `worker_updated_${id}_${updatedAt.getTime()}`,
        eventType: 'v2.WorkerUpdated',
        eventData: JSON.stringify({ id, updates }),
        actorId,
        createdAt: updatedAt,
      }),
    ]
  },
  'v1.WorkerAssignedToProject': ({ workerId, projectId, assignedAt, actorId }) => [
    workerProjects.insert({ workerId, projectId }),
    eventsLog.insert({
      id: `worker_assigned_${workerId}_${projectId}_${assignedAt.getTime()}`,
      eventType: 'v1.WorkerAssignedToProject',
      eventData: JSON.stringify({ workerId, projectId }),
      actorId,
      createdAt: assignedAt,
    }),
  ],
  'v1.WorkerUnassignedFromProject': ({ workerId, projectId }) =>
    workerProjects.delete().where({ workerId, projectId }),
  'v1.WorkerAssignedToCategory': ({ workerId, category, assignedAt, actorId }) => [
    workerCategories.insert({ workerId, category }),
    eventsLog.insert({
      id: `worker_assigned_category_${workerId}_${category}_${assignedAt.getTime()}`,
      eventType: 'v1.WorkerAssignedToCategory',
      eventData: JSON.stringify({ workerId, category }),
      actorId,
      createdAt: assignedAt,
    }),
  ],
  'v1.WorkerUnassignedFromCategory': ({ workerId, category }) =>
    workerCategories.delete().where({ workerId, category }),
  'v1.RecurringTaskCreated': ({
    id,
    name,
    description,
    prompt,
    intervalHours,
    assigneeIds,
    enabled,
    projectId,
    nextExecutionAt,
    createdAt,
    actorId,
  }) => [
    recurringTasks.insert({
      id,
      name,
      description,
      prompt,
      intervalHours,
      assigneeIds: assigneeIds ? JSON.stringify(assigneeIds) : undefined,
      enabled,
      projectId,
      lastExecutedAt: null,
      nextExecutionAt,
      createdAt,
      updatedAt: createdAt,
    }),
    eventsLog.insert({
      id: `recurring_task_created_${id}`,
      eventType: 'v1.RecurringTaskCreated',
      eventData: JSON.stringify({ id, name, description, intervalHours, projectId }),
      actorId,
      createdAt,
    }),
  ],
  'v1.RecurringTaskUpdated': ({ id, updates, updatedAt, nextExecutionAt }) => {
    const updateData: Record<string, any> = { updatedAt }

    // Only include defined fields in the update
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.prompt !== undefined) updateData.prompt = updates.prompt
    if (updates.intervalHours !== undefined) updateData.intervalHours = updates.intervalHours
    if (updates.assigneeIds !== undefined)
      updateData.assigneeIds = JSON.stringify(updates.assigneeIds)
    if (updates.projectId !== undefined) updateData.projectId = updates.projectId
    if (nextExecutionAt !== undefined) updateData.nextExecutionAt = nextExecutionAt

    return recurringTasks.update(updateData).where({ id })
  },
  'v1.RecurringTaskDeleted': ({ id, deletedAt: _ }) => recurringTasks.delete().where({ id }),
  'v1.RecurringTaskEnabled': ({ id, enabledAt, nextExecutionAt }) =>
    recurringTasks
      .update({
        enabled: true,
        updatedAt: enabledAt,
        nextExecutionAt,
      })
      .where({ id }),
  'v1.RecurringTaskDisabled': ({ id, disabledAt }) =>
    recurringTasks
      .update({
        enabled: false,
        updatedAt: disabledAt,
        nextExecutionAt: null,
      })
      .where({ id }),
  'v1.RecurringTaskExecute': ({ taskId: _, triggeredAt: __ }) => [
    // Manual trigger event - doesn't create execution, just marks the intent
  ],
  'v1.TaskExecutionStarted': ({ id, recurringTaskId, startedAt }) => [
    taskExecutions.insert({
      id,
      recurringTaskId,
      startedAt,
      completedAt: null,
      status: 'running',
      output: null,
      createdTaskIds: '[]',
    }),
    recurringTasks.update({ lastExecutedAt: startedAt }).where({ id: recurringTaskId }),
  ],
  'v1.TaskExecutionCompleted': ({ id, completedAt, output, createdTaskIds, actorId }) => [
    taskExecutions
      .update({
        completedAt,
        status: 'completed',
        output: output || null,
        createdTaskIds: createdTaskIds ? JSON.stringify(createdTaskIds) : '[]',
      })
      .where({ id }),
    eventsLog.insert({
      id: `task_execution_completed_${id}_${completedAt.getTime()}`,
      eventType: 'v1.TaskExecutionCompleted',
      eventData: JSON.stringify({ id, output, createdTaskIds }),
      actorId,
      createdAt: completedAt,
    }),
  ],
  'v1.TaskExecutionFailed': ({ id, failedAt, error }) =>
    taskExecutions
      .update({
        completedAt: failedAt,
        status: 'failed',
        output: error || null,
      })
      .where({ id }),
  'v1.SettingUpdated': ({ key, value, updatedAt }) => [
    settings.delete().where({ key }),
    settings.insert({ key, value, updatedAt }),
  ],
  'v1.ContactCreated': ({ id, name, email, createdAt, actorId }) => [
    contacts.insert({ id, name, email, createdAt, updatedAt: createdAt }),
    eventsLog.insert({
      id: `contact_created_${id}`,
      eventType: 'v1.ContactCreated',
      eventData: JSON.stringify({ id, name, email }),
      actorId,
      createdAt,
    }),
  ],
  'v1.ContactUpdated': ({ id, updates, updatedAt }) => {
    const updateData: Record<string, any> = { updatedAt }
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.email !== undefined) updateData.email = updates.email
    return contacts.update(updateData).where({ id })
  },
  'v1.ContactDeleted': ({ id, deletedAt }) => contacts.update({ deletedAt }).where({ id }),
  'v1.ProjectContactAdded': ({ id, projectId, contactId, createdAt }) =>
    projectContacts.insert({ id, projectId, contactId, createdAt }),
  'v1.ProjectContactRemoved': ({ projectId, contactId }) =>
    projectContacts.delete().where({ projectId, contactId }),

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
    attributes,
    position,
    createdAt,
    actorId,
  }) => [
    tasks.insert({
      id,
      projectId,
      // PR3: columnId field removed from tasks table
      title,
      description,
      status: status || 'todo',
      assigneeIds: assigneeIds ? JSON.stringify(assigneeIds) : '[]',
      attributes: attributes || null, // PR2: Default to null if not provided
      position,
      createdAt,
      updatedAt: createdAt,
    }),
    eventsLog.insert({
      id: `task_created_${id}_${createdAt.getTime()}`,
      eventType: 'v2.TaskCreated',
      eventData: JSON.stringify({ id, title, projectId, status, attributes }),
      actorId,
      createdAt,
    }),
  ],

  'v2.TaskStatusChanged': ({ taskId, toStatus, position, updatedAt, actorId }) => [
    tasks.update({ status: toStatus, position, updatedAt }).where({ id: taskId }),
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
    tasks.update({ projectId: toProjectId, position, updatedAt }).where({ id: taskId }),
    eventsLog.insert({
      id: `task_moved_to_project_${taskId}_${updatedAt.getTime()}`,
      eventType: 'v2.TaskMovedToProject',
      eventData: JSON.stringify({ taskId, toProjectId, position }),
      actorId,
      createdAt: updatedAt,
    }),
  ],

  'v2.TaskAttributesUpdated': ({ taskId, attributes, updatedAt, actorId }) => [
    tasks
      .update({
        // IMPORTANT: This replaces the entire attributes object.
        // To preserve existing attributes, the caller MUST:
        // 1. Read current task.attributes
        // 2. Merge: { ...task.attributes, ...newAttributes }
        // 3. Emit this event with the merged result
        attributes,
        updatedAt,
      })
      .where({ id: taskId }),
    eventsLog.insert({
      id: `task_attributes_updated_${taskId}_${updatedAt.getTime()}`,
      eventType: 'v2.TaskAttributesUpdated',
      eventData: JSON.stringify({ taskId, attributes }),
      actorId,
      createdAt: updatedAt,
    }),
  ],

  // ============================================================================
  // V2 PROJECT MATERIALIZERS - With Categories & Attributes
  // ============================================================================

  'v2.ProjectCreated': ({
    id,
    name,
    description,
    category,
    attributes,
    lifecycleState,
    createdAt,
    actorId,
  }) => [
    projects.insert({
      id,
      name,
      description,
      category: category || null,
      attributes: attributes || null,
      projectLifecycleState: buildLifecycleState(lifecycleState, attributes, createdAt),
      createdAt,
      updatedAt: createdAt,
      archivedAt: null,
    }),
    eventsLog.insert({
      id: `project_created_${id}_${createdAt.getTime()}`,
      eventType: 'v2.ProjectCreated',
      eventData: JSON.stringify({ id, name, description, category }),
      actorId,
      createdAt,
    }),
  ],

  'v2.ProjectUpdated': ({ id, updates, updatedAt, actorId }) => {
    const updateData: Record<string, any> = { updatedAt }
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.category !== undefined) updateData.category = updates.category

    return [
      projects.update(updateData).where({ id }),
      eventsLog.insert({
        id: `project_updated_${id}_${updatedAt.getTime()}`,
        eventType: 'v2.ProjectUpdated',
        eventData: JSON.stringify({ id, updates }),
        actorId,
        createdAt: updatedAt,
      }),
    ]
  },

  'v2.ProjectAttributesUpdated': ({ id, attributes, updatedAt, actorId }) => [
    projects
      .update({
        // Full replacement - caller must merge before emitting
        attributes,
        projectLifecycleState: deriveLifecycleFromAttributes(
          (attributes as PlanningAttributes | null | undefined) ?? null,
          createDefaultLifecycleState({ lastEditedAt: updatedAt.getTime() }),
          updatedAt.getTime()
        ),
        updatedAt,
      })
      .where({ id }),
    eventsLog.insert({
      id: `project_attributes_updated_${id}_${updatedAt.getTime()}`,
      eventType: 'v2.ProjectAttributesUpdated',
      eventData: JSON.stringify({ id, attributes }),
      actorId,
      createdAt: updatedAt,
    }),
  ],

  'v3.ProjectLifecycleUpdated': ({ projectId, lifecycleState, updatedAt, actorId }) => [
    projects
      .update({
        projectLifecycleState: lifecycleState,
        updatedAt,
      })
      .where({ id: projectId }),
    eventsLog.insert({
      id: `project_lifecycle_updated_${projectId}_${updatedAt.getTime()}`,
      eventType: 'v3.ProjectLifecycleUpdated',
      eventData: JSON.stringify({ projectId }),
      actorId,
      createdAt: updatedAt,
    }),
  ],

  'v2.ProjectArchived': ({ id, archivedAt, actorId }) => [
    projects.update({ archivedAt }).where({ id }),
    eventsLog.insert({
      id: `project_archived_${id}_${archivedAt.getTime()}`,
      eventType: 'v2.ProjectArchived',
      eventData: JSON.stringify({ id }),
      actorId,
      createdAt: archivedAt,
    }),
  ],

  'v2.ProjectUnarchived': ({ id, unarchivedAt, actorId }) => [
    projects.update({ archivedAt: null, updatedAt: unarchivedAt }).where({ id }),
    eventsLog.insert({
      id: `project_unarchived_${id}_${unarchivedAt.getTime()}`,
      eventType: 'v2.ProjectUnarchived',
      eventData: JSON.stringify({ id }),
      actorId,
      createdAt: unarchivedAt,
    }),
  ],

  'v1.ProjectCoverImageSet': ({ projectId, attributes, updatedAt }) => {
    // Use the provided attributes (already merged by client)
    // If no attributes provided, create a new object with just coverImage
    return [
      projects
        .update({
          attributes: attributes || {},
          updatedAt,
        })
        .where({ id: projectId }),
    ]
  },
})

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })
export { materializers }
