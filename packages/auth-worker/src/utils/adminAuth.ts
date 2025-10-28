/**
 * Admin authentication utilities
 */

import { verifyToken } from './jwt.js'
import type { JWTPayload } from '../types.js'

/**
 * Verify admin access from Authorization header
 */
export async function verifyAdminAccess(
  request: Request,
  env: Env
): Promise<{ valid: boolean; user?: JWTPayload; error?: string; statusCode?: number }> {
  // Get Authorization header
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return { valid: false, error: 'Authorization header missing', statusCode: 401 }
  }

  // Extract Bearer token
  const token = authHeader.replace(/^Bearer\s+/, '')
  if (!token) {
    return { valid: false, error: 'Invalid Authorization header format', statusCode: 401 }
  }

  // Verify JWT token
  const payload = await verifyToken<JWTPayload>(token, env)
  if (!payload) {
    return { valid: false, error: 'Invalid or expired token', statusCode: 401 }
  }

  // Check if user is admin (admin status already computed during token creation)
  if (!payload.isAdmin) {
    return { valid: false, error: 'Admin privileges required', statusCode: 403 }
  }

  return { valid: true, user: payload }
}

// Environment interface
interface Env {
  JWT_SECRET?: string
  USER_STORE: any
  BOOTSTRAP_ADMIN_EMAIL?: string
  DISCORD_WEBHOOK_URL?: string
  SERVER_WEBHOOK_URL?: string
  WEBHOOK_SECRET?: string
}
