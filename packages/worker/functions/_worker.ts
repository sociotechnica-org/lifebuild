import { makeDurableObject, makeWorker } from '@livestore/sync-cf/cf-worker'
import { verifyJWT, isWithinGracePeriod, DEFAULT_GRACE_PERIOD_SECONDS, DEV_AUTH, ENV_VARS, AuthErrorCode } from '@work-squared/shared/auth'
import { DEFAULT_MODEL } from '@work-squared/shared/llm/models'

export class WebSocketServer extends makeDurableObject({
  onPush: async function (message) {
    console.log('Sync server: relaying', message.batch.length, 'events')
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

  // Server bypass - allow internal server connections without JWT
  if (payload?.serverBypass === env[ENV_VARS.SERVER_BYPASS_TOKEN]) {
    console.log('Server bypass authenticated')
    return { userId: 'server-internal' }
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

// Create worker instance that captures env in closure
function createWorkerWithAuth(env: any) {
  const requireAuth = env[ENV_VARS.REQUIRE_AUTH] === 'true' || env[ENV_VARS.ENVIRONMENT] === 'production'
  
  // If auth is disabled, accept both dev tokens and JWT tokens for development
  if (!requireAuth) {
    console.log('Auth disabled - accepting both dev tokens and JWT tokens for development')
    return makeWorker({
      validatePayload: async (payload: any) => {
        // Accept the insecure dev token
        if (payload?.authToken === DEV_AUTH.INSECURE_TOKEN) {
          return
        }
        
        // Also try to validate as JWT for logged-in users
        try {
          const result = await validateSyncPayload(payload, env)
          // If JWT validation succeeds, allow it
          return
        } catch (error) {
          // If both dev token and JWT validation fail, reject
          throw new Error('Invalid auth token')
        }
      },
      enableCORS: true,
    })
  }
  
  // Auth is enabled - use full JWT validation
  return makeWorker({
    validatePayload: async (payload: any) => {
      console.log('Validating sync payload:', Object.keys(payload || {}))
      
      try {
        const authResult = await validateSyncPayload(payload, env)
        console.log(`Authentication successful for user: ${authResult.userId}`)
        if (authResult.isGracePeriod) {
          console.log('User authenticated within grace period')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Authentication failed:', errorMessage)
        throw error // This will reject the WebSocket connection
      }
    },
    enableCORS: true,
  })
}

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

        const { message, conversationHistory, currentBoard, model, workerContext, globalSystemPrompt } = requestBody

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
          // Use global system prompt if provided, otherwise fall back to default
          const baseSystemPrompt = globalSystemPrompt || `You are an AI assistant for Work Squared, a powerful consultancy workflow management platform. You excel at helping consultants, project managers, and teams by:

**Core Capabilities:**
• **Project Planning & Strategy**: Breaking down complex client requirements into actionable roadmaps
• **Task & Workflow Management**: Creating, organizing, and tracking work using Kanban methodology
• **Document Management**: Creating, editing, and maintaining project documentation
• **Process Optimization**: Streamlining consultancy workflows from contract to delivery

**Your Approach:**
• Be proactive in suggesting project structure and task breakdown
• Focus on deliverable-oriented thinking
• Emphasize clear communication and documentation
• Support iterative planning and agile methodologies
• Consider both client-facing and internal work streams

**Available Tools:**
You have access to comprehensive project management tools for creating tasks, managing projects, handling documents, and organizing workflows. Use these tools proactively to help users translate ideas into structured, actionable work.

Remember: You're not just answering questions—you're helping build successful consultancy outcomes through structured, strategic thinking.`

          systemPrompt = `${baseSystemPrompt}

You have access to tools for:
- Creating and managing tasks (create_task, update_task, move_task, move_task_to_project, archive_task, unarchive_task)
- Viewing tasks (get_task_by_id, get_project_tasks, get_orphaned_tasks)
- Managing projects (list_projects, get_project_details)
- Creating and managing documents (create_document, update_document, archive_document)
- Managing document-project associations (add_document_to_project, remove_document_from_project)
- Viewing documents (list_documents, read_document, get_project_documents)
- Searching through document content (search_documents, search_project_documents)

When users describe project requirements or ask you to create tasks, use the create_task tool to actually create them in the system. You can create multiple tasks at once if needed. If you need to know what projects are available, use the list_projects tool first.${currentBoardContext}`
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
            model: model || DEFAULT_MODEL,
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

    // Handle WebSocket upgrade requests - create worker with auth
    if (request.headers.get('upgrade') === 'websocket') {
      const worker = createWorkerWithAuth(env)
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
