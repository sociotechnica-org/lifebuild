import { makeDurableObject, makeWorker } from '@livestore/sync-cf/cf-worker'
import {
  verifyJWT,
  isWithinGracePeriod,
  DEFAULT_GRACE_PERIOD_SECONDS,
  DEV_AUTH,
  ENV_VARS,
  AuthErrorCode,
} from '@work-squared/shared/auth'

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
async function validateSyncPayload(
  payload: any,
  env: any
): Promise<{ userId: string; isGracePeriod?: boolean }> {
  const requireAuth =
    env[ENV_VARS.REQUIRE_AUTH] === 'true' || env[ENV_VARS.ENVIRONMENT] === 'production'

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
    return makeWorker({
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

// Custom worker that handles both WebSocket sync and HTTP API endpoints
export default {
  async fetch(request: Request, env: any, ctx?: any): Promise<Response> {
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
      return worker.fetch(request as any, env, ctx) as any
    }

    // For all other requests, use the ASSETS binding to serve static files
    // This handles both static assets and SPA routing
    return env.ASSETS.fetch(request)
  },
}
