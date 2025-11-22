import { Events, Schema } from '@livestore/livestore'
import { DEFAULT_ROOM_SCOPE, ROOM_KIND_VALUES } from '../rooms.js'
import { ProjectLifecycleStateSchema } from '../lifecycle.js'

const roomKindSchema = Schema.Literal(...ROOM_KIND_VALUES)
const roomScopeSchema = Schema.Literal(DEFAULT_ROOM_SCOPE)
const workerStatusSchema = Schema.Literal('active', 'inactive', 'archived')

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
    navigationContext: Schema.optional(Schema.String), // JSON string of NavigationContext
    createdAt: Schema.Date,
  }),
})

export const projectCreated = Events.synced({
  name: 'v1.ProjectCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    description: Schema.optional(Schema.String), // Added description field
    lifecycleState: Schema.optional(ProjectLifecycleStateSchema),
    createdAt: Schema.Date,
    actorId: Schema.optional(Schema.String), // Track who created the project
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
    actorId: Schema.optional(Schema.String), // Track who created the task
  }),
})

export const taskMoved = Events.synced({
  name: 'v1.TaskMoved',
  schema: Schema.Struct({
    taskId: Schema.String,
    toColumnId: Schema.String,
    position: Schema.Number,
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String), // Track who moved the task
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
    actorId: Schema.optional(Schema.String), // Track who moved the task
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
    actorId: Schema.optional(Schema.String), // Track who updated the task
  }),
})

export const userCreated = Events.synced({
  name: 'v1.UserCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    avatarUrl: Schema.Union(Schema.String, Schema.Undefined),
    createdAt: Schema.Date,
    actorId: Schema.optional(Schema.String), // Track who created the user (usually system)
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

export const conversationCreatedV2 = Events.synced({
  name: 'v2.ConversationCreated',
  schema: Schema.Struct({
    id: Schema.String,
    title: Schema.String,
    model: Schema.String,
    workerId: Schema.optional(Schema.String),
    roomId: Schema.optional(Schema.String),
    roomKind: Schema.optional(roomKindSchema),
    scope: Schema.optional(roomScopeSchema),
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

export const llmResponseCompleted = Events.synced({
  name: 'v1.LLMResponseCompleted',
  schema: Schema.Struct({
    conversationId: Schema.String,
    userMessageId: Schema.String,
    createdAt: Schema.Date,
    iterations: Schema.Number,
    success: Schema.Boolean,
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
    actorId: Schema.optional(Schema.String), // Track who added the comment
  }),
})

export const taskArchived = Events.synced({
  name: 'v1.TaskArchived',
  schema: Schema.Struct({
    taskId: Schema.String,
    archivedAt: Schema.Date,
    actorId: Schema.optional(Schema.String), // Track who archived the task
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
    actorId: Schema.optional(Schema.String), // Track who created the document
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
    actorId: Schema.optional(Schema.String), // Track who updated the document
  }),
})

export const documentArchived = Events.synced({
  name: 'v1.DocumentArchived',
  schema: Schema.Struct({
    id: Schema.String,
    archivedAt: Schema.Date,
    actorId: Schema.optional(Schema.String), // Track who archived the document
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
    actorId: Schema.optional(Schema.String), // Track who created the worker
  }),
})

export const workerCreatedV2 = Events.synced({
  name: 'v2.WorkerCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    roleDescription: Schema.optional(Schema.String),
    systemPrompt: Schema.String,
    avatar: Schema.optional(Schema.String),
    defaultModel: Schema.String,
    createdAt: Schema.Date,
    roomId: Schema.optional(Schema.String),
    roomKind: Schema.optional(roomKindSchema),
    status: Schema.optional(workerStatusSchema),
    actorId: Schema.optional(Schema.String),
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
    actorId: Schema.optional(Schema.String), // Track who updated the worker
  }),
})

export const workerUpdatedV2 = Events.synced({
  name: 'v2.WorkerUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    updates: Schema.Struct({
      name: Schema.optional(Schema.String),
      roleDescription: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
      systemPrompt: Schema.optional(Schema.String),
      avatar: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
      defaultModel: Schema.optional(Schema.String),
      isActive: Schema.optional(Schema.Boolean),
      roomId: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
      roomKind: Schema.optional(Schema.Union(roomKindSchema, Schema.Null)),
      status: Schema.optional(workerStatusSchema),
    }),
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const workerAssignedToProject = Events.synced({
  name: 'v1.WorkerAssignedToProject',
  schema: Schema.Struct({
    workerId: Schema.String,
    projectId: Schema.String,
    assignedAt: Schema.Date,
    actorId: Schema.optional(Schema.String), // Track who assigned the worker
  }),
})

export const workerUnassignedFromProject = Events.synced({
  name: 'v1.WorkerUnassignedFromProject',
  schema: Schema.Struct({
    workerId: Schema.String,
    projectId: Schema.String,
  }),
})

export const workerAssignedToCategory = Events.synced({
  name: 'v1.WorkerAssignedToCategory',
  schema: Schema.Struct({
    workerId: Schema.String,
    category: Schema.Literal(
      'health',
      'relationships',
      'finances',
      'growth',
      'leisure',
      'spirituality',
      'home',
      'contribution'
    ),
    assignedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const workerUnassignedFromCategory = Events.synced({
  name: 'v1.WorkerUnassignedFromCategory',
  schema: Schema.Struct({
    workerId: Schema.String,
    category: Schema.Literal(
      'health',
      'relationships',
      'finances',
      'growth',
      'leisure',
      'spirituality',
      'home',
      'contribution'
    ),
  }),
})

export const recurringTaskCreated = Events.synced({
  name: 'v1.RecurringTaskCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    description: Schema.Union(Schema.String, Schema.Undefined),
    prompt: Schema.String,
    intervalHours: Schema.Number,
    assigneeIds: Schema.Union(Schema.Array(Schema.String), Schema.Undefined),
    enabled: Schema.Boolean,
    projectId: Schema.Union(Schema.String, Schema.Undefined),
    nextExecutionAt: Schema.Date,
    createdAt: Schema.Date,
    actorId: Schema.optional(Schema.String), // Track who created the recurring task
  }),
})

export const recurringTaskUpdated = Events.synced({
  name: 'v1.RecurringTaskUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    updates: Schema.Struct({
      name: Schema.Union(Schema.String, Schema.Undefined),
      description: Schema.Union(Schema.String, Schema.Null, Schema.Undefined),
      prompt: Schema.Union(Schema.String, Schema.Undefined),
      intervalHours: Schema.Union(Schema.Number, Schema.Undefined),
      assigneeIds: Schema.Union(Schema.Array(Schema.String), Schema.Undefined),
      projectId: Schema.Union(Schema.String, Schema.Null, Schema.Undefined),
    }),
    updatedAt: Schema.Date,
    nextExecutionAt: Schema.Union(Schema.Date, Schema.Undefined),
  }),
})

export const recurringTaskDeleted = Events.synced({
  name: 'v1.RecurringTaskDeleted',
  schema: Schema.Struct({
    id: Schema.String,
    deletedAt: Schema.Date,
  }),
})

export const recurringTaskEnabled = Events.synced({
  name: 'v1.RecurringTaskEnabled',
  schema: Schema.Struct({
    id: Schema.String,
    enabledAt: Schema.Date,
    nextExecutionAt: Schema.Date,
  }),
})

export const recurringTaskDisabled = Events.synced({
  name: 'v1.RecurringTaskDisabled',
  schema: Schema.Struct({
    id: Schema.String,
    disabledAt: Schema.Date,
  }),
})

export const recurringTaskExecute = Events.synced({
  name: 'v1.RecurringTaskExecute',
  schema: Schema.Struct({
    taskId: Schema.String,
    triggeredAt: Schema.Date,
  }),
})

export const taskExecutionStarted = Events.synced({
  name: 'v1.TaskExecutionStarted',
  schema: Schema.Struct({
    id: Schema.String,
    recurringTaskId: Schema.String,
    startedAt: Schema.Date,
  }),
})

export const taskExecutionCompleted = Events.synced({
  name: 'v1.TaskExecutionCompleted',
  schema: Schema.Struct({
    id: Schema.String,
    completedAt: Schema.Date,
    output: Schema.optional(Schema.String),
    createdTaskIds: Schema.optional(Schema.Array(Schema.String)),
    actorId: Schema.optional(Schema.String), // Track who/what completed the execution (usually system)
  }),
})

export const taskExecutionFailed = Events.synced({
  name: 'v1.TaskExecutionFailed',
  schema: Schema.Struct({
    id: Schema.String,
    failedAt: Schema.Date,
    error: Schema.optional(Schema.String),
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
    actorId: Schema.optional(Schema.String), // Track who created the contact
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

// ============================================================================
// V2 TASK EVENTS - Status-based
// ============================================================================

// Task status literal type
const TaskStatusLiteral = Schema.Literal('todo', 'doing', 'in_review', 'done')

// Task priority literal type (PR2)
const TaskPriorityLiteral = Schema.Literal('low', 'normal', 'high', 'critical')

// Task attributes schema (PR2)
const TaskAttributesSchema = Schema.Struct({
  priority: Schema.optional(TaskPriorityLiteral),
  // Future attributes can be added here
})

export const taskCreatedV2 = Events.synced({
  name: 'v2.TaskCreated',
  schema: Schema.Struct({
    id: Schema.String,
    projectId: Schema.optional(Schema.String),
    title: Schema.String,
    description: Schema.Union(Schema.String, Schema.Undefined),
    status: Schema.optional(TaskStatusLiteral),
    assigneeIds: Schema.Union(Schema.Array(Schema.String), Schema.Undefined),
    attributes: Schema.optional(TaskAttributesSchema), // PR2: Optional attributes
    position: Schema.Number,
    createdAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const taskStatusChanged = Events.synced({
  name: 'v2.TaskStatusChanged',
  schema: Schema.Struct({
    taskId: Schema.String,
    toStatus: TaskStatusLiteral,
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

export const taskAttributesUpdated = Events.synced({
  name: 'v2.TaskAttributesUpdated',
  schema: Schema.Struct({
    taskId: Schema.String,
    attributes: TaskAttributesSchema, // Full replacement - caller must merge before emitting
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

// ============================================================================
// V2 PROJECT EVENTS - With Categories & Attributes
// ============================================================================

export const projectCreatedV2 = Events.synced({
  name: 'v2.ProjectCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    description: Schema.optional(Schema.String),
    category: Schema.optional(
      Schema.Literal(
        'health',
        'relationships',
        'finances',
        'growth',
        'leisure',
        'spirituality',
        'home',
        'contribution'
      )
    ),
    lifecycleState: Schema.optional(ProjectLifecycleStateSchema),
    attributes: Schema.optional(
      Schema.Struct({
        // Future: scale, complexity, urgency, etc.
      })
    ),
    createdAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const projectUpdated = Events.synced({
  name: 'v2.ProjectUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    updates: Schema.Struct({
      name: Schema.optional(Schema.String),
      description: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
      category: Schema.optional(
        Schema.Union(
          Schema.Literal(
            'health',
            'relationships',
            'finances',
            'growth',
            'leisure',
            'spirituality',
            'home',
            'contribution'
          ),
          Schema.Null
        )
      ),
    }),
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const projectAttributesUpdated = Events.synced({
  name: 'v2.ProjectAttributesUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    attributes: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const projectArchived = Events.synced({
  name: 'v2.ProjectArchived',
  schema: Schema.Struct({
    id: Schema.String,
    archivedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const projectUnarchived = Events.synced({
  name: 'v2.ProjectUnarchived',
  schema: Schema.Struct({
    id: Schema.String,
    unarchivedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const projectCoverImageSet = Events.synced({
  name: 'v1.ProjectCoverImageSet',
  schema: Schema.Struct({
    projectId: Schema.String,
    coverImageUrl: Schema.String,
    attributes: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })), // Full attributes with coverImage merged
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const projectLifecycleUpdated = Events.synced({
  name: 'v3.ProjectLifecycleUpdated',
  schema: Schema.Struct({
    projectId: Schema.String,
    lifecycleState: ProjectLifecycleStateSchema,
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

// ============================================================================
// TABLE STATE & BRONZE STACK EVENTS (PR2)
// ============================================================================

const BronzeModeLiteral = Schema.Literal('minimal', 'target', 'maximal')
const BronzeStackStatusLiteral = Schema.Literal('active', 'removed')

export const tableConfigurationInitialized = Events.synced({
  name: 'table.configuration_initialized',
  schema: Schema.Struct({
    goldProjectId: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
    silverProjectId: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
    bronzeMode: Schema.optional(BronzeModeLiteral),
    bronzeTargetExtra: Schema.optional(Schema.Number),
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const tableGoldAssigned = Events.synced({
  name: 'table.gold_assigned',
  schema: Schema.Struct({
    projectId: Schema.String,
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const tableGoldCleared = Events.synced({
  name: 'table.gold_cleared',
  schema: Schema.Struct({
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const tableSilverAssigned = Events.synced({
  name: 'table.silver_assigned',
  schema: Schema.Struct({
    projectId: Schema.String,
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const tableSilverCleared = Events.synced({
  name: 'table.silver_cleared',
  schema: Schema.Struct({
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const tableBronzeModeUpdated = Events.synced({
  name: 'table.bronze_mode_updated',
  schema: Schema.Struct({
    bronzeMode: BronzeModeLiteral,
    bronzeTargetExtra: Schema.optional(Schema.Number),
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const bronzeTaskAdded = Events.synced({
  name: 'table.bronze_task_added',
  schema: Schema.Struct({
    id: Schema.String,
    taskId: Schema.String,
    position: Schema.Number,
    insertedAt: Schema.Date,
    insertedBy: Schema.optional(Schema.String),
    status: Schema.optional(BronzeStackStatusLiteral),
    actorId: Schema.optional(Schema.String),
  }),
})

export const bronzeTaskRemoved = Events.synced({
  name: 'table.bronze_task_removed',
  schema: Schema.Struct({
    id: Schema.String,
    removedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const bronzeStackReordered = Events.synced({
  name: 'table.bronze_stack_reordered',
  schema: Schema.Struct({
    ordering: Schema.Array(
      Schema.Struct({
        id: Schema.String,
        position: Schema.Number,
      })
    ),
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})
