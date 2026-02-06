import { llmToolSchemas } from '../../server/src/tools/schemas.js'

export interface McpToolDefinition {
  name: string
  title?: string
  description?: string
  inputSchema: {
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
    [key: string]: unknown
  }
}

const normalizedSchemas = llmToolSchemas as Array<{
  function: {
    name: string
    description?: string
    parameters: McpToolDefinition['inputSchema']
  }
}>

export const mcpToolDefinitions: McpToolDefinition[] = normalizedSchemas.map(tool => ({
  name: tool.function.name,
  title: tool.function.name,
  description: tool.function.description,
  inputSchema: tool.function.parameters,
}))

export const mcpToolNames = new Set(mcpToolDefinitions.map(tool => tool.name))
