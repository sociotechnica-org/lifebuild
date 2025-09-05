import type { Store } from '@livestore/livestore'
import { executeLLMTool } from '../../tools/index.js'
import { ToolResultFormatterService } from './tool-formatters/formatter-service.js'
import type { ToolCall, ToolExecutionResult } from './types.js'
import type { ToolMessage } from './conversation-history.js'

export interface ToolExecutorOptions {
  onToolStart?: (toolCall: ToolCall) => void
  onToolComplete?: (result: ToolExecutionResult) => void
  onToolError?: (error: Error, toolCall: ToolCall) => void
}

export class ToolExecutor {
  private formatter = new ToolResultFormatterService()
  private workerId?: string

  constructor(
    private store: Store,
    private options: ToolExecutorOptions = {}
  ) {}

  /**
   * Set the worker ID for tool executions
   */
  setWorkerId(workerId?: string) {
    this.workerId = workerId
  }

  /**
   * Execute a single tool call
   */
  async executeTool(toolCall: ToolCall): Promise<ToolExecutionResult> {
    this.options.onToolStart?.(toolCall)

    try {
      console.log(`🔧 Executing tool: ${toolCall.function.name}`)

      const toolArgs = JSON.parse(toolCall.function.arguments)
      const toolResult = await executeLLMTool(
        this.store,
        {
          name: toolCall.function.name,
          parameters: toolArgs,
        },
        this.workerId
      )

      const result: ToolExecutionResult = {
        success: true,
        result: toolResult,
        toolCall,
      }

      this.options.onToolComplete?.(result)
      return result
    } catch (error) {
      console.error('❌ Tool execution error:', error)
      const errorObj = error as Error
      this.options.onToolError?.(errorObj, toolCall)

      return {
        success: false,
        error: errorObj.message,
        toolCall,
      }
    }
  }

  /**
   * Execute multiple tool calls and format results for LLM consumption
   */
  async executeTools(toolCalls: ToolCall[]): Promise<ToolMessage[]> {
    const messages: ToolMessage[] = []

    for (const toolCall of toolCalls) {
      const execution = await this.executeTool(toolCall)

      const content = execution.success
        ? this.formatter.format(execution.result, toolCall)
        : this.formatter.formatError(execution.error || 'Unknown error', toolCall)

      messages.push({
        role: 'tool',
        content,
        tool_call_id: toolCall.id,
      })
    }

    return messages
  }

  /**
   * Execute tools in parallel (when order doesn't matter)
   */
  async executeToolsParallel(toolCalls: ToolCall[]): Promise<ToolMessage[]> {
    const executions = await Promise.all(toolCalls.map(toolCall => this.executeTool(toolCall)))

    return executions.map(execution => {
      const content = execution.success
        ? this.formatter.format(execution.result, execution.toolCall)
        : this.formatter.formatError(execution.error || 'Unknown error', execution.toolCall)

      return {
        role: 'tool',
        content,
        tool_call_id: execution.toolCall.id,
      }
    })
  }
}
