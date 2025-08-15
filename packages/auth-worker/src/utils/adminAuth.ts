/**
 * Admin authentication utilities
 */

import { verifyToken } from './jwt.js'
import { isUserAdmin } from './admin.js'
import type { JWTPayload } from '../types.js'

/**
 * Verify admin access from Authorization header
 */
export async function verifyAdminAccess(request: Request, env: Env): Promise<{ valid: boolean; user?: JWTPayload; error?: string }> {
  // Get Authorization header
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return { valid: false, error: 'Authorization header missing' }
  }

  // Extract Bearer token
  const token = authHeader.replace(/^Bearer\s+/, '')
  if (!token) {
    return { valid: false, error: 'Invalid Authorization header format' }
  }

  // Verify JWT token
  const payload = await verifyToken<JWTPayload>(token, env)
  if (!payload) {
    return { valid: false, error: 'Invalid or expired token' }
  }

  // Check if user is admin (either via isAdmin flag or bootstrap email)
  if (!payload.isAdmin) {
    // Check bootstrap admin as fallback
    const bootstrapAdminEmail = env.BOOTSTRAP_ADMIN_EMAIL
    if (!bootstrapAdminEmail || payload.email !== bootstrapAdminEmail) {
      return { valid: false, error: 'Admin privileges required' }
    }
  }

  return { valid: true, user: payload }
}

// Environment interface
interface Env {
  JWT_SECRET?: string
  USER_STORE: any
  BOOTSTRAP_ADMIN_EMAIL?: string
}