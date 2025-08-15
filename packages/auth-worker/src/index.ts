import { UserStore } from './durable-objects/UserStore.js'
import { handleSignup, handleLogin, handleRefresh, handleLogout } from './handlers/auth.js'
import { verifyAdminAccess } from './utils/adminAuth.js'

/**
 * Handle admin list users request
 */
async function handleAdminListUsers(request: Request, env: Env): Promise<Response> {
  try {
    // Verify admin access
    const adminCheck = await verifyAdminAccess(request, env)
    if (!adminCheck.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: adminCheck.error || 'Admin access denied' },
        }),
        {
          status: adminCheck.statusCode || 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Get UserStore Durable Object (same instance as auth handlers)
    const userStoreId = env.USER_STORE.idFromName('user-store')
    const userStore = env.USER_STORE.get(userStoreId)

    // Forward request to UserStore
    const userStoreRequest = new Request(
      `${request.url.replace('/admin/users', '/list-all-users')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }
    )

    return await userStore.fetch(userStoreRequest)
  } catch (error) {
    console.error('Admin list users error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: 'Failed to list users' },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * CORS headers for cross-origin requests
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, restrict to your domain
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response)
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value)
  })
  return newResponse
}

/**
 * Handle CORS preflight requests
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

/**
 * Create error response
 */
function createErrorResponse(message: string, status = 400): Response {
  return addCorsHeaders(
    new Response(
      JSON.stringify({
        success: false,
        error: { message },
      }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  )
}

/**
 * Rate limiting using simple in-memory store
 * In production, you'd want to use Durable Objects for distributed rate limiting
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(clientIP: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const key = clientIP
  const window = rateLimitStore.get(key)

  if (!window || now > window.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (window.count >= maxRequests) {
    return false
  }

  window.count++
  return true
}

/**
 * Main Worker fetch handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
      return handleOptions()
    }

    // Rate limiting for auth endpoints (skip in development)
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
    if (env.ENVIRONMENT !== 'development' && !checkRateLimit(clientIP)) {
      return createErrorResponse('Too many requests', 429)
    }

    try {
      // Route auth endpoints
      switch (path) {
        case '/signup':
          if (method !== 'POST') {
            return createErrorResponse('Method not allowed', 405)
          }
          return addCorsHeaders(await handleSignup(request, env))

        case '/login':
          if (method !== 'POST') {
            return createErrorResponse('Method not allowed', 405)
          }
          return addCorsHeaders(await handleLogin(request, env))

        case '/refresh':
          if (method !== 'POST') {
            return createErrorResponse('Method not allowed', 405)
          }
          return addCorsHeaders(await handleRefresh(request, env))

        case '/logout':
          if (method !== 'POST') {
            return createErrorResponse('Method not allowed', 405)
          }
          return addCorsHeaders(await handleLogout(request, env))

        case '/health':
          return addCorsHeaders(
            new Response(
              JSON.stringify({
                status: 'healthy',
                timestamp: new Date().toISOString(),
              }),
              {
                headers: { 'Content-Type': 'application/json' },
              }
            )
          )

        case '/admin/users':
          if (method !== 'GET') {
            return createErrorResponse('Method not allowed', 405)
          }
          return addCorsHeaders(await handleAdminListUsers(request, env))

        default:
          return createErrorResponse('Not found', 404)
      }
    } catch (error) {
      console.error('Worker error:', error)
      return createErrorResponse('Internal server error', 500)
    }
  },
}

// Export Durable Object classes
export { UserStore }

// Environment interface
interface Env {
  JWT_SECRET?: string
  USER_STORE: any
  ENVIRONMENT?: string
  BOOTSTRAP_ADMIN_EMAIL?: string
}
