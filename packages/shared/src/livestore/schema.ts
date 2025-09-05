import { makeSchema, Schema, SessionIdSymbol, State } from '@livestore/livestore'
import { DEFAULT_MODEL } from '../models.js'

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
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    llmMetadata: State.SQLite.text({
      nullable: true,
      schema: Schema.parseJson(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
    }),
  },
})

const boards = State.SQLite.table({
  name: 'projects',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ default: '' }),
    description: State.SQLite.text({ nullable: true }), // Add description field
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
    columnId: State.SQLite.text(),
    title: State.SQLite.text({ default: '' }),
    description: State.SQLite.text({ nullable: true }),
    assigneeIds: State.SQLite.text({ default: '[]' }), // JSON array of user IDs
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
export type Board = State.SQLite.FromTable.RowDecoded<typeof boards>
export type Project = Board // New terminology alias
export type Column = State.SQLite.FromTable.RowDecoded<typeof columns>
export type User = State.SQLite.FromTable.RowDecoded<typeof users>
export type Task = State.SQLite.FromTable.RowDecoded<typeof tasks>
export type Conversation = State.SQLite.FromTable.RowDecoded<typeof conversations>
export type Comment = State.SQLite.FromTable.RowDecoded<typeof comments>
export type Document = State.SQLite.FromTable.RowDecoded<typeof documents>
export type DocumentProject = State.SQLite.FromTable.RowDecoded<typeof documentProjects>
export type Worker = State.SQLite.FromTable.RowDecoded<typeof workers>
export type WorkerProject = State.SQLite.FromTable.RowDecoded<typeof workerProjects>
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
  boards,
  columns,
  users,
  tasks,
  conversations,
  comments,
  documents,
  documentProjects,
  workers,
  workerProjects,
  recurringTasks,
  eventsLog,
  settings,
  contacts,
  projectContacts,
  taskExecutions,
}

const materializers = State.SQLite.materializers(events, {
  'v1.ChatMessageSent': ({ id, conversationId, message, role, createdAt }) =>
    chatMessages.insert({ id, conversationId, message, role, createdAt }),
  'v1.ProjectCreated': ({ id, name, description, createdAt, actorId }) => [
    boards.insert({ id, name, description, createdAt, updatedAt: createdAt }),
    eventsLog.insert({
      id: `project_created_${id}`,
      eventType: 'v1.ProjectCreated',
      eventData: JSON.stringify({ id, name, description }),
      actorId,
      createdAt,
    }),
  ],
  'v1.ColumnCreated': ({ id, projectId, name, position, createdAt }) =>
    columns.insert({ id, projectId, name, position, createdAt, updatedAt: createdAt }),
  'v1.ColumnRenamed': ({ id, name, updatedAt }) =>
    columns.update({ name, updatedAt }).where({ id }),
  'v1.ColumnReordered': ({ id, position, updatedAt }) =>
    columns.update({ position, updatedAt }).where({ id }),
  'v1.TaskCreated': ({
    id,
    projectId,
    columnId,
    title,
    description,
    assigneeIds,
    position,
    createdAt,
  }) =>
    tasks.insert({
      id,
      projectId,
      columnId,
      title,
      description,
      assigneeIds: assigneeIds ? JSON.stringify(assigneeIds) : undefined,
      position,
      createdAt,
      updatedAt: createdAt,
    }),
  'v1.TaskMoved': ({ taskId, toColumnId, position, updatedAt }) =>
    tasks.update({ columnId: toColumnId, position, updatedAt }).where({ id: taskId }),
  'v1.TaskMovedToProject': ({ taskId, toProjectId, toColumnId, position, updatedAt }) =>
    tasks
      .update({ projectId: toProjectId, columnId: toColumnId, position, updatedAt })
      .where({ id: taskId }),
  'v1.TaskUpdated': ({ taskId, title, description, assigneeIds, updatedAt }) => {
    const updates: Record<string, any> = { updatedAt }
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (assigneeIds !== undefined) updates.assigneeIds = JSON.stringify(assigneeIds)
    return tasks.update(updates).where({ id: taskId })
  },
  'v1.UserCreated': ({ id, name, avatarUrl, createdAt }) =>
    users.insert({ id, name, avatarUrl, createdAt }),
  'v1.UserSynced': ({ id, email, name, avatarUrl, isAdmin, syncedAt }) => [
    users.delete().where({ id }),
    users.insert({ id, email, name, avatarUrl, isAdmin, createdAt: syncedAt, syncedAt }),
  ],
  'v1.ConversationCreated': ({ id, title, model, workerId, createdAt }) =>
    conversations.insert({ id, title, model, workerId, createdAt, updatedAt: createdAt }),
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
  'v1.LLMResponseStarted': () => [],
  'v1.LLMResponseCompleted': () => [],
  'v1.CommentAdded': ({ id, taskId, authorId, content, createdAt }) =>
    comments.insert({ id, taskId, authorId, content, createdAt }),
  'v1.TaskArchived': ({ taskId, archivedAt }) => tasks.update({ archivedAt }).where({ id: taskId }),
  'v1.TaskUnarchived': ({ taskId }) => tasks.update({ archivedAt: null }).where({ id: taskId }),
  'v1.DocumentCreated': ({ id, title, content, createdAt }) =>
    documents.insert({ id, title, content, createdAt, updatedAt: createdAt, archivedAt: null }),
  'v1.DocumentUpdated': ({ id, updates, updatedAt }) => {
    const updateData: Record<string, any> = { updatedAt }
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.content !== undefined) updateData.content = updates.content
    return documents.update(updateData).where({ id })
  },
  'v1.DocumentArchived': ({ id, archivedAt }) => documents.update({ archivedAt }).where({ id }),
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
  }) =>
    workers.insert({
      id,
      name,
      roleDescription,
      systemPrompt,
      avatar,
      defaultModel,
      createdAt,
      updatedAt: createdAt,
      isActive: true,
    }),
  'v1.WorkerUpdated': ({ id, updates, updatedAt }) => {
    // Allow null values to clear optional fields, but filter out undefined values
    const processedUpdates: Record<string, any> = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )
    // Always include the updatedAt timestamp
    processedUpdates.updatedAt = updatedAt
    return workers.update(processedUpdates).where({ id })
  },
  'v1.WorkerAssignedToProject': ({ workerId, projectId }) =>
    workerProjects.insert({ workerId, projectId }),
  'v1.WorkerUnassignedFromProject': ({ workerId, projectId }) =>
    workerProjects.delete().where({ workerId, projectId }),
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
  }) =>
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
  'v1.TaskExecutionCompleted': ({ id, completedAt, output, createdTaskIds }) =>
    taskExecutions
      .update({
        completedAt,
        status: 'completed',
        output: output || null,
        createdTaskIds: createdTaskIds ? JSON.stringify(createdTaskIds) : '[]',
      })
      .where({ id }),
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
  'v1.ContactCreated': ({ id, name, email, createdAt }) =>
    contacts.insert({ id, name, email, createdAt, updatedAt: createdAt }),
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
})

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })
export { materializers }
