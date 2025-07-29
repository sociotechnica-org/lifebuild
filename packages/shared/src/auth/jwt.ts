/**
 * Shared JWT utilities for Work Squared
 * Used by both worker sync server and frontend auth
 */

export interface JWTPayload {
  userId: string
  email: string
  jti?: string  // JWT ID for uniqueness
  iat: number   // issued at
  exp: number   // expires at
  iss: string   // issuer
}

export interface RefreshTokenPayload {
  userId: string
  tokenId: string
  iat: number
  exp: number
  iss: string
}

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
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
  const binary = atob(padded)
  return new Uint8Array(binary.split('').map(c => c.charCodeAt(0)))
}

/**
 * Get JWT signing key from secret
 */
async function getJWTKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

/**
 * Verify and decode a JWT token
 * Returns null if invalid or verification fails
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    
    const [headerEncoded, payloadEncoded, signatureEncoded] = parts
    const message = `${headerEncoded}.${payloadEncoded}`
    
    // Verify signature
    const key = await getJWTKey(secret)
    const encoder = new TextEncoder()
    const signature = base64UrlDecode(signatureEncoded)
    
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(message))
    if (!isValid) {
      return null
    }
    
    // Decode payload
    const payloadBytes = base64UrlDecode(payloadEncoded)
    const payloadText = new TextDecoder().decode(payloadBytes)
    const payload = JSON.parse(payloadText) as JWTPayload
    
    return payload
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}

/**
 * Check if a token is expired (with optional grace period)
 */
export function isTokenExpired(payload: JWTPayload, gracePeriodSeconds = 0): boolean {
  const now = Math.floor(Date.now() / 1000)
  return now > (payload.exp + gracePeriodSeconds)
}

/**
 * Extract payload from token without verification (for expired token handling)
 * Use with caution - always verify tokens in security-critical contexts
 */
export function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    
    const payloadBytes = base64UrlDecode(parts[1])
    const payloadText = new TextDecoder().decode(payloadBytes)
    return JSON.parse(payloadText) as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Check if token is within grace period (expired but recently)
 */
export function isWithinGracePeriod(payload: JWTPayload, gracePeriodSeconds: number): boolean {
  if (!isTokenExpired(payload, 0)) {
    return true // Token is still valid
  }
  
  // Token is expired, check if within grace period
  return !isTokenExpired(payload, gracePeriodSeconds)
}

/**
 * Get user ID from token without full verification
 * Returns null if token is malformed
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJWTPayload(token)
  return payload?.userId || null
}