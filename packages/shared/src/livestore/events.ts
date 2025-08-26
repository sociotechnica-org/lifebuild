import { Events, Schema } from '@livestore/livestore'

/**
 * LiveStore embraces event sourcing, so data changes are defined as events
 * (sometimes referred to as "write model"). Those events are then synced across clients
 * and materialize to state (i.e. SQLite tables).
 *
 * Once your app is in production, please make sure your event definitions evolve in a backwards compatible way.
 * It's recommended to version event definitions. Learn more: https://next.livestore.dev/docs/reference/events
 */

export const chatMessageSent = Events.synced({
  name: 'v1.ChatMessageSent',
  schema: Schema.Struct({
    id: Schema.String,
    conversationId: Schema.String,
    message: Schema.String,
    role: Schema.Union(
      Schema.Literal('user'),
      Schema.Literal('assistant'),
      Schema.Literal('system')
    ),
    createdAt: Schema.Date,
  }),
})

export const projectCreated = Events.synced({
  name: 'v1.ProjectCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    description: Schema.optional(Schema.String), // Added description field
    createdAt: Schema.Date,
  }),
})

export const columnCreated = Events.synced({
  name: 'v1.ColumnCreated',
  schema: Schema.Struct({
    id: Schema.String,
    projectId: Schema.optional(Schema.String), // Make optional for orphaned columns
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
    projectId: Schema.optional(Schema.String), // Made optional for orphaned tasks
    columnId: Schema.String,
    title: Schema.String,
    description: Schema.Union(Schema.String, Schema.Undefined),
    assigneeIds: Schema.Union(Schema.Array(Schema.String), Schema.Undefined),
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

export const taskMovedToProject = Events.synced({
  name: 'v1.TaskMovedToProject',
  schema: Schema.Struct({
    taskId: Schema.String,
    toProjectId: Schema.optional(Schema.String), // null for orphaned tasks
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
    assigneeIds: Schema.Union(Schema.Array(Schema.String), Schema.Undefined),
    updatedAt: Schema.Date,
  }),
})

export const userCreated = Events.synced({
  name: 'v1.UserCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    avatarUrl: Schema.Union(Schema.String, Schema.Undefined),
    createdAt: Schema.Date,
  }),
})

export const userSynced = Events.synced({
  name: 'v1.UserSynced',
  schema: Schema.Struct({
    id: Schema.String,
    email: Schema.String,
    name: Schema.String,
    avatarUrl: Schema.optional(Schema.String),
    isAdmin: Schema.optional(Schema.Boolean),
    syncedAt: Schema.Date,
  }),
})

export const conversationCreated = Events.synced({
  name: 'v1.ConversationCreated',
  schema: Schema.Struct({
    id: Schema.String,
    title: Schema.String,
    model: Schema.String,
    workerId: Schema.optional(Schema.String),
    createdAt: Schema.Date,
  }),
})

export const conversationModelUpdated = Events.synced({
  name: 'v1.ConversationModelUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    model: Schema.String,
    updatedAt: Schema.Date,
  }),
})

export const llmResponseReceived = Events.synced({
  name: 'v1.LLMResponseReceived',
  schema: Schema.Struct({
    id: Schema.String,
    conversationId: Schema.String,
    message: Schema.String,
    role: Schema.Literal('assistant'),
    modelId: Schema.String,
    responseToMessageId: Schema.String, // ID of the user message this is responding to
    createdAt: Schema.Date,
    llmMetadata: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  }),
})

export const llmResponseStarted = Events.synced({
  name: 'v1.LLMResponseStarted',
  schema: Schema.Struct({
    conversationId: Schema.String,
    userMessageId: Schema.String,
    createdAt: Schema.Date,
  }),
})

export const commentAdded = Events.synced({
  name: 'v1.CommentAdded',
  schema: Schema.Struct({
    id: Schema.String,
    taskId: Schema.String,
    authorId: Schema.String,
    content: Schema.String,
    createdAt: Schema.Date,
  }),
})

export const taskArchived = Events.synced({
  name: 'v1.TaskArchived',
  schema: Schema.Struct({
    taskId: Schema.String,
    archivedAt: Schema.Date,
  }),
})

export const taskUnarchived = Events.synced({
  name: 'v1.TaskUnarchived',
  schema: Schema.Struct({
    taskId: Schema.String,
  }),
})

export const documentCreated = Events.synced({
  name: 'v1.DocumentCreated',
  schema: Schema.Struct({
    id: Schema.String,
    title: Schema.String,
    content: Schema.String,
    createdAt: Schema.Date,
  }),
})

export const documentUpdated = Events.synced({
  name: 'v1.DocumentUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    updates: Schema.Struct({
      title: Schema.Union(Schema.String, Schema.Undefined),
      content: Schema.Union(Schema.String, Schema.Undefined),
    }),
    updatedAt: Schema.Date,
  }),
})

export const documentArchived = Events.synced({
  name: 'v1.DocumentArchived',
  schema: Schema.Struct({
    id: Schema.String,
    archivedAt: Schema.Date,
  }),
})

export const documentAddedToProject = Events.synced({
  name: 'v1.DocumentAddedToProject',
  schema: Schema.Struct({
    documentId: Schema.String,
    projectId: Schema.String,
  }),
})

export const documentRemovedFromProject = Events.synced({
  name: 'v1.DocumentRemovedFromProject',
  schema: Schema.Struct({
    documentId: Schema.String,
    projectId: Schema.String,
  }),
})

export const workerCreated = Events.synced({
  name: 'v1.WorkerCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    roleDescription: Schema.optional(Schema.String),
    systemPrompt: Schema.String,
    avatar: Schema.optional(Schema.String),
    defaultModel: Schema.String,
    createdAt: Schema.Date,
  }),
})

export const workerUpdated = Events.synced({
  name: 'v1.WorkerUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    updates: Schema.Struct({
      name: Schema.optional(Schema.String),
      roleDescription: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
      systemPrompt: Schema.optional(Schema.String),
      avatar: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
      defaultModel: Schema.optional(Schema.String),
      isActive: Schema.optional(Schema.Boolean),
    }),
    updatedAt: Schema.Date,
  }),
})

export const workerAssignedToProject = Events.synced({
  name: 'v1.WorkerAssignedToProject',
  schema: Schema.Struct({
    workerId: Schema.String,
    projectId: Schema.String,
  }),
})

export const workerUnassignedFromProject = Events.synced({
  name: 'v1.WorkerUnassignedFromProject',
  schema: Schema.Struct({
    workerId: Schema.String,
    projectId: Schema.String,
  }),
})

export const settingUpdated = Events.synced({
  name: 'v1.SettingUpdated',
  schema: Schema.Struct({
    key: Schema.String,
    value: Schema.String,
    updatedAt: Schema.Date,
  }),
})

export const contactCreated = Events.synced({
  name: 'v1.ContactCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    email: Schema.optional(Schema.String),
    createdAt: Schema.Date,
  }),
})

export const contactUpdated = Events.synced({
  name: 'v1.ContactUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    updates: Schema.Struct({
      name: Schema.optional(Schema.String),
      email: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
    }),
    updatedAt: Schema.Date,
  }),
})

export const contactDeleted = Events.synced({
  name: 'v1.ContactDeleted',
  schema: Schema.Struct({
    id: Schema.String,
    deletedAt: Schema.Date,
  }),
})

export const projectContactAdded = Events.synced({
  name: 'v1.ProjectContactAdded',
  schema: Schema.Struct({
    id: Schema.String,
    projectId: Schema.String,
    contactId: Schema.String,
    createdAt: Schema.Date,
  }),
})

export const projectContactRemoved = Events.synced({
  name: 'v1.ProjectContactRemoved',
  schema: Schema.Struct({
    projectId: Schema.String,
    contactId: Schema.String,
  }),
})
