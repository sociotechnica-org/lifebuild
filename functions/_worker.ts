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

        const { message, conversationHistory, currentBoard } = requestBody

        // Validate message field
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
          return new Response(
            JSON.stringify({ error: 'Message field is required and must be a non-empty string' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            }
          )
        }

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
          ? `\n\nCURRENT CONTEXT:\nYou are currently viewing the "${currentBoard.name}" board (ID: ${currentBoard.id}). When creating tasks without specifying a board, they will be created on this board by default.`
          : `\n\nCURRENT CONTEXT:\nNo specific board is currently selected. Use the list_boards tool to see available boards, or tasks will be created on the default board.`

        const systemPrompt = `You are an AI assistant for Work Squared, a consultancy workflow automation system. You help consultants and project managers by:

1. **Project Planning**: Breaking down client requirements into actionable tasks
2. **Task Management**: Creating, organizing, and tracking work items in Kanban boards  
3. **Documentation**: Helping create and maintain project documents
4. **Workflow Automation**: Guiding users through consultancy processes from contract closure to iteration zero planning

You have access to tools for:
- Creating tasks in the Kanban system (create_task)
- Listing all available boards (list_boards)

When users describe project requirements or ask you to create tasks, use the create_task tool to actually create them in the system. You can create multiple tasks at once if needed. If you need to know what boards are available, use the list_boards tool first.

Maintain a professional but conversational tone. Focus on practical, actionable advice.${currentBoardContext}`

        // Build messages array with conversation history if provided
        const messages = [
          { role: 'system', content: systemPrompt },
          ...(conversationHistory || []),
          { role: 'user', content: message },
        ]

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
                      'ID of the board to create the task on (optional, defaults to first board)',
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
              name: 'list_boards',
              description: 'Get a list of all available Kanban boards with their IDs and names',
              parameters: {
                type: 'object',
                properties: {},
                required: [],
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
            model: 'gpt-4o',
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
        const choice = data.choices[0]
        const responseMessage = choice?.message

        if (!responseMessage) {
          return new Response(JSON.stringify({ error: 'No response generated' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          })
        }

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
      return worker.fetch(request, env)
    }

    return new Response('Not found', { status: 404 })
  },
}
