import * as SyncBackend from '@livestore/sync-cf/cf-worker'

import type { CfTypes, Env as SyncEnv } from '@livestore/sync-cf/cf-worker'
import {
  verifyJWT,
  isWithinGracePeriod,
  DEFAULT_GRACE_PERIOD_SECONDS,
  DEV_AUTH,
  ENV_VARS,
  AuthErrorCode,
} from '@work-squared/shared/auth'

// Extend the Env type to include R2 bucket binding and other environment variables
export interface Env extends SyncEnv {
  IMAGES: CfTypes.R2Bucket
  REQUIRE_AUTH?: string
  ENVIRONMENT?: string
  JWT_SECRET?: string
  GRACE_PERIOD_SECONDS?: string
  SERVER_BYPASS_TOKEN?: string
  R2_PUBLIC_URL?: string
  AUTH_WORKER_URL?: string
}

// Cache for workspace ownership validation (in-memory per execution context)
interface WorkspaceValidationCache {
  [key: string]: {
    isValid: boolean
    timestamp: number
  }
}

const workspaceCache: WorkspaceValidationCache = {}
const CACHE_TTL_MS = 60000 // 1 minute

export class SyncBackendDO extends SyncBackend.makeDurableObject({
  onPush: async (message, context) => {
    console.log(
      'onPush',
      message.batch.length,
      'events',
      'storeId:',
      context.storeId,
      'payload:',
      context.payload
    )
  },
  onPull: async function (message, context) {
    console.log('onPull', message, 'storeId:', context.storeId, 'payload:', context.payload)
  },
}) {}

/**
 * Verify that a user owns a specific workspace by calling the auth worker's internal endpoint
 */
async function verifyWorkspaceOwnership(
  userId: string,
  instanceId: string,
  env: Env
): Promise<boolean> {
  // Check cache first
  const cacheKey = `${userId}:${instanceId}`
  const cached = workspaceCache[cacheKey]
  const now = Date.now()

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    console.log(`Cache hit for workspace validation: ${cacheKey}`)
    return cached.isValid
  }

  // Call auth worker internal endpoint
  const authWorkerUrl =
    env.AUTH_WORKER_URL ||
    (env.ENVIRONMENT === 'production' ? 'https://auth.coconut.app' : 'http://localhost:8788')
  const serverBypassToken = env.SERVER_BYPASS_TOKEN

  if (!serverBypassToken) {
    console.error('SERVER_BYPASS_TOKEN not configured for workspace verification')
    throw new Error(`${AuthErrorCode.AUTH_SERVICE_ERROR}: Server bypass token not configured`)
  }

  try {
    const response = await fetch(`${authWorkerUrl}/internal/users/${userId}/instances`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${serverBypassToken}`,
      },
    })

    if (!response.ok) {
      console.error(`Auth worker returned ${response.status} for user ${userId}`)
      // Cache negative result briefly to avoid hammering the auth worker
      workspaceCache[cacheKey] = { isValid: false, timestamp: now }
      return false
    }

    const data = (await response.json()) as { instances: Array<{ id: string }> }
    const hasAccess = data.instances.some(inst => inst.id === instanceId)

    // Cache the result
    workspaceCache[cacheKey] = { isValid: hasAccess, timestamp: now }

    console.log(`Workspace validation for ${cacheKey}: ${hasAccess}`)
    return hasAccess
  } catch (error) {
    console.error('Error verifying workspace ownership:', error)
    throw new Error(`${AuthErrorCode.AUTH_SERVICE_ERROR}: Failed to verify workspace ownership`)
  }
}

/**
 * Validate sync payload and authenticate user
 */
async function validateSyncPayload(
  payload: any,
  env: any
): Promise<{ userId: string; isGracePeriod?: boolean }> {
  const requireAuth =
    env[ENV_VARS.REQUIRE_AUTH] === 'true' || env[ENV_VARS.ENVIRONMENT] === 'production'

  // Development mode - allow unauthenticated access (skip workspace validation)
  if (!requireAuth) {
    console.log('Auth disabled in development mode')
    return { userId: DEV_AUTH.DEFAULT_USER_ID }
  }

  // Server bypass - allow internal server connections without JWT (skip workspace validation)
  if (payload?.serverBypass === env[ENV_VARS.SERVER_BYPASS_TOKEN]) {
    console.log('Server bypass authenticated')
    return { userId: 'server-internal' }
  }

  // Check for auth token
  const authToken = payload?.authToken
  if (!authToken) {
    throw new Error(`${AuthErrorCode.TOKEN_MISSING}: Authentication required`)
  }

  // Handle legacy insecure token during transition (skip workspace validation in dev)
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
  const gracePeriodSeconds = parseInt(
    env[ENV_VARS.GRACE_PERIOD_SECONDS] || DEFAULT_GRACE_PERIOD_SECONDS.toString()
  )

  if (!isWithinGracePeriod(payload_decoded, gracePeriodSeconds)) {
    throw new Error(`${AuthErrorCode.GRACE_PERIOD_EXPIRED}: Token expired beyond grace period`)
  }

  const isGracePeriod = payload_decoded.exp < Math.floor(Date.now() / 1000)
  if (isGracePeriod) {
    console.log(
      `User ${payload_decoded.userId} authenticated with expired token within grace period`
    )
  }

  // Verify workspace ownership
  const instanceId = payload?.instanceId
  if (!instanceId) {
    throw new Error(`${AuthErrorCode.TOKEN_MISSING}: Workspace ID (instanceId) required`)
  }

  const hasAccess = await verifyWorkspaceOwnership(payload_decoded.userId, instanceId, env)
  if (!hasAccess) {
    throw new Error(
      `${AuthErrorCode.FORBIDDEN}: User ${payload_decoded.userId} does not have access to workspace ${instanceId}`
    )
  }

  return {
    userId: payload_decoded.userId,
    isGracePeriod,
  }
}

// Create worker instance that captures env in closure
function createWorkerWithAuth(env: any) {
  const requireAuth =
    env[ENV_VARS.REQUIRE_AUTH] === 'true' || env[ENV_VARS.ENVIRONMENT] === 'production'

  // If auth is disabled, use simple token validation like main branch for compatibility
  if (!requireAuth) {
    console.log('Auth disabled - accepting both dev tokens and JWT tokens for development')
    return SyncBackend.makeWorker({
      validatePayload: async (payload: any) => {
        // Accept the insecure dev token
        if (payload?.authToken === DEV_AUTH.INSECURE_TOKEN) {
          return
        }

        // Also try to validate as JWT for logged-in users
        try {
          await validateSyncPayload(payload, env)
          // If JWT validation succeeds, allow it
          return
        } catch {
          // If both dev token and JWT validation fail, reject
          throw new Error('Invalid auth token')
        }
      },
      enableCORS: true,
    })
  }

  // Auth is enabled - use full JWT validation
  return SyncBackend.makeWorker({
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

// Custom worker that handles both WebSocket sync and HTTP API endpoints
const fetchHandler = async (
  request: CfTypes.Request,
  env: Env,
  ctx: CfTypes.ExecutionContext
): Promise<Response> => {
  const url = new URL(request.url)

  // Handle CORS preflight for all routes
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // Handle image upload endpoint
  if (url.pathname === '/api/upload-image' && request.method === 'POST') {
    const { handleImageUpload } = await import('./upload-image.js')
    return handleImageUpload(request as unknown as Request, env)
  }

  // Handle image retrieval endpoint
  const imageMatch = url.pathname.match(/^\/api\/images\/(.+)$/)
  if (imageMatch && request.method === 'GET') {
    const { handleImageGet } = await import('./upload-image.js')
    return handleImageGet(request as unknown as Request, env, imageMatch[1])
  }

  const requestParamsResult = SyncBackend.getSyncRequestSearchParams(request)

  if (requestParamsResult._tag === 'Some') {
    // Extract storeId from search params for workspace-based routing
    // LiveStore already routes by storeId to separate Durable Object instances
    // The validatePayload callback ensures the user owns the workspace (instanceId)
    return (await SyncBackend.handleSyncRequest({
      request,
      searchParams: requestParamsResult.value,
      env: env as any,
      ctx,
      options: {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        durableObject: { name: 'WEBSOCKET_SERVER' },
      },
    })) as unknown as Response
  }

  // Handle WebSocket upgrade requests - create worker with auth
  if (request.headers.get('upgrade') === 'websocket') {
    const worker = createWorkerWithAuth(env)
    return (await worker.fetch(request, env, ctx)) as unknown as Response
  }

  return new Response('Not found', { status: 404 })
}

export default { fetch: fetchHandler }
