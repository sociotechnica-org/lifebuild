import {
  AuthResponse,
  SignupRequest,
  LoginRequest,
  RefreshRequest,
  ErrorCode,
  Instance,
  WorkspaceInvitation,
} from '../types.js'
import { validatePasswordStrength } from '../utils/crypto.js'
import { createAccessToken, createRefreshToken, verifyToken, isTokenExpired } from '../utils/jwt.js'
import { isUserAdmin } from '../utils/admin.js'
import type { RefreshTokenPayload } from '../types.js'
import { sendDiscordNotification } from '../utils/discord.js'
import { notifyWorkspaceEvent } from '../workspace-notifier.js'
import {
  buildWorkspaceClaims,
  isWorkspaceClaimsPayloadWithinLimit,
  WORKSPACE_CLAIMS_MAX_BYTES,
} from '@lifebuild/shared/auth'

type WorkerExecutionContext = {
  waitUntil(promise: Promise<unknown>): void
}

/**
 * Utility to create error responses
 */
function createErrorResponse(code: ErrorCode, message: string, status = 400): Response {
  const response: AuthResponse = {
    success: false,
    error: { code, message },
  }
  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Utility to create success responses
 */
function createSuccessResponse(data: Partial<AuthResponse>): Response {
  const response: AuthResponse = {
    success: true,
    ...data,
  }
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  })
}

function selectDefaultInstanceId(instances: Instance[] = []): string | null {
  if (!Array.isArray(instances) || instances.length === 0) {
    return null
  }
  const preferred = instances.find(instance => instance.isDefault)
  return (preferred ?? instances[0]).id ?? null
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate email and password input
 */
function validateEmailPassword(email: string, password: string): Response | null {
  if (!email || !password) {
    return createErrorResponse(ErrorCode.INVALID_REQUEST, 'Email and password are required')
  }

  if (!isValidEmail(email)) {
    return createErrorResponse(ErrorCode.INVALID_REQUEST, 'Invalid email format')
  }

  return null // Valid
}

/**
 * Get UserStore Durable Object stub
 */
function getUserStore(env: Env): DurableObjectStub {
  const id = env.USER_STORE.idFromName('user-store')
  return env.USER_STORE.get(id)
}

type WorkspaceSnapshotResponse = {
  instances?: Instance[]
  defaultInstanceId?: string | null
  workspaces?: Record<string, any>
  pendingInvitations?: WorkspaceInvitation[]
  workspaceClaimsVersion?: number
}

async function fetchWorkspaceSnapshot(
  userId: string,
  env: Env
): Promise<WorkspaceSnapshotResponse | null> {
  try {
    const userStore = getUserStore(env)
    const response = await userStore.fetch(
      new Request('http://userstore/workspaces/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
    )

    if (!response.ok) {
      return null
    }
    return (await response.json()) as WorkspaceSnapshotResponse
  } catch (error) {
    console.error('Failed to fetch workspace snapshot', error)
    return null
  }
}

/**
 * Create auth success response with tokens
 */
async function createAuthSuccessResponse(
  user: any,
  env: Env,
  refreshToken?: string
): Promise<Response> {
  // Check if user is admin (bootstrap email or isAdmin flag)
  const adminStatus = isUserAdmin(user, env.BOOTSTRAP_ADMIN_EMAIL)

  // Generate tokens
  const workspaceSnapshot = await fetchWorkspaceSnapshot(user.id, env)
  const instances = workspaceSnapshot?.instances ?? user.instances
  const defaultInstanceId =
    workspaceSnapshot?.defaultInstanceId ?? selectDefaultInstanceId(instances)
  const workspaceClaimsVersion =
    workspaceSnapshot?.workspaceClaimsVersion ?? user.workspaceClaimsVersion ?? 0

  const workspaceClaims = buildWorkspaceClaims(instances ?? [])
  const claimsSize = isWorkspaceClaimsPayloadWithinLimit(
    workspaceClaims,
    WORKSPACE_CLAIMS_MAX_BYTES
  )
  if (!claimsSize.withinLimit) {
    console.warn(
      `Workspace claims payload exceeded limit (${claimsSize.byteSize} bytes) for user ${user.id}`
    )
  } else if (claimsSize.byteSize > WORKSPACE_CLAIMS_MAX_BYTES * 0.75) {
    console.warn(
      `Workspace claims payload approaching limit (${claimsSize.byteSize} bytes) for user ${user.id}`
    )
  }

  const accessToken = await createAccessToken(
    {
      userId: user.id,
      email: user.email,
      isAdmin: adminStatus,
      defaultInstanceId,
      workspaces: workspaceClaims,
      workspaceClaimsVersion,
      workspaceClaimsIssuedAt: Math.floor(Date.now() / 1000),
    },
    env
  )
  const newRefreshToken = refreshToken || (await createRefreshToken(user.id, env))

  return createSuccessResponse({
    user: {
      id: user.id,
      email: user.email,
      instances,
      isAdmin: adminStatus,
      defaultInstanceId,
      workspaces: workspaceSnapshot?.workspaces,
      pendingInvitations: workspaceSnapshot?.pendingInvitations,
      workspaceClaimsVersion,
    },
    accessToken,
    refreshToken: newRefreshToken,
  })
}

/**
 * Handle user signup
 */
export async function handleSignup(
  request: Request,
  env: Env,
  ctx?: WorkerExecutionContext
): Promise<Response> {
  try {
    const body: SignupRequest = await request.json()
    const { email, password } = body

    // Validate input
    const validationError = validateEmailPassword(email, password)
    if (validationError) return validationError

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return createErrorResponse(ErrorCode.WEAK_PASSWORD, passwordValidation.message!)
    }

    // Create user via UserStore
    const userStore = getUserStore(env)
    const userResponse = await userStore.fetch(
      new Request('http://userstore/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    )

    if (!userResponse.ok) {
      if (userResponse.status === 409) {
        return createErrorResponse(
          ErrorCode.EMAIL_ALREADY_EXISTS,
          'An account with this email already exists'
        )
      }
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to create user')
    }

    const userData = await userResponse.json()
    const user = userData.user

    await sendDiscordNotification(
      `🏠 New LifeBuild account created: \`${email}\``,
      env.DISCORD_WEBHOOK_URL
    )

    // Notify the server about the new default workspace so it can start monitoring
    const defaultInstance = user.instances?.find((inst: Instance) => inst.isDefault)
    if (defaultInstance?.id) {
      ctx?.waitUntil(
        notifyWorkspaceEvent(env, {
          event: 'workspace.created',
          instanceId: defaultInstance.id,
          userId: user.id,
          timestamp: new Date().toISOString(),
        }).catch(error => {
          console.error('Signup workspace webhook scheduling failed', { error })
        })
      )
    }

    return await createAuthSuccessResponse(user, env)
  } catch (error) {
    console.error('Signup error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Internal server error')
  }
}

/**
 * Handle user login
 */
export async function handleLogin(request: Request, env: Env): Promise<Response> {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // Validate input
    const validationError = validateEmailPassword(email, password)
    if (validationError) return validationError

    // Verify credentials via UserStore
    const userStore = getUserStore(env)
    const credentialsResponse = await userStore.fetch(
      new Request('http://userstore/verify-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    )

    if (!credentialsResponse.ok) {
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to verify credentials')
    }

    const credentialsData = await credentialsResponse.json()

    if (!credentialsData.valid) {
      return createErrorResponse(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password')
    }

    const user = credentialsData.user

    return await createAuthSuccessResponse(user, env)
  } catch (error) {
    console.error('Login error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Internal server error')
  }
}

/**
 * Handle token refresh
 */
export async function handleRefresh(request: Request, env: Env): Promise<Response> {
  try {
    const body: RefreshRequest = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return createErrorResponse(ErrorCode.INVALID_REQUEST, 'Refresh token is required')
    }

    // Verify refresh token
    const payload = await verifyToken<RefreshTokenPayload>(refreshToken, env)
    if (!payload) {
      return createErrorResponse(ErrorCode.INVALID_TOKEN, 'Invalid refresh token')
    }

    // Check if token is expired
    if (isTokenExpired(payload)) {
      return createErrorResponse(ErrorCode.TOKEN_EXPIRED, 'Refresh token has expired')
    }

    // Get user data
    const userStore = getUserStore(env)
    const userResponse = await userStore.fetch(
      new Request('http://userstore/get-user-by-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: payload.userId }),
      })
    )

    if (!userResponse.ok) {
      return createErrorResponse(ErrorCode.USER_NOT_FOUND, 'User not found')
    }

    const userData = await userResponse.json()
    const user = userData.user

    // Always rotate refresh token (recommended for high security)
    const newRefreshToken = await createRefreshToken(user.id, env)

    return await createAuthSuccessResponse(user, env, newRefreshToken)
  } catch (error) {
    console.error('Refresh error:', error)
    // Don't catch token verification errors - let them bubble up as INVALID_TOKEN
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse(ErrorCode.INVALID_TOKEN, 'Invalid refresh token')
    }
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Internal server error')
  }
}

/**
 * Handle logout
 */
export async function handleLogout(_request: Request, _env: Env): Promise<Response> {
  try {
    // For now, we just return success since we're using stateless JWTs
    // In a full implementation, we might maintain a token blacklist
    // or store refresh tokens in the UserStore for revocation

    return createSuccessResponse({})
  } catch (error) {
    console.error('Logout error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Internal server error')
  }
}

// Environment and types interfaces
interface Env {
  JWT_SECRET?: string
  USER_STORE: any
  BOOTSTRAP_ADMIN_EMAIL?: string
  DISCORD_WEBHOOK_URL?: string
  SERVER_WEBHOOK_URL?: string
  WEBHOOK_SECRET?: string
}

interface DurableObjectStub {
  fetch(request: Request): Promise<Response>
}
