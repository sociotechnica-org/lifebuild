import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { executeLLMTool } from '../../server/src/tools/index.js'
import { createStore } from './store.js'
import { formatToolResult } from './tool-results.js'
import { mcpToolDefinitions, mcpToolNames } from './tools.js'

const { store } = await createStore()

const server = new Server(
  {
    name: 'lifebuild-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
    instructions:
      'Use these tools to read or mutate Lifebuild projects, tasks, documents, contacts, workers, and sorting table settings.',
  }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: mcpToolDefinitions,
}))

server.setRequestHandler(CallToolRequestSchema, async request => {
  const toolName = request.params.name
  if (!mcpToolNames.has(toolName)) {
    return formatToolResult({ success: false, error: `Unknown tool: ${toolName}` }, true)
  }

  const parameters = request.params.arguments ?? {}

  try {
    const result = await executeLLMTool(store, { name: toolName, parameters })
    return formatToolResult(result, result?.success === false)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return formatToolResult({ success: false, error: message }, true)
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)

async function shutdown() {
  try {
    await store.shutdownPromise()
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
    }
  } finally {
    process.exit(0)
  }
}

process.on('SIGINT', () => {
  void shutdown()
})

process.on('SIGTERM', () => {
  void shutdown()
})
