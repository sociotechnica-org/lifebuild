import { makeDurableObject, makeWorker } from '@livestore/sync-cf/cf-worker'

export class WebSocketServer extends makeDurableObject({
  onPush: async function (message) {
    console.log('Sync server: relaying', message.batch.length, 'events')

    // Just log event types for debugging - no processing
    for (const event of message.batch) {
      console.log(`Syncing event: ${event.name} (${event.args.role || 'no role'})`)
    }
  },
  onPull: async function (message) {
    console.log('onPull', message)
  },
}) {}

// Create worker instance once at module level for efficiency
const worker = makeWorker({
  validatePayload: (payload: any) => {
    if (payload?.authToken !== 'insecure-token-change-me') {
      throw new Error('Invalid auth token')
    }
  },
  enableCORS: true,
})

// LLM API credentials loaded from environment

// Custom worker that handles both WebSocket sync and HTTP API endpoints
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url)

    // Handle LLM API proxy with tool calling support
    if (url.pathname === '/api/llm/chat' && request.method === 'POST') {
      try {
        // Validate environment variables
        if (!env.BRAINTRUST_API_KEY || !env.BRAINTRUST_PROJECT_ID) {
          return new Response(JSON.stringify({ error: 'Missing LLM API configuration' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          })
        }

        let requestBody
        try {
          requestBody = await request.json()
        } catch {
          return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          })
        }

        const { message, conversationHistory, currentBoard, model } = requestBody

        console.log('🔧 Worker received:', {
          message: message?.substring(0, 50),
          hasHistory: !!conversationHistory,
          currentBoard,
          model,
        })

        // Validate message field (allow empty for continuation calls)
        if (message === undefined || message === null || typeof message !== 'string') {
          return new Response(
            JSON.stringify({ error: 'Message field is required and must be a string' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            }
          )
        }

        // Check if this is a continuation call (empty message with conversation history containing tool results)
        const isContinuation =
          message.trim().length === 0 && conversationHistory && conversationHistory.length > 0

        // Check message length limit (10,000 characters)
        if (message.length > 10000) {
          return new Response(
            JSON.stringify({ error: 'Message exceeds maximum length of 10,000 characters' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            }
          )
        }

        const currentBoardContext = currentBoard
          ? `\n\nCURRENT CONTEXT:\nYou are currently viewing the "${currentBoard.name}" project (ID: ${currentBoard.id}). When creating tasks, they will be created on this project automatically. You do NOT need to call list_projects since you already know the current project.`
          : `\n\nCURRENT CONTEXT:\nNo specific project is currently selected. Use the list_projects tool to see available projects, or tasks will be created on the default project.`

        const systemPrompt = `You are an AI assistant for Work Squared, a consultancy workflow automation system. You help consultants and project managers by:

1. **Project Planning**: Breaking down client requirements into actionable tasks
2. **Task Management**: Creating, organizing, and tracking work items in Kanban boards  
3. **Documentation**: Helping create and maintain project documents
4. **Workflow Automation**: Guiding users through consultancy processes from contract closure to iteration zero planning

You have access to tools for:
- Creating tasks in the Kanban system (create_task)
- Listing all available projects (list_projects)
- Listing all available documents (list_documents)
- Reading a specific document by ID (read_document)
- Searching through document content (search_documents)

When users describe project requirements or ask you to create tasks, use the create_task tool to actually create them in the system. You can create multiple tasks at once if needed. If you need to know what projects are available, use the list_projects tool first.

Maintain a professional but conversational tone. Focus on practical, actionable advice.${currentBoardContext}`

        // Build messages array with conversation history if provided
        const messages = [{ role: 'system', content: systemPrompt }, ...(conversationHistory || [])]

        // Only add user message if this is not a continuation call
        if (!isContinuation) {
          messages.push({ role: 'user', content: message })
        }

        // Define available tools
        const tools = [
          {
            type: 'function',
            function: {
              name: 'create_task',
              description: 'Create a new task in the Kanban system',
              parameters: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description: 'The title/name of the task (required)',
                  },
                  description: {
                    type: 'string',
                    description: 'Optional detailed description of the task',
                  },
                  boardId: {
                    type: 'string',
                    description:
                      'ID of the project to create the task on (optional, defaults to first project)',
                  },
                  columnId: {
                    type: 'string',
                    description:
                      'ID of the column to place the task in (optional, defaults to first column)',
                  },
                  assigneeId: {
                    type: 'string',
                    description: 'ID of the user to assign the task to (optional)',
                  },
                },
                required: ['title'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'list_projects',
              description:
                'Get a list of all available projects with their IDs, names, and descriptions',
              parameters: {
                type: 'object',
                properties: {},
                required: [],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'list_documents',
              description:
                'Get a list of all available documents with their IDs, titles, and last updated dates',
              parameters: {
                type: 'object',
                properties: {},
                required: [],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'read_document',
              description: 'Read the full content of a specific document by its ID',
              parameters: {
                type: 'object',
                properties: {
                  documentId: {
                    type: 'string',
                    description: 'The ID of the document to read (required)',
                  },
                },
                required: ['documentId'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'search_documents',
              description: 'Search through document titles and content for a specific query',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description:
                      'The search query to find in document titles and content (required)',
                  },
                },
                required: ['query'],
              },
            },
          },
        ]

        const response = await fetch('https://api.braintrust.dev/v1/proxy/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.BRAINTRUST_API_KEY}`,
            'Content-Type': 'application/json',
            'x-bt-parent': `project_id:${env.BRAINTRUST_PROJECT_ID}`,
          },
          body: JSON.stringify({
            model: model || 'claude-3-5-sonnet-latest',
            messages,
            tools,
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 1000,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          return new Response(
            JSON.stringify({ error: `API call failed: ${response.status} ${errorText}` }),
            {
              status: response.status,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            }
          )
        }

        const data = await response.json()
        console.log('🔧 Braintrust API response:', JSON.stringify(data, null, 2))

        const choice = data.choices[0]
        const responseMessage = choice?.message

        if (!responseMessage) {
          return new Response(JSON.stringify({ error: 'No response generated' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          })
        }

        console.log('🔧 Parsed message:', {
          content: responseMessage.content,
          toolCalls: responseMessage.tool_calls,
          isContinuation,
        })

        // Return the full response including any tool calls
        return new Response(
          JSON.stringify({
            message: responseMessage.content || '',
            toolCalls: responseMessage.tool_calls || [],
          }),
          {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        )
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    // Handle WebSocket upgrade requests - use pre-instantiated worker
    if (request.headers.get('upgrade') === 'websocket') {
      return worker.fetch(request, env, {
        onPush: async function (message) {
          console.log('Sync server: relaying', message.batch.length, 'events')
        },
        onPull: async function (message) {
          console.log('onPull', message)
        },
      })
    }

    // For all other requests, use the ASSETS binding to serve static files
    // This handles both static assets and SPA routing
    return env.ASSETS.fetch(request)
  },
}
