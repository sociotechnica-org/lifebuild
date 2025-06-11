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

// LLM API credentials loaded from environment

// Custom worker that handles both WebSocket sync and HTTP API endpoints
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url)

    // Handle LLM API proxy
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

        const { message } = requestBody

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

        const systemPrompt = `You are an AI assistant for Work Squared, a consultancy workflow automation system. You help consultants and project managers by:

1. **Project Planning**: Breaking down client requirements into actionable tasks
2. **Task Management**: Creating, organizing, and tracking work items in Kanban boards  
3. **Documentation**: Helping create and maintain project documents
4. **Workflow Automation**: Guiding users through consultancy processes from contract closure to iteration zero planning

You have access to tools for:
- Creating and managing Kanban tasks and boards
- Creating and editing documents
- Tracking project workflows and milestones

Maintain a professional but conversational tone. Focus on practical, actionable advice. When users describe project requirements, break them down into specific, manageable tasks.`

        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
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
        const responseMessage = data.choices[0]?.message?.content || 'No response generated'

        return new Response(JSON.stringify({ message: responseMessage }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
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

    // Handle WebSocket upgrade requests - delegate to makeWorker
    if (request.headers.get('upgrade') === 'websocket') {
      const worker = makeWorker({
        validatePayload: (payload: any) => {
          if (payload?.authToken !== 'insecure-token-change-me') {
            throw new Error('Invalid auth token')
          }
        },
        enableCORS: true,
      })

      return worker.fetch(request, env)
    }

    return new Response('Not found', { status: 404 })
  },
}
