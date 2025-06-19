import { makeSchema, Schema, SessionIdSymbol, State } from '@livestore/livestore'

import { Filter } from '../types.js'
import * as eventsDefs from './events.js'

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
    metadata: State.SQLite.text({
      nullable: true,
      schema: Schema.parseJson(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
    }),
  },
})

const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ default: '' }),
    completed: State.SQLite.boolean({ default: false }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
})

const boards = State.SQLite.table({
  name: 'boards', // Keep original table name for backward compatibility
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
    boardId: State.SQLite.text(), // Keep original field name for backward compatibility
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
    name: State.SQLite.text({ default: '' }),
    avatarUrl: State.SQLite.text({ nullable: true }),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
  },
})

const tasks = State.SQLite.table({
  name: 'tasks',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    boardId: State.SQLite.text({ nullable: true }), // Made optional for orphaned tasks, keep original field name
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

const uiState = State.SQLite.clientDocument({
  name: 'uiState',
  schema: Schema.Struct({
    newTodoText: Schema.String,
    filter: Filter,
  }),
  default: {
    id: SessionIdSymbol,
    value: { newTodoText: '', filter: 'all' as Filter },
  },
})

export type Todo = State.SQLite.FromTable.RowDecoded<typeof todos>
export type ChatMessage = State.SQLite.FromTable.RowDecoded<typeof chatMessages>
export type Board = State.SQLite.FromTable.RowDecoded<typeof boards>
export type Project = Board // New terminology alias
export type Column = State.SQLite.FromTable.RowDecoded<typeof columns>
export type User = State.SQLite.FromTable.RowDecoded<typeof users>
export type Task = State.SQLite.FromTable.RowDecoded<typeof tasks>
export type Conversation = State.SQLite.FromTable.RowDecoded<typeof conversations>
export type Comment = State.SQLite.FromTable.RowDecoded<typeof comments>
export type UiState = typeof uiState.default.value

export const events = {
  ...eventsDefs,
  uiStateSet: uiState.set,
}

export const tables = {
  todos,
  uiState,
  chatMessages,
  boards,
  columns,
  users,
  tasks,
  conversations,
  comments,
}

const materializers = State.SQLite.materializers(events, {
  'v1.TodoCreated': ({ id, text }) => todos.insert({ id, text, completed: false }),
  'v1.TodoCompleted': ({ id }) => todos.update({ completed: true }).where({ id }),
  'v1.TodoUncompleted': ({ id }) => todos.update({ completed: false }).where({ id }),
  'v1.TodoDeleted': ({ id, deletedAt }) => todos.update({ deletedAt }).where({ id }),
  'v1.TodoClearedCompleted': ({ deletedAt }) =>
    todos.update({ deletedAt }).where({ completed: true }),
  'v1.ChatMessageSent': ({ id, conversationId, message, role, createdAt }) =>
    chatMessages.insert({ id, conversationId, message, role, createdAt }),
  'v1.BoardCreated': ({ id, name, description, createdAt }) =>
    boards.insert({ id, name, description, createdAt, updatedAt: createdAt }),
  'v1.ColumnCreated': ({ id, boardId, name, position, createdAt }) =>
    columns.insert({ id, boardId, name, position, createdAt, updatedAt: createdAt }),
  'v1.ColumnRenamed': ({ id, name, updatedAt }) =>
    columns.update({ name, updatedAt }).where({ id }),
  'v1.ColumnReordered': ({ id, position, updatedAt }) =>
    columns.update({ position, updatedAt }).where({ id }),
  'v1.TaskCreated': ({
    id,
    boardId,
    columnId,
    title,
    description,
    assigneeIds,
    position,
    createdAt,
  }) =>
    tasks.insert({
      id,
      boardId,
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
  'v1.TaskUpdated': ({ taskId, title, description, assigneeIds, updatedAt }) => {
    const updates: Record<string, any> = { updatedAt }
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (assigneeIds !== undefined) updates.assigneeIds = JSON.stringify(assigneeIds)
    return tasks.update(updates).where({ id: taskId })
  },
  'v1.UserCreated': ({ id, name, avatarUrl, createdAt }) =>
    users.insert({ id, name, avatarUrl, createdAt }),
  'v1.ConversationCreated': ({ id, title, createdAt }) =>
    conversations.insert({ id, title, createdAt, updatedAt: createdAt }),
  'v1.LLMResponseReceived': ({
    id,
    conversationId,
    message,
    role,
    modelId,
    responseToMessageId,
    createdAt,
    metadata,
  }) =>
    chatMessages.insert({
      id,
      conversationId,
      message,
      role,
      modelId,
      responseToMessageId,
      createdAt,
      metadata,
    }),
  'v1.LLMResponseStarted': () => [],
  'v1.CommentAdded': ({ id, taskId, authorId, content, createdAt }) =>
    comments.insert({ id, taskId, authorId, content, createdAt }),
  'v1.TaskArchived': ({ taskId, archivedAt }) => tasks.update({ archivedAt }).where({ id: taskId }),
  'v1.TaskUnarchived': ({ taskId }) => tasks.update({ archivedAt: null }).where({ id: taskId }),
})

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })
