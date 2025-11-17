import * as SyncBackend from '@livestore/sync-cf/cf-worker'

import type { CfTypes, Env as SyncEnv } from '@livestore/sync-cf/cf-worker'
import {
  verifyJWT,
  isWithinGracePeriod,
  DEFAULT_GRACE_PERIOD_SECONDS,
  DEV_AUTH,
  ENV_VARS,
  AuthErrorCode,
  getWorkspaceClaimsVersionKey,
  type JWTPayload,
} from '@work-squared/shared/auth'
import {
  getWorkspaceClaimForInstance,
  getWorkspaceClaimsByteSize,
} from '../src/auth/workspace-claims.js'

type WorkspaceClaimsKVNamespace = {
  get(key: string): Promise<string | null>
}

// Extend the Env type to include R2 bucket binding and other environment variables
export interface Env extends SyncEnv {
  IMAGES: CfTypes.R2Bucket
  REQUIRE_AUTH?: string
  ENVIRONMENT?: string
  JWT_SECRET?: string
  GRACE_PERIOD_SECONDS?: string
  SERVER_BYPASS_TOKEN?: string
  R2_PUBLIC_URL?: string
  WORKSPACE_CLAIMS_VERSION?: WorkspaceClaimsKVNamespace
}

const WORKSPACE_VERSION_CACHE_TTL_MS = 60 * 1000
const WORKSPACE_CLAIMS_WARNING_BYTES = 3000

interface WorkspaceVersionCacheEntry {
  version: number | null
  expiresAt: number
}

const workspaceVersionCache: Record<string, WorkspaceVersionCacheEntry> = {}
let missingKvWarningLogged = false

function cacheWorkspaceVersion(userId: string, version: number | null) {
  workspaceVersionCache[userId] = {
    version,
    expiresAt: Date.now() + WORKSPACE_VERSION_CACHE_TTL_MS,
  }
}

async function getLatestWorkspaceClaimsVersion(userId: string, env: Env): Promise<number | null> {
  const cached = workspaceVersionCache[userId]
  const now = Date.now()
  if (cached && cached.expiresAt > now) {
    return cached.version
  }

  if (!env.WORKSPACE_CLAIMS_VERSION) {
    if (!missingKvWarningLogged) {
      console.warn(
        'WORKSPACE_CLAIMS_VERSION binding not configured; unable to enforce claim versions'
      )
      missingKvWarningLogged = true
    }
    return null
  }

  try {
    const raw = await env.WORKSPACE_CLAIMS_VERSION.get(getWorkspaceClaimsVersionKey(userId))
    if (raw === null) {
      cacheWorkspaceVersion(userId, null)
      return null
    }

    const parsed = Number(raw)
    if (Number.isNaN(parsed)) {
      console.warn(`Invalid workspace claims version in KV for ${userId}: ${raw}`)
      cacheWorkspaceVersion(userId, null)
      return null
    }

    cacheWorkspaceVersion(userId, parsed)
    return parsed
  } catch (error) {
    console.error({ userId, error }, 'Failed to fetch workspace claims version from KV')
    cacheWorkspaceVersion(userId, null)
    return null
  }
}

function logWorkspaceClaimsSize(userId: string, size: number) {
  if (size > WORKSPACE_CLAIMS_WARNING_BYTES) {
    console.warn(`Workspace claims payload for ${userId} is ${size} bytes`)
  }
}

async function ensureWorkspaceClaimsVersionFresh(payload: JWTPayload, env: Env): Promise<void> {
  if (typeof payload.workspaceClaimsVersion !== 'number') {
    throw new Error(`${AuthErrorCode.TOKEN_INVALID}: Workspace claims version missing from token`)
  }

  const latestVersion = await getLatestWorkspaceClaimsVersion(payload.userId, env)
  if (latestVersion !== null && payload.workspaceClaimsVersion < latestVersion) {
    throw new Error(
      `${AuthErrorCode.TOKEN_VERSION_STALE}: Workspace membership changed, refresh token`
    )
  }
}

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

  // Server bypass - allow internal server connections without JWT
  // However, still require explicit instanceId to prevent unrestricted access
  if (payload?.serverBypass === env[ENV_VARS.SERVER_BYPASS_TOKEN]) {
    const instanceId = payload?.instanceId
    if (!instanceId) {
      throw new Error(
        `${AuthErrorCode.TOKEN_MISSING}: Workspace ID (instanceId) required even for server bypass`
      )
    }
    console.log(`Server bypass authenticated for workspace: ${instanceId}`)
    // Server bypass is trusted, so skip auth worker validation
    // But we still enforce explicit workspace selection
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

  const claimsByteSize = getWorkspaceClaimsByteSize(payload_decoded)
  logWorkspaceClaimsSize(payload_decoded.userId, claimsByteSize)

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
  await ensureWorkspaceClaimsVersionFresh(payload_decoded, env)

  const claimCheck = getWorkspaceClaimForInstance(payload_decoded, instanceId)
  if (!claimCheck.ok) {
    const reason =
      claimCheck.reason === 'missing_claims'
        ? 'Workspace claims missing from token'
        : `User ${payload_decoded.userId} does not have access to workspace ${instanceId}`
    throw new Error(`${AuthErrorCode.FORBIDDEN}: ${reason}`)
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
      validatePayload: async (payload: any, context?: any) => {
        // CRITICAL: Even in dev mode, enforce workspace isolation
        const requestedStoreId = context?.storeId || payload?.storeId
        const authenticatedInstanceId = payload?.instanceId

        // Require instanceId to be present and match storeId
        if (!authenticatedInstanceId) {
          throw new Error('Workspace ID (instanceId) required even in development mode')
        }

        if (requestedStoreId && requestedStoreId !== authenticatedInstanceId) {
          console.error(
            `StoreId mismatch (dev mode): requested=${requestedStoreId}, authenticated=${authenticatedInstanceId}`
          )
          throw new Error('Workspace mismatch')
        }

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
    validatePayload: async (payload: any, context?: any) => {
      console.log('Validating sync payload:', Object.keys(payload || {}))

      try {
        const authResult = await validateSyncPayload(payload, env)
        console.log(`Authentication successful for user: ${authResult.userId}`)
        if (authResult.isGracePeriod) {
          console.log('User authenticated within grace period')
        }

        // CRITICAL SECURITY: Ensure instanceId matches the storeId being accessed
        // This prevents a user from authenticating with workspace A but accessing workspace B
        const requestedStoreId = context?.storeId || payload?.storeId
        const authenticatedInstanceId = payload?.instanceId

        if (
          requestedStoreId &&
          authenticatedInstanceId &&
          requestedStoreId !== authenticatedInstanceId
        ) {
          console.error(
            `StoreId mismatch: requested=${requestedStoreId}, authenticated=${authenticatedInstanceId}`
          )
          throw new Error(
            `${AuthErrorCode.FORBIDDEN}: Workspace mismatch - cannot access workspace ${requestedStoreId} with credentials for ${authenticatedInstanceId}`
          )
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
