import { UserStore } from './durable-objects/UserStore.js'
import { handleSignup, handleLogin, handleRefresh, handleLogout } from './handlers/auth.js'
import { verifyAdminAccess } from './utils/adminAuth.js'

/**
 * Handle admin list users request
 */
async function handleAdminListUsers(request: Request, env: Env): Promise<Response> {
  try {
    // Verify admin access
    const adminError = await verifyAdminAccessOrReturnError(request, env)
    if (adminError) return adminError

    // Forward request to UserStore
    const userStore = getUserStore(env)
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
    return createAdminErrorResponse('Failed to list users')
  }
}

/**
 * Create standardized error response
 */
function createAdminErrorResponse(message: string, status = 500): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: { message },
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * Verify admin access and return error response if invalid
 */
async function verifyAdminAccessOrReturnError(
  request: Request,
  env: Env
): Promise<Response | null> {
  const adminCheck = await verifyAdminAccess(request, env)
  if (!adminCheck.valid) {
    return createAdminErrorResponse(
      adminCheck.error || 'Admin access denied',
      adminCheck.statusCode || 403
    )
  }
  return null
}

/**
 * Get UserStore instance
 */
function getUserStore(env: Env) {
  const userStoreId = env.USER_STORE.idFromName('user-store')
  return env.USER_STORE.get(userStoreId)
}

/**
 * Handle admin get user details request
 */
async function handleAdminGetUser(
  request: Request,
  env: Env,
  userEmail: string
): Promise<Response> {
  try {
    // Verify admin access
    const adminError = await verifyAdminAccessOrReturnError(request, env)
    if (adminError) return adminError

    // Forward request to UserStore
    const userStore = getUserStore(env)
    const userStoreRequest = new Request(`http://localhost/get-user-by-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail }),
    })

    return await userStore.fetch(userStoreRequest)
  } catch (error) {
    console.error('Admin get user error:', error)
    return createAdminErrorResponse('Failed to get user')
  }
}

/**
 * Handle admin update user storeId request
 */
async function handleAdminUpdateStoreIds(
  request: Request,
  env: Env,
  userEmail: string
): Promise<Response> {
  try {
    // Verify admin access
    const adminError = await verifyAdminAccessOrReturnError(request, env)
    if (adminError) return adminError

    // Validate request body
    const { action, storeId } = await request.json()
    if (!action || !storeId || !['add', 'remove'].includes(action)) {
      return createAdminErrorResponse('Invalid request: action and storeId required', 400)
    }

    // Forward request to UserStore
    const userStore = getUserStore(env)
    const userStoreRequest = new Request(`http://localhost/update-user-store-ids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, action, storeId }),
    })

    return await userStore.fetch(userStoreRequest)
  } catch (error) {
    console.error('Admin update storeIds error:', error)
    return createAdminErrorResponse('Failed to update storeIds')
  }
}

/**
 * Handle admin update user admin status request
 */
async function handleAdminUpdateAdminStatus(
  request: Request,
  env: Env,
  userEmail: string
): Promise<Response> {
  try {
    // Verify admin access
    const adminError = await verifyAdminAccessOrReturnError(request, env)
    if (adminError) return adminError

    // Validate request body
    const { isAdmin } = await request.json()
    if (typeof isAdmin !== 'boolean') {
      return createAdminErrorResponse('Invalid request: isAdmin must be a boolean', 400)
    }

    // Forward request to UserStore
    const userStore = getUserStore(env)
    const userStoreRequest = new Request(`http://localhost/update-user-admin-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, isAdmin }),
    })

    return await userStore.fetch(userStoreRequest)
  } catch (error) {
    console.error('Admin update admin status error:', error)
    return createAdminErrorResponse('Failed to update admin status')
  }
}

/**
 * Handle admin delete user request
 */
async function handleAdminDeleteUser(
  request: Request,
  env: Env,
  userEmail: string
): Promise<Response> {
  try {
    // Verify admin access
    const adminError = await verifyAdminAccessOrReturnError(request, env)
    if (adminError) return adminError

    // Forward request to UserStore
    const userStore = getUserStore(env)
    const userStoreRequest = new Request(`http://localhost/delete-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail }),
    })

    return await userStore.fetch(userStoreRequest)
  } catch (error) {
    console.error('Admin delete user error:', error)
    return createAdminErrorResponse('Failed to delete user')
  }
}

/**
 * CORS headers for cross-origin requests
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, restrict to your domain
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
          // Handle dynamic admin routes
          if (path.startsWith('/admin/users/') && path.includes('/store-ids')) {
            const userEmail = decodeURIComponent(
              path.split('/admin/users/')[1].split('/store-ids')[0]
            )
            if (method !== 'POST') {
              return createErrorResponse('Method not allowed', 405)
            }
            return addCorsHeaders(await handleAdminUpdateStoreIds(request, env, userEmail))
          }

          if (path.startsWith('/admin/users/') && path.includes('/admin-status')) {
            const userEmail = decodeURIComponent(
              path.split('/admin/users/')[1].split('/admin-status')[0]
            )
            if (method !== 'POST') {
              return createErrorResponse('Method not allowed', 405)
            }
            return addCorsHeaders(await handleAdminUpdateAdminStatus(request, env, userEmail))
          }

          if (path.startsWith('/admin/users/') && path.split('/').length === 4) {
            const userEmail = decodeURIComponent(path.split('/admin/users/')[1])
            if (method === 'GET') {
              return addCorsHeaders(await handleAdminGetUser(request, env, userEmail))
            } else if (method === 'DELETE') {
              return addCorsHeaders(await handleAdminDeleteUser(request, env, userEmail))
            } else {
              return createErrorResponse('Method not allowed', 405)
            }
          }

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
