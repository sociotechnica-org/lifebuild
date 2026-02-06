import type { Store } from '@livestore/livestore'
import { Type } from '@sinclair/typebox'
import type { ToolDefinition } from '@mariozechner/pi-coding-agent'
import { llmToolSchemas } from '../../tools/schemas.js'
import { executeLLMTool } from '../../tools/index.js'
import { ToolResultFormatterService } from './tool-formatters/formatter-service.js'
import { logger } from '../../utils/logger.js'

interface ToolBuilderOptions {
  store: Store
  workerId?: string
  formatter?: ToolResultFormatterService
}

const buildToolCall = (toolName: string) => ({
  function: {
    name: toolName,
  },
})

export const createPiTools = ({
  store,
  workerId,
  formatter = new ToolResultFormatterService(),
}: ToolBuilderOptions): ToolDefinition[] => {
  return llmToolSchemas.map(schema => {
    const toolName = schema.function.name
    const description = schema.function.description

    return {
      name: toolName,
      label: toolName,
      description,
      parameters: Type.Unsafe(schema.function.parameters),
      execute: async (toolCallId, params, signal, onUpdate, _ctx) => {
        try {
          if (signal?.aborted) {
            return {
              content: [{ type: 'text', text: 'Tool execution aborted.' }],
              details: { formatted: 'Tool execution aborted.', raw: null },
            }
          }

          const toolResult = await executeLLMTool(
            store,
            {
              name: toolName,
              parameters: params,
            },
            workerId
          )

          const formatted = formatter.format(toolResult, buildToolCall(toolName))

          onUpdate?.({
            content: [{ type: 'text', text: formatted }],
            details: { formatted, raw: toolResult },
          })

          return {
            content: [{ type: 'text', text: formatted }],
            details: { formatted, raw: toolResult, toolCallId },
          }
        } catch (error) {
          const formatted = formatter.formatError(error as Error, buildToolCall(toolName))
          logger.error({ err: error, toolName }, 'Pi tool execution error')
          return {
            content: [{ type: 'text', text: formatted }],
            details: { formatted, error: error instanceof Error ? error.message : String(error) },
          }
        }
      },
    }
  })
}
