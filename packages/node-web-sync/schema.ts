import { Events, Schema, State, makeSchema } from '@livestore/livestore'

// Single simple event type
export const messageCreated = Events.synced({
  name: 'v1.MessageCreated',
  schema: Schema.Struct({
    id: Schema.String,
    text: Schema.String,
    timestamp: Schema.String,
  }),
})

// Simple table to materialize the event
export const messagesTable = State.SQLite.table({
  name: 'messages',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text(),
    timestamp: State.SQLite.text(),
  },
})

export const events = { messageCreated }
export const tables = { messages: messagesTable }

// Materializer for the event
const materializers = State.SQLite.materializers(events, {
  'v1.MessageCreated': ({ id, text, timestamp }) => {
    return messagesTable.insert({ id, text, timestamp })
  },
})

const state = State.SQLite.makeState({ 
  tables, 
  materializers 
})

export const schema = makeSchema({ events, state })