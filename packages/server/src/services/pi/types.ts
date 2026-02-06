export interface WorkerContext {
  name: string
  systemPrompt: string
  roleDescription?: string
}

/**
 * Navigation context - captures what the user is currently viewing
 */
export interface NavigationContext {
  // Human-readable description of the current view/page
  currentView?: string

  // Current entity being viewed (if any)
  currentEntity?: {
    type: 'project' | 'document' | 'contact' | 'task' | 'category'
    id: string
    // All user-facing attributes of the entity
    attributes: Record<string, unknown>
  }

  // Related entities (e.g., document's parent project)
  relatedEntities?: Array<{
    type: 'project' | 'document' | 'contact' | 'task' | 'category'
    id: string
    relationship: string // e.g., "parent project", "associated contact"
    attributes: Record<string, unknown>
  }>

  // Current subtab within the page (e.g., "documents", "team", "project-creation")
  subtab?: string
}

// Database entity types from shared schema
export interface ChatMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  message: string
  navigationContext?: string // JSON string of NavigationContext
  createdAt: Date
  llmMetadata?: {
    source?: string
    modelId?: string
    toolCalls?: unknown[]
    tool_call_id?: string
    [key: string]: unknown
  }
}

export interface EventBuffer {
  events: ProcessedEvent[]
  lastFlushed: Date
  processing: boolean
}

export interface ProcessedEvent {
  type: string
  storeId: string
  data: unknown
  timestamp: Date
}
