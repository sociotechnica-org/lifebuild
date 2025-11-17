import { UserStore } from './durable-objects/UserStore.js'
import { handleSignup, handleLogin, handleRefresh, handleLogout } from './handlers/auth.js'
import { verifyAdminAccess } from './utils/adminAuth.js'
import { verifyToken, isTokenExpired } from './utils/jwt.js'
import type { JWTPayload } from './types.js'
import { notifyWorkspaceEvent } from './workspace-notifier.js'

type WorkerExecutionContext = {
  waitUntil(promise: Promise<unknown>): void
}

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

async function verifyUserAccess(
  request: Request,
  env: Env
): Promise<{ valid: boolean; user?: JWTPayload; error?: string; statusCode?: number }> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Authorization header missing', statusCode: 401 }
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return { valid: false, error: 'Invalid Authorization header format', statusCode: 401 }
  }

  const payload = await verifyToken<JWTPayload>(token, env)
  if (!payload) {
    return { valid: false, error: 'Invalid token', statusCode: 401 }
  }

  if (isTokenExpired(payload)) {
    return { valid: false, error: 'Token expired', statusCode: 401 }
  }

  return { valid: true, user: payload }
}

/**
 * Get UserStore instance
 */
function getUserStore(env: Env) {
  const userStoreId = env.USER_STORE.idFromName('user-store')
  return env.USER_STORE.get(userStoreId)
}

async function forwardToUserStore(
  env: Env,
  path: string,
  body: Record<string, unknown>
): Promise<Response> {
  const userStore = getUserStore(env)
  const requestInit: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }

  return userStore.fetch(new Request(`http://userstore${path}`, requestInit))
}

async function parseRequestBody(request: Request): Promise<any> {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

async function handleWorkspaceList(request: Request, env: Env): Promise<Response> {
  const authCheck = await verifyUserAccess(request, env)
  if (!authCheck.valid) {
    return createErrorResponse(authCheck.error || 'Unauthorized', authCheck.statusCode || 401)
  }

  return forwardToUserStore(env, '/workspaces/list', {
    userId: authCheck.user!.userId,
  })
}

async function handleWorkspaceCreate(
  request: Request,
  env: Env,
  ctx?: WorkerExecutionContext
): Promise<Response> {
  const authCheck = await verifyUserAccess(request, env)
  if (!authCheck.valid) {
    return createErrorResponse(authCheck.error || 'Unauthorized', authCheck.statusCode || 401)
  }

  const body = await parseRequestBody(request)
  const name = typeof body.name === 'string' ? body.name : undefined

  const response = await forwardToUserStore(env, '/workspaces/create', {
    userId: authCheck.user!.userId,
    name,
  })

  if (response.ok) {
    ctx?.waitUntil(
      (async () => {
        try {
          const data = await response.clone().json()
          const instanceId = data?.instance?.id
          if (!instanceId) return
          await notifyWorkspaceEvent(env, {
            event: 'workspace.created',
            instanceId,
            userId: authCheck.user!.userId,
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error('Workspace create webhook scheduling failed', { error })
        }
      })()
    )
  }

  return response
}

async function handleWorkspaceRename(
  request: Request,
  env: Env,
  instanceId: string
): Promise<Response> {
  const authCheck = await verifyUserAccess(request, env)
  if (!authCheck.valid) {
    return createErrorResponse(authCheck.error || 'Unauthorized', authCheck.statusCode || 401)
  }

  const body = await parseRequestBody(request)
  if (typeof body.name !== 'string') {
    return createErrorResponse('Workspace name is required', 400)
  }

  return forwardToUserStore(env, '/workspaces/rename', {
    userId: authCheck.user!.userId,
    instanceId,
    name: body.name,
  })
}

async function handleWorkspaceSetDefault(
  request: Request,
  env: Env,
  instanceId: string
): Promise<Response> {
  const authCheck = await verifyUserAccess(request, env)
  if (!authCheck.valid) {
    return createErrorResponse(authCheck.error || 'Unauthorized', authCheck.statusCode || 401)
  }

  return forwardToUserStore(env, '/workspaces/set-default', {
    userId: authCheck.user!.userId,
    instanceId,
  })
}

async function handleWorkspaceDelete(
  request: Request,
  env: Env,
  instanceId: string,
  ctx?: WorkerExecutionContext
): Promise<Response> {
  const authCheck = await verifyUserAccess(request, env)
  if (!authCheck.valid) {
    return createErrorResponse(authCheck.error || 'Unauthorized', authCheck.statusCode || 401)
  }

  const response = await forwardToUserStore(env, '/workspaces/delete', {
    userId: authCheck.user!.userId,
    instanceId,
  })

  if (response.ok) {
    ctx?.waitUntil(
      notifyWorkspaceEvent(env, {
        event: 'workspace.deleted',
        instanceId,
        userId: authCheck.user!.userId,
        timestamp: new Date().toISOString(),
      }).catch(error => {
        console.error('Workspace delete webhook scheduling failed', { error })
      })
    )
  }

  return response
}

async function handleWorkspaceTouch(
  request: Request,
  env: Env,
  instanceId: string
): Promise<Response> {
  const authCheck = await verifyUserAccess(request, env)
  if (!authCheck.valid) {
    return createErrorResponse(authCheck.error || 'Unauthorized', authCheck.statusCode || 401)
  }

  return forwardToUserStore(env, '/workspaces/touch', {
    userId: authCheck.user!.userId,
    instanceId,
  })
}

async function handleWorkspaceInviteMember(
  request: Request,
  env: Env,
  instanceId: string
): Promise<Response> {
  const authCheck = await verifyUserAccess(request, env)
  if (!authCheck.valid) {
    return createErrorResponse(authCheck.error || 'Unauthorized', authCheck.statusCode || 401)
  }

  const body = await parseRequestBody(request)
  if (typeof body.email !== 'string' || body.email.trim().length === 0) {
    return createErrorResponse('Invitation email is required', 400)
  }

  const role = typeof body.role === 'string' ? body.role : undefined

  return forwardToUserStore(env, '/workspaces/invite-member', {
    userId: authCheck.user!.userId,
    instanceId,
    email: body.email,
    role,
  })
}

async function handleWorkspaceRevokeInvitation(
  request: Request,
  env: Env,
  instanceId: string,
  invitationId: string
): Promise<Response> {
  const authCheck = await verifyUserAccess(request, env)
  if (!authCheck.valid) {
    return createErrorResponse(authCheck.error || 'Unauthorized', authCheck.statusCode || 401)
  }

  return forwardToUserStore(env, '/workspaces/revoke-invitation', {
    userId: authCheck.user!.userId,
    instanceId,
    invitationId,
  })
}

async function handleWorkspaceRemoveMember(
  request: Request,
  env: Env,
  instanceId: string,
  targetUserId: string
): Promise<Response> {
  const authCheck = await verifyUserAccess(request, env)
  if (!authCheck.valid) {
    return createErrorResponse(authCheck.error || 'Unauthorized', authCheck.statusCode || 401)
  }

  return forwardToUserStore(env, '/workspaces/remove-member', {
    userId: authCheck.user!.userId,
    instanceId,
    targetUserId,
  })
}

async function handleWorkspaceUpdateMemberRole(
  request: Request,
  env: Env,
  instanceId: string,
  targetUserId: string
): Promise<Response> {
  const authCheck = await verifyUserAccess(request, env)
  if (!authCheck.valid) {
    return createErrorResponse(authCheck.error || 'Unauthorized', authCheck.statusCode || 401)
  }

  const body = await parseRequestBody(request)
  if (typeof body.role !== 'string') {
    return createErrorResponse('Role is required', 400)
  }

  return forwardToUserStore(env, '/workspaces/update-role', {
    userId: authCheck.user!.userId,
    instanceId,
    targetUserId,
    role: body.role,
  })
}

async function handleWorkspaceAcceptInvitation(request: Request, env: Env): Promise<Response> {
  const authCheck = await verifyUserAccess(request, env)
  if (!authCheck.valid) {
    return createErrorResponse(authCheck.error || 'Unauthorized', authCheck.statusCode || 401)
  }

  const body = await parseRequestBody(request)
  if (typeof body.token !== 'string' || body.token.trim().length === 0) {
    return createErrorResponse('Invitation token is required', 400)
  }

  return forwardToUserStore(env, '/workspaces/accept-invitation', {
    userId: authCheck.user!.userId,
    token: body.token,
  })
}

function verifyServerBypassToken(request: Request, env: Env): Response | null {
  if (!env.SERVER_BYPASS_TOKEN) {
    return createErrorResponse('Server bypass token not configured', 500)
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Forbidden', 403)
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (token !== env.SERVER_BYPASS_TOKEN) {
    return createErrorResponse('Forbidden', 403)
  }

  return null
}

async function handleInternalListWorkspaces(request: Request, env: Env): Promise<Response> {
  const authError = verifyServerBypassToken(request, env)
  if (authError) {
    return authError
  }

  return forwardToUserStore(env, '/internal/workspaces', {})
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
  async fetch(request: Request, env: Env, ctx: WorkerExecutionContext): Promise<Response> {
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

        case '/workspaces':
          if (method === 'GET') {
            return addCorsHeaders(await handleWorkspaceList(request, env))
          }
          if (method === 'POST') {
            return addCorsHeaders(await handleWorkspaceCreate(request, env, ctx))
          }
          return createErrorResponse('Method not allowed', 405)
        case '/workspaces/invitations/accept':
          if (method !== 'POST') {
            return createErrorResponse('Method not allowed', 405)
          }
          return addCorsHeaders(await handleWorkspaceAcceptInvitation(request, env))

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

          if (path.startsWith('/workspaces/')) {
            const segments = path.split('/').filter(Boolean)
            if (segments.length >= 2) {
              const instanceId = decodeURIComponent(segments[1])

              if (segments.length === 2) {
                if (method === 'DELETE') {
                  return addCorsHeaders(await handleWorkspaceDelete(request, env, instanceId, ctx))
                }
                return createErrorResponse('Method not allowed', 405)
              }

              if (segments.length === 3) {
                if (method !== 'POST') {
                  return createErrorResponse('Method not allowed', 405)
                }

                const action = segments[2]
                if (action === 'rename') {
                  return addCorsHeaders(await handleWorkspaceRename(request, env, instanceId))
                }
                if (action === 'set-default') {
                  return addCorsHeaders(await handleWorkspaceSetDefault(request, env, instanceId))
                }
                if (action === 'access') {
                  return addCorsHeaders(await handleWorkspaceTouch(request, env, instanceId))
                }
                if (action === 'invite') {
                  return addCorsHeaders(await handleWorkspaceInviteMember(request, env, instanceId))
                }

                return createErrorResponse('Not found', 404)
              }

              if (segments.length === 4) {
                const resource = segments[2]
                const resourceId = decodeURIComponent(segments[3])

                if (resource === 'invitations' && method === 'DELETE') {
                  return addCorsHeaders(
                    await handleWorkspaceRevokeInvitation(request, env, instanceId, resourceId)
                  )
                }

                if (resource === 'members' && method === 'DELETE') {
                  return addCorsHeaders(
                    await handleWorkspaceRemoveMember(request, env, instanceId, resourceId)
                  )
                }

                return createErrorResponse('Not found', 404)
              }

              if (segments.length === 5) {
                const [_, __, resource, memberId, action] = segments
                if (resource === 'members' && action === 'role') {
                  if (method !== 'POST') {
                    return createErrorResponse('Method not allowed', 405)
                  }
                  return addCorsHeaders(
                    await handleWorkspaceUpdateMemberRole(
                      request,
                      env,
                      instanceId,
                      decodeURIComponent(memberId)
                    )
                  )
                }

                return createErrorResponse('Not found', 404)
              }
            }
          }

          if (path === '/internal/workspaces') {
            if (method !== 'GET') {
              return createErrorResponse('Method not allowed', 405)
            }
            return addCorsHeaders(await handleInternalListWorkspaces(request, env))
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
  DISCORD_WEBHOOK_URL?: string
  SERVER_BYPASS_TOKEN?: string
  MAX_INSTANCES_PER_USER?: string | number
  SERVER_WEBHOOK_URL?: string
  WEBHOOK_SECRET?: string
}
