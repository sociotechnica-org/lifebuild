import { describe, expect, it } from 'vitest'
import { llmToolSchemas } from '../../server/src/tools/schemas.js'
import { formatToolResult } from '../src/tool-results.js'
import { mcpToolDefinitions, mcpToolNames } from '../src/tools.js'

describe('mcp tool mapping', () => {
  it('mirrors all LLM tool schemas', () => {
    expect(mcpToolDefinitions).toHaveLength(llmToolSchemas.length)

    const expectedNames = llmToolSchemas.map(tool => tool.function.name)
    expect(mcpToolDefinitions.map(tool => tool.name)).toEqual(expectedNames)
  })

  it('includes tool name lookup', () => {
    expect(mcpToolNames.has('list_projects')).toBe(true)
  })
})

describe('formatToolResult', () => {
  it('formats structured content when given an object', () => {
    const result = formatToolResult({ success: true })
    expect(result.structuredContent).toEqual({ success: true })
  })

  it('marks errors when requested', () => {
    const result = formatToolResult({ success: false }, true)
    expect(result.isError).toBe(true)
  })
})
