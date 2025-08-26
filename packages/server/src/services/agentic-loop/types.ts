export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface LLMResponse {
  message: string | null
  toolCalls: ToolCall[] | null
}

export interface LLMProvider {
  call(
    messages: any[],
    boardContext?: any,
    model?: string,
    workerContext?: any,
    options?: {
      onRetry?: (attempt: number, maxRetries: number, delayMs: number, error: Error) => void
    }
  ): Promise<LLMResponse>
}

export interface AgenticLoopContext {
  boardContext?: any
  workerContext?: any
  model: string
  maxIterations?: number
}

export interface AgenticLoopEvents {
  onIterationStart?: (iteration: number) => void
  onIterationComplete?: (iteration: number, response: LLMResponse) => void
  onToolsExecuting?: (toolCalls: ToolCall[]) => void
  onToolsComplete?: (results: any[]) => void
  onFinalMessage?: (message: string) => void
  onError?: (error: Error, iteration: number) => void
  onComplete?: (iterations: number) => void
  onRetry?: (attempt: number, maxRetries: number, delayMs: number, error: Error) => void
}

export interface ToolExecutionResult {
  success: boolean
  result?: any
  error?: string
  toolCall: ToolCall
}
