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

// Tool schema builders to reduce duplication
const toolDef = (name: string, description: string, params: any) => ({
  type: 'function',
  function: { name, description, parameters: params },
})

const requiredString = (description: string) => ({
  type: 'string',
  description,
})

const optionalString = (description: string) => ({
  type: 'string',
  description,
})

const optionalNumber = (description: string) => ({
  type: 'number',
  description,
})

const stringArray = (description: string) => ({
  type: 'array',
  items: { type: 'string' },
  description,
})

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

        const { message, conversationHistory, currentBoard, model, workerContext } = requestBody

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

        let systemPrompt = ''

        if (workerContext) {
          // Use worker's custom system prompt
          systemPrompt = `${workerContext.systemPrompt}

WORKER PROFILE:
- Name: ${workerContext.name}
${workerContext.roleDescription ? `- Role: ${workerContext.roleDescription}` : ''}

You have access to tools for:
- Creating and managing tasks (create_task, update_task, move_task, move_task_to_project, archive_task, unarchive_task)
- Viewing tasks (get_task_by_id, get_project_tasks, get_orphaned_tasks)
- Listing all available projects (list_projects)
- Listing all available documents (list_documents)
- Reading a specific document by ID (read_document)
- Searching through document content (search_documents)

When users describe project requirements or ask you to create tasks, use the create_task tool to actually create them in the system. You can create multiple tasks at once if needed.${currentBoardContext}`
        } else {
          // Use default system prompt
          systemPrompt = `You are an AI assistant for Work Squared, a consultancy workflow automation system. You help consultants and project managers by:

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
        }

        // Build messages array with conversation history if provided
        const messages = [{ role: 'system', content: systemPrompt }, ...(conversationHistory || [])]

        // Only add user message if this is not a continuation call
        if (!isContinuation) {
          messages.push({ role: 'user', content: message })
        }

        // Define available tools using schema builders
        const tools = [
          toolDef('create_task', 'Create a new task in the Kanban system', {
            type: 'object',
            properties: {
              title: requiredString('The title/name of the task'),
              description: optionalString('Optional detailed description of the task'),
              boardId: optionalString(
                'ID of the project to create the task on (defaults to first project)'
              ),
              columnId: optionalString(
                'ID of the column to place the task in (defaults to first column)'
              ),
              assigneeId: optionalString('ID of the user to assign the task to'),
            },
            required: ['title'],
          }),

          toolDef('update_task', 'Update an existing task with new information', {
            type: 'object',
            properties: {
              taskId: requiredString('The ID of the task to update'),
              title: optionalString('New title for the task'),
              description: optionalString('New description for the task'),
              assigneeIds: stringArray('Array of user IDs to assign to the task'),
            },
            required: ['taskId'],
          }),

          toolDef('move_task', 'Move a task to a different column within the same project', {
            type: 'object',
            properties: {
              taskId: requiredString('The ID of the task to move'),
              toColumnId: requiredString('The ID of the column to move the task to'),
              position: optionalNumber('Position in the column (defaults to end)'),
            },
            required: ['taskId', 'toColumnId'],
          }),

          toolDef('move_task_to_project', 'Move a task to a different project and column', {
            type: 'object',
            properties: {
              taskId: requiredString('The ID of the task to move'),
              toProjectId: optionalString(
                'The ID of the project to move the task to (optional for orphaning)'
              ),
              toColumnId: requiredString('The ID of the column to move the task to'),
              position: optionalNumber('Position in the column (defaults to end)'),
            },
            required: ['taskId', 'toColumnId'],
          }),

          toolDef('archive_task', 'Archive a task to remove it from active view', {
            type: 'object',
            properties: {
              taskId: requiredString('The ID of the task to archive'),
            },
            required: ['taskId'],
          }),

          toolDef('unarchive_task', 'Unarchive a task to restore it to active view', {
            type: 'object',
            properties: {
              taskId: requiredString('The ID of the task to unarchive'),
            },
            required: ['taskId'],
          }),

          toolDef('get_task_by_id', 'Get detailed information about a specific task', {
            type: 'object',
            properties: {
              taskId: requiredString('The ID of the task to retrieve'),
            },
            required: ['taskId'],
          }),

          toolDef('get_project_tasks', 'Get all tasks for a specific project', {
            type: 'object',
            properties: {
              projectId: requiredString('The ID of the project to get tasks for'),
            },
            required: ['projectId'],
          }),

          toolDef('get_orphaned_tasks', 'Get all tasks that are not assigned to any project', {
            type: 'object',
            properties: {},
            required: [],
          }),

          toolDef(
            'list_projects',
            'Get a list of all available projects with their IDs, names, and descriptions',
            {
              type: 'object',
              properties: {},
              required: [],
            }
          ),
          toolDef(
            'list_documents',
            'Get a list of all available documents with their IDs, titles, and last updated dates',
            {
              type: 'object',
              properties: {},
              required: [],
            }
          ),
          toolDef('read_document', 'Read the full content of a specific document by its ID', {
            type: 'object',
            properties: {
              documentId: requiredString('The ID of the document to read'),
            },
            required: ['documentId'],
          }),
          toolDef(
            'search_documents',
            'Search through document titles and content for a specific query',
            {
              type: 'object',
              properties: {
                query: requiredString('The search query to find in document titles and content'),
              },
              required: ['query'],
            }
          ),
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
