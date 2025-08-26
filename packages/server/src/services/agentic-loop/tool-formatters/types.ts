export interface ToolResultFormatter {
  canFormat(toolName: string): boolean
  format(toolResult: any, toolCall: any): string
}

export interface ToolMessage {
  role: 'tool'
  content: string
  tool_call_id: string
}

export interface ToolCall {
  id: string
  function: {
    name: string
    arguments: string
  }
}

export interface ToolExecutionResult {
  success: boolean
  result?: any
  error?: string
  toolCall: ToolCall
}
