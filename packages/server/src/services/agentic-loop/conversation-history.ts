import type { ToolCall, LLMMessage, ToolMessage } from './types.js'

// Re-export ToolMessage for convenience
export type { ToolMessage }

// Legacy interface for backward compatibility
export interface Message extends LLMMessage {}

export interface OpenAIMessage {
  role: string
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export class ConversationHistory {
  private messages: LLMMessage[] = []

  constructor(initialMessages: LLMMessage[] = []) {
    this.messages = [...initialMessages]
  }

  /**
   * Add a user message to the history
   */
  addUserMessage(content: string): void {
    this.messages.push({ role: 'user', content })
  }

  /**
   * Add an assistant message (with optional tool calls)
   */
  addAssistantMessage(content: string, toolCalls?: ToolCall[]): void {
    const message: LLMMessage = {
      role: 'assistant',
      content,
    }
    // Only add tool_calls if there are actual tool calls (not empty array)
    if (toolCalls && toolCalls.length > 0) {
      message.tool_calls = toolCalls
    }
    this.messages.push(message)
  }

  /**
   * Add a system message
   */
  addSystemMessage(content: string): void {
    this.messages.push({ role: 'system', content })
  }

  /**
   * Add tool response messages
   */
  addToolMessages(toolMessages: ToolMessage[]): void {
    this.messages.push(...toolMessages)
  }

  /**
   * Get all messages
   */
  getMessages(): LLMMessage[] {
    return [...this.messages]
  }

  /**
   * Get messages in OpenAI API format
   */
  getOpenAIFormat(): OpenAIMessage[] {
    return this.messages.map(msg => this.toOpenAIFormat(msg))
  }

  /**
   * Convert a message to OpenAI format
   */
  private toOpenAIFormat(message: LLMMessage): OpenAIMessage {
    if (message.role === 'assistant' && message.tool_calls) {
      return {
        role: 'assistant',
        content: message.content || null,
        tool_calls: message.tool_calls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        })),
      }
    }

    if (message.role === 'tool') {
      return {
        role: 'tool',
        content: message.content,
        tool_call_id: message.tool_call_id,
      }
    }

    return {
      role: message.role,
      content: message.content,
    }
  }

  /**
   * Get the last N messages
   */
  getLastMessages(n: number): LLMMessage[] {
    return this.messages.slice(-n)
  }

  /**
   * Clear the history
   */
  clear(): void {
    this.messages = []
  }

  /**
   * Get message count
   */
  getMessageCount(): number {
    return this.messages.length
  }

  /**
   * Clone the history
   */
  clone(): ConversationHistory {
    return new ConversationHistory(this.messages)
  }
}
