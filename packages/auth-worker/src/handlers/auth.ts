import { AuthResponse, SignupRequest, LoginRequest, RefreshRequest, ErrorCode } from '../types.js'
import { validatePasswordStrength } from '../utils/crypto.js'
import { createAccessToken, createRefreshToken, verifyToken, isTokenExpired } from '../utils/jwt.js'
import type { RefreshTokenPayload } from '../types.js'

/**
 * Utility to create error responses
 */
function createErrorResponse(code: ErrorCode, message: string, status = 400): Response {
  const response: AuthResponse = {
    success: false,
    error: { code, message }
  }
  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

/**
 * Utility to create success responses
 */
function createSuccessResponse(data: Partial<AuthResponse>): Response {
  const response: AuthResponse = {
    success: true,
    ...data
  }
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  })
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Get UserStore Durable Object stub
 */
function getUserStore(env: Env): DurableObjectStub {
  const id = env.USER_STORE.idFromName('user-store')
  return env.USER_STORE.get(id)
}

/**
 * Handle user signup
 */
export async function handleSignup(request: Request, env: Env): Promise<Response> {
  try {
    const body: SignupRequest = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return createErrorResponse(ErrorCode.INVALID_REQUEST, 'Email and password are required')
    }

    if (!isValidEmail(email)) {
      return createErrorResponse(ErrorCode.INVALID_REQUEST, 'Invalid email format')
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return createErrorResponse(ErrorCode.WEAK_PASSWORD, passwordValidation.message!)
    }

    // Create user via UserStore
    const userStore = getUserStore(env)
    const userResponse = await userStore.fetch(new Request('http://userstore/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }))

    if (!userResponse.ok) {
      const errorData = await userResponse.json()
      if (userResponse.status === 409) {
        return createErrorResponse(ErrorCode.EMAIL_ALREADY_EXISTS, 'An account with this email already exists')
      }
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to create user')
    }

    const userData = await userResponse.json()
    const user = userData.user

    // Generate tokens
    const accessToken = await createAccessToken(user.id, user.email, env)
    const refreshToken = await createRefreshToken(user.id, env)

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        instances: user.instances
      },
      accessToken,
      refreshToken
    })

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
    if (!email || !password) {
      return createErrorResponse(ErrorCode.INVALID_REQUEST, 'Email and password are required')
    }

    if (!isValidEmail(email)) {
      return createErrorResponse(ErrorCode.INVALID_REQUEST, 'Invalid email format')
    }

    // Verify credentials via UserStore
    const userStore = getUserStore(env)
    const credentialsResponse = await userStore.fetch(new Request('http://userstore/verify-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }))

    if (!credentialsResponse.ok) {
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to verify credentials')
    }

    const credentialsData = await credentialsResponse.json()
    
    if (!credentialsData.valid) {
      return createErrorResponse(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password')
    }

    const user = credentialsData.user

    // Generate tokens
    const accessToken = await createAccessToken(user.id, user.email, env)
    const refreshToken = await createRefreshToken(user.id, env)

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        instances: user.instances
      },
      accessToken,
      refreshToken
    })

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
    const userResponse = await userStore.fetch(new Request('http://userstore/get-user-by-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: payload.userId })
    }))

    if (!userResponse.ok) {
      return createErrorResponse(ErrorCode.USER_NOT_FOUND, 'User not found')
    }

    const userData = await userResponse.json()
    const user = userData.user

    // Generate new access token
    const accessToken = await createAccessToken(user.id, user.email, env)
    
    // Always rotate refresh token (recommended for high security)
    const newRefreshToken = await createRefreshToken(user.id, env)

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        instances: user.instances
      },
      accessToken,
      refreshToken: newRefreshToken
    })

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
export async function handleLogout(request: Request, env: Env): Promise<Response> {
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
}

interface DurableObjectStub {
  fetch(request: Request): Promise<Response>
}