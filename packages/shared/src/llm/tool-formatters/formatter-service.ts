import type { ToolResultFormatter } from './types.js'
import { TaskToolFormatter } from './task-formatter.js'
import { DocumentToolFormatter } from './document-formatter.js'
import { ProjectToolFormatter } from './project-formatter.js'

export class ToolResultFormatterService {
  private formatters: ToolResultFormatter[] = [
    new TaskToolFormatter(),
    new DocumentToolFormatter(),
    new ProjectToolFormatter(),
  ]

  format(toolResult: any, toolCall: any): string {
    // Handle errors first
    if (!toolResult.success) {
      return `Error: ${toolResult.error || 'Unknown error occurred'}`
    }

    // Find appropriate formatter
    const formatter = this.formatters.find(f => f.canFormat(toolCall.function.name))

    if (formatter) {
      return formatter.format(toolResult, toolCall)
    }

    // Default format for unknown tools - return full JSON
    return `Tool executed successfully. Result: ${JSON.stringify(toolResult, null, 2)}`
  }

  /**
   * Format an error that occurred during tool execution
   */
  formatError(error: Error | string, toolCall: any): string {
    const errorMessage = error instanceof Error ? error.message : error
    return `Error executing tool ${toolCall.function.name}: ${errorMessage}`
  }
}
