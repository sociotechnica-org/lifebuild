export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export interface LLMResponse {
  message: string | null
  toolCalls: ToolCall[] | null
}

export interface BoardContext {
  id: string
  name: string
}

export interface WorkerContext {
  name: string
  systemPrompt: string
  roleDescription?: string
}

export interface LLMCallOptions {
  onRetry?: (attempt: number, maxRetries: number, delayMs: number, error: Error) => void
}

export interface LLMProvider {
  call(
    messages: LLMMessage[],
    boardContext?: BoardContext,
    model?: string,
    workerContext?: WorkerContext,
    options?: LLMCallOptions
  ): Promise<LLMResponse>
}

export interface AgenticLoopContext {
  boardContext?: BoardContext
  workerContext?: WorkerContext
  workerId?: string
  model: string
  maxIterations?: number
}

export interface ToolMessage {
  role: 'tool'
  content: string
  tool_call_id?: string
}

export interface AgenticLoopEvents {
  onIterationStart?: (iteration: number) => void
  onIterationComplete?: (iteration: number, response: LLMResponse) => void
  onToolsExecuting?: (toolCalls: ToolCall[]) => void
  onToolsComplete?: (results: ToolMessage[]) => void
  onFinalMessage?: (message: string) => void
  onError?: (error: Error, iteration: number) => void
  onComplete?: (iterations: number) => void
  onRetry?: (attempt: number, maxRetries: number, delayMs: number, error: Error) => void
}

export interface ToolExecutionResult {
  success: boolean
  result?: unknown
  error?: string
  toolCall: ToolCall
}

// Database entity types from shared schema
export interface ChatMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  message: string
  createdAt: Date
  llmMetadata?: {
    source?: string
    modelId?: string
    toolCalls?: ToolCall[]
    tool_call_id?: string
    [key: string]: unknown
  }
}

export interface Conversation {
  id: string
  name?: string
  workerId?: string
  model?: string
  createdAt: Date
  updatedAt: Date
}

export interface Worker {
  id: string
  name: string
  systemPrompt: string
  roleDescription?: string
  createdAt: Date
  updatedAt: Date
}

// Event processing types
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

// Type guards for runtime type checking
export function isLLMMessage(obj: unknown): obj is LLMMessage {
  if (typeof obj !== 'object' || obj === null) return false
  const message = obj as Record<string, unknown>

  return (
    typeof message.role === 'string' &&
    ['system', 'user', 'assistant', 'tool'].includes(message.role) &&
    (typeof message.content === 'string' || message.content === null)
  )
}

export function isBoardContext(obj: unknown): obj is BoardContext {
  if (typeof obj !== 'object' || obj === null) return false
  const context = obj as Record<string, unknown>

  return typeof context.id === 'string' && typeof context.name === 'string'
}

export function isWorkerContext(obj: unknown): obj is WorkerContext {
  if (typeof obj !== 'object' || obj === null) return false
  const context = obj as Record<string, unknown>

  return typeof context.name === 'string' && typeof context.systemPrompt === 'string'
}
