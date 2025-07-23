import { ProjectCreatedEvent } from './ProjectCreatedEvent.js'
import { TaskCreatedEvent } from './TaskCreatedEvent.js'
import { ConversationCreatedEvent } from './ConversationCreatedEvent.js'
import { DocumentCreatedEvent } from './DocumentCreatedEvent.js'

export const eventComponentRegistry = {
  'v1.ProjectCreated': ProjectCreatedEvent,
  'v1.TaskCreated': TaskCreatedEvent,
  'v1.ConversationCreated': ConversationCreatedEvent,
  'v1.DocumentCreated': DocumentCreatedEvent,
} as const

export type EventType = keyof typeof eventComponentRegistry
