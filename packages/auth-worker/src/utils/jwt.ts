import { JWTPayload, RefreshTokenPayload } from '../types.js'

/**
 * JWT utilities using WebCrypto API for Cloudflare Workers
 */

const ALGORITHM = 'HS256'
const ACCESS_TOKEN_EXPIRES_IN = 15 * 60 // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 // 7 days
const ISSUER = 'work-squared-auth'

/**
 * Base64URL encode
 */
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Base64URL decode
 */
function base64UrlDecode(data: string): Uint8Array {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  return new Uint8Array(binary.split('').map(c => c.charCodeAt(0)))
}

/**
 * Get the JWT secret key
 */
async function getJWTKey(env: Env): Promise<CryptoKey> {
  const secret = env.JWT_SECRET || 'dev-secret-please-change-in-production'
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)

  return await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

/**
 * Generate a random token ID for refresh tokens
 */
function generateTokenId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

export interface AccessTokenClaimsInput {
  userId: string
  email: string
  isAdmin: boolean
  defaultInstanceId?: string | null
  workspaces: NonNullable<JWTPayload['workspaces']>
  workspaceClaimsVersion: number
  workspaceClaimsIssuedAt?: number
}

/**
 * Create a JWT access token
 */
export async function createAccessToken(claims: AccessTokenClaimsInput, env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const jti = generateTokenId() // Add unique token ID

  const header = {
    alg: ALGORITHM,
    typ: 'JWT',
  }

  const payload: JWTPayload = {
    userId: claims.userId,
    email: claims.email,
    isAdmin: claims.isAdmin,
    jti, // Add unique token ID to ensure uniqueness
    iat: now,
    exp: now + ACCESS_TOKEN_EXPIRES_IN,
    iss: ISSUER,
    defaultInstanceId: claims.defaultInstanceId,
    workspaces: claims.workspaces,
    workspaceClaimsIssuedAt: claims.workspaceClaimsIssuedAt ?? now,
    workspaceClaimsVersion: claims.workspaceClaimsVersion,
  }

  const encoder = new TextEncoder()
  const headerEncoded = base64UrlEncode(encoder.encode(JSON.stringify(header)))
  const payloadEncoded = base64UrlEncode(encoder.encode(JSON.stringify(payload)))

  const message = `${headerEncoded}.${payloadEncoded}`
  const key = await getJWTKey(env)

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  const signatureEncoded = base64UrlEncode(new Uint8Array(signature))

  return `${message}.${signatureEncoded}`
}

/**
 * Create a JWT refresh token
 */
export async function createRefreshToken(userId: string, env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const tokenId = generateTokenId()

  const header = {
    alg: ALGORITHM,
    typ: 'JWT',
  }

  const payload: RefreshTokenPayload = {
    userId,
    tokenId,
    iat: now,
    exp: now + REFRESH_TOKEN_EXPIRES_IN,
    iss: ISSUER,
  }

  const encoder = new TextEncoder()
  const headerEncoded = base64UrlEncode(encoder.encode(JSON.stringify(header)))
  const payloadEncoded = base64UrlEncode(encoder.encode(JSON.stringify(payload)))

  const message = `${headerEncoded}.${payloadEncoded}`
  const key = await getJWTKey(env)

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  const signatureEncoded = base64UrlEncode(new Uint8Array(signature))

  return `${message}.${signatureEncoded}`
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken<T = JWTPayload>(token: string, env: Env): Promise<T | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts
    const message = `${headerEncoded}.${payloadEncoded}`

    // Verify signature
    const key = await getJWTKey(env)
    const encoder = new TextEncoder()
    const signature = base64UrlDecode(signatureEncoded)

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature as BufferSource,
      encoder.encode(message)
    )
    if (!isValid) {
      return null
    }

    // Decode payload
    const payloadBytes = base64UrlDecode(payloadEncoded)
    const payloadText = new TextDecoder().decode(payloadBytes)
    const payload = JSON.parse(payloadText) as T

    return payload
  } catch {
    return null
  }
}

/**
 * Check if a token is expired (with optional grace period)
 */
export function isTokenExpired(
  payload: JWTPayload | RefreshTokenPayload,
  gracePeriodSeconds = 0
): boolean {
  const now = Math.floor(Date.now() / 1000)
  return now > payload.exp + gracePeriodSeconds
}

/**
 * Extract payload from token without verification (for expired token handling)
 */
export function decodeTokenPayload<T = JWTPayload>(token: string): T | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payloadBytes = base64UrlDecode(parts[1])
    const payloadText = new TextDecoder().decode(payloadBytes)
    return JSON.parse(payloadText) as T
  } catch {
    return null
  }
}

// Environment interface for TypeScript
interface Env {
  JWT_SECRET?: string
  USER_STORE: any
  BOOTSTRAP_ADMIN_EMAIL?: string
  DISCORD_WEBHOOK_URL?: string
  SERVER_WEBHOOK_URL?: string
  WEBHOOK_SECRET?: string
}
