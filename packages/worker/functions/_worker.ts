import { makeDurableObject, makeWorker } from '@livestore/sync-cf/cf-worker'
import { verifyJWT, isWithinGracePeriod, DEFAULT_GRACE_PERIOD_SECONDS, DEV_AUTH, ENV_VARS, AuthErrorCode } from '@work-squared/shared/auth'

export class WebSocketServer extends makeDurableObject({
  onPush: async function (message) {
    console.log('Sync server: relaying', message.batch.length, 'events')

    // LiveStore doesn't provide connection context in onPush
    // Events should already have metadata from the client
    // We'll validate metadata exists and log for monitoring
    for (const event of message.batch) {
      if (!event.args.metadata) {
        console.warn(`Event ${event.name} missing metadata - this should not happen in production`)
      } else {
        console.log(`Syncing event ${event.name} from user ${event.args.metadata.userId}`)
      }
    }
  },
  onPull: async function (message) {
    console.log('onPull', message)
  },
}) {}

/**
 * Validate sync payload and authenticate user
 */
async function validateSyncPayload(payload: any, env: any): Promise<{ userId: string; isGracePeriod?: boolean }> {
  const requireAuth = env[ENV_VARS.REQUIRE_AUTH] === 'true' || env[ENV_VARS.ENVIRONMENT] === 'production'
  
  // Development mode - allow unauthenticated access
  if (!requireAuth) {
    console.log('Auth disabled in development mode')
    return { userId: DEV_AUTH.DEFAULT_USER_ID }
  }

  // Check for auth token
  const authToken = payload?.authToken
  if (!authToken) {
    throw new Error(`${AuthErrorCode.TOKEN_MISSING}: Authentication required`)
  }

  // Handle legacy insecure token during transition
  if (authToken === DEV_AUTH.INSECURE_TOKEN) {
    if (env[ENV_VARS.ENVIRONMENT] === 'development') {
      console.log('Using legacy insecure token in development')
      return { userId: DEV_AUTH.DEFAULT_USER_ID }
    } else {
      throw new Error(`${AuthErrorCode.TOKEN_INVALID}: Legacy token not allowed in production`)
    }
  }

  // Verify JWT
  const jwtSecret = env[ENV_VARS.JWT_SECRET]
  if (!jwtSecret) {
    throw new Error(`${AuthErrorCode.AUTH_SERVICE_ERROR}: JWT secret not configured`)
  }

  const payload_decoded = await verifyJWT(authToken, jwtSecret)
  if (!payload_decoded) {
    throw new Error(`${AuthErrorCode.TOKEN_INVALID}: Invalid JWT token`)
  }

  // Check expiration with grace period
  const gracePeriodSeconds = parseInt(env[ENV_VARS.GRACE_PERIOD_SECONDS] || DEFAULT_GRACE_PERIOD_SECONDS.toString())
  
  if (!isWithinGracePeriod(payload_decoded, gracePeriodSeconds)) {
    throw new Error(`${AuthErrorCode.GRACE_PERIOD_EXPIRED}: Token expired beyond grace period`)
  }

  const isGracePeriod = payload_decoded.exp < Math.floor(Date.now() / 1000)
  if (isGracePeriod) {
    console.log(`User ${payload_decoded.userId} authenticated with expired token within grace period`)
  }

  return { 
    userId: payload_decoded.userId,
    isGracePeriod 
  }
}

// Create worker instance once at module level for efficiency  
const worker = makeWorker({
  validatePayload: async (payload: any) => {
    // Validate the sync payload and authenticate the user
    // This runs in the Worker context, not the Durable Object
    // We can only accept/reject the connection here
    console.log('Validating sync payload:', Object.keys(payload || {}))
    
    // Basic validation - ensure payload exists and has instanceId
    if (!payload || !payload.instanceId) {
      throw new Error('Invalid sync payload: missing instanceId')
    }
    
    // Log auth token if present (for debugging)
    if (payload.authToken) {
      console.log('Auth token provided:', payload.authToken.substring(0, 20) + '...')
    } else {
      console.log('No auth token provided - allowing for development')
    }
    
    // For now, allow all connections
    // TODO: Implement proper auth validation once we understand LiveStore env access
  },
  enableCORS: true,
})

// LLM API credentials loaded from environment

// Import centralized tool schemas
import { llmToolSchemas } from '@work-squared/shared/llm-tools/schemas'

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
- Managing projects (list_projects, get_project_details)
- Creating and managing documents (create_document, update_document, archive_document)
- Managing document-project associations (add_document_to_project, remove_document_from_project)
- Viewing documents (list_documents, read_document, get_project_documents)
- Searching through document content (search_documents, search_project_documents)

When users describe project requirements or ask you to create tasks, use the create_task tool to actually create them in the system. You can create multiple tasks at once if needed.${currentBoardContext}`
        } else {
          // Use default system prompt
          systemPrompt = `You are an AI assistant for Work Squared, a consultancy workflow automation system. You help consultants and project managers by:

1. **Project Planning**: Breaking down client requirements into actionable tasks
2. **Task Management**: Creating, organizing, and tracking work items in Kanban boards  
3. **Documentation**: Helping create and maintain project documents
4. **Workflow Automation**: Guiding users through consultancy processes from contract closure to iteration zero planning

You have access to tools for:
- Creating and managing tasks (create_task, update_task, move_task, move_task_to_project, archive_task, unarchive_task)
- Viewing tasks (get_task_by_id, get_project_tasks, get_orphaned_tasks)
- Managing projects (list_projects, get_project_details)
- Creating and managing documents (create_document, update_document, archive_document)
- Managing document-project associations (add_document_to_project, remove_document_from_project)
- Viewing documents (list_documents, read_document, get_project_documents)
- Searching through document content (search_documents, search_project_documents)

When users describe project requirements or ask you to create tasks, use the create_task tool to actually create them in the system. You can create multiple tasks at once if needed. If you need to know what projects are available, use the list_projects tool first.

Maintain a professional but conversational tone. Focus on practical, actionable advice.${currentBoardContext}`
        }

        // Build messages array with conversation history if provided
        const messages = [{ role: 'system', content: systemPrompt }, ...(conversationHistory || [])]

        // Only add user message if this is not a continuation call
        if (!isContinuation) {
          messages.push({ role: 'user', content: message })
        }

        // Use centralized tool schemas
        const tools = llmToolSchemas

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
        return new Response(JSON.stringify({ error: (error as Error).message }), {
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
        onPush: async function (message: any) {
          console.log('Sync server: relaying', message.batch.length, 'events')
        },
        onPull: async function (message: any) {
          console.log('onPull', message)
        },
      })
    }

    // For all other requests, use the ASSETS binding to serve static files
    // This handles both static assets and SPA routing
    return env.ASSETS.fetch(request)
  },
}
