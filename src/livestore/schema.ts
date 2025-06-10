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
    message: State.SQLite.text({ default: '' }),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
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
  name: 'boards',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ default: '' }),
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
    boardId: State.SQLite.text(),
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

const tasks = State.SQLite.table({
  name: 'tasks',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    boardId: State.SQLite.text(),
    columnId: State.SQLite.text(),
    title: State.SQLite.text({ default: '' }),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
  },
})

const uiState = State.SQLite.clientDocument({
  name: 'uiState',
  schema: Schema.Struct({ newTodoText: Schema.String, filter: Filter }),
  default: {
    id: SessionIdSymbol,
    value: { newTodoText: '', filter: 'all' as Filter },
  },
})

export type Todo = State.SQLite.FromTable.RowDecoded<typeof todos>
export type ChatMessage = State.SQLite.FromTable.RowDecoded<typeof chatMessages>
export type Board = State.SQLite.FromTable.RowDecoded<typeof boards>
export type Column = State.SQLite.FromTable.RowDecoded<typeof columns>
export type Task = State.SQLite.FromTable.RowDecoded<typeof tasks>
export type UiState = typeof uiState.default.value

export const events = {
  ...eventsDefs,
  uiStateSet: uiState.set,
}

export const tables = { todos, uiState, chatMessages, boards, columns, tasks }

const materializers = State.SQLite.materializers(events, {
  'v1.TodoCreated': ({ id, text }) => todos.insert({ id, text, completed: false }),
  'v1.TodoCompleted': ({ id }) => todos.update({ completed: true }).where({ id }),
  'v1.TodoUncompleted': ({ id }) => todos.update({ completed: false }).where({ id }),
  'v1.TodoDeleted': ({ id, deletedAt }) => todos.update({ deletedAt }).where({ id }),
  'v1.TodoClearedCompleted': ({ deletedAt }) =>
    todos.update({ deletedAt }).where({ completed: true }),
  'v1.ChatMessageSent': ({ id, message, createdAt }) =>
    chatMessages.insert({ id, message, createdAt }),
  'v1.BoardCreated': ({ id, name, createdAt }) =>
    boards.insert({ id, name, createdAt, updatedAt: createdAt }),
  'v1.ColumnCreated': ({ id, boardId, name, position, createdAt }) =>
    columns.insert({ id, boardId, name, position, createdAt, updatedAt: createdAt }),
  'v1.ColumnRenamed': ({ id, name, updatedAt }) =>
    columns.update({ name, updatedAt }).where({ id }),
  'v1.ColumnReordered': ({ id, position, updatedAt }) =>
    columns.update({ position, updatedAt }).where({ id }),
  'v1.TaskCreated': ({ id, boardId, columnId, title, createdAt }) =>
    tasks.insert({ id, boardId, columnId, title, createdAt }),
})

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })
