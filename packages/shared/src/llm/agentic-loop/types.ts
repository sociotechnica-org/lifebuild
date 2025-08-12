import type { ToolCall } from '../tool-formatters/types.js'

export interface LLMResponse {
  message: string | null
  toolCalls: ToolCall[] | null
}

export interface LLMProvider {
  call(
    messages: any[],
    boardContext?: any,
    model?: string,
    workerContext?: any
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
}