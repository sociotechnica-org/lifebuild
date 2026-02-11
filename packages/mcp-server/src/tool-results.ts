import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export function formatToolResult(result: unknown, isError = false): CallToolResult {
  const structuredContent =
    result && typeof result === 'object' ? (result as Record<string, unknown>) : undefined

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result ?? null, null, 2),
      },
    ],
    structuredContent,
    isError: isError || false,
  }
}
