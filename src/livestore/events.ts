import { Events, Schema } from '@livestore/livestore'

/**
 * LiveStore embraces event sourcing, so data changes are defined as events
 * (sometimes referred to as "write model"). Those events are then synced across clients
 * and materialize to state (i.e. SQLite tables).
 *
 * Once your app is in production, please make sure your event definitions evolve in a backwards compatible way.
 * It's recommended to version event definitions. Learn more: https://next.livestore.dev/docs/reference/events
 */

export const todoCreated = Events.synced({
  name: 'v1.TodoCreated',
  schema: Schema.Struct({ id: Schema.String, text: Schema.String }),
})

export const todoCompleted = Events.synced({
  name: 'v1.TodoCompleted',
  schema: Schema.Struct({ id: Schema.String }),
})

export const todoUncompleted = Events.synced({
  name: 'v1.TodoUncompleted',
  schema: Schema.Struct({ id: Schema.String }),
})

export const todoDeleted = Events.synced({
  name: 'v1.TodoDeleted',
  schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Date }),
})

export const todoClearedCompleted = Events.synced({
  name: 'v1.TodoClearedCompleted',
  schema: Schema.Struct({ deletedAt: Schema.Date }),
})

export const chatMessageSent = Events.synced({
  name: 'v1.ChatMessageSent',
  schema: Schema.Struct({
    id: Schema.String,
    message: Schema.String,
    createdAt: Schema.Date,
  }),
})

export const boardCreated = Events.synced({
  name: 'v1.BoardCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    createdAt: Schema.Date,
  }),
})

export const columnCreated = Events.synced({
  name: 'v1.ColumnCreated',
  schema: Schema.Struct({
    id: Schema.String,
    boardId: Schema.String,
    name: Schema.String,
    position: Schema.Number,
    createdAt: Schema.Date,
  }),
})

export const columnRenamed = Events.synced({
  name: 'v1.ColumnRenamed',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    updatedAt: Schema.Date,
  }),
})

export const columnReordered = Events.synced({
  name: 'v1.ColumnReordered',
  schema: Schema.Struct({
    id: Schema.String,
    position: Schema.Number,
    updatedAt: Schema.Date,
  }),
})

export const taskCreated = Events.synced({
  name: 'v1.TaskCreated',
  schema: Schema.Struct({
    id: Schema.String,
    boardId: Schema.String,
    columnId: Schema.String,
    title: Schema.String,
    position: Schema.Number,
    createdAt: Schema.Date,
  }),
})

export const taskMoved = Events.synced({
  name: 'v1.TaskMoved',
  schema: Schema.Struct({
    taskId: Schema.String,
    toColumnId: Schema.String,
    position: Schema.Number,
    updatedAt: Schema.Date,
  }),
})

export const taskUpdated = Events.synced({
  name: 'v1.TaskUpdated',
  schema: Schema.Struct({
    taskId: Schema.String,
    title: Schema.Union(Schema.String, Schema.Undefined),
    description: Schema.Union(Schema.String, Schema.Undefined),
    updatedAt: Schema.Date,
  }),
})

export const conversationCreated = Events.synced({
  name: 'v1.ConversationCreated',
  schema: Schema.Struct({
    id: Schema.String,
    title: Schema.String,
    createdAt: Schema.Date,
  }),
})
